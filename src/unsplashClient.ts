import { createWriteStream } from 'fs';
import { ensureDir } from 'fs-extra';
import path from 'path';
import { Readable } from 'stream';
import { config } from './config.js';
import {
  Photo,
  PhotoSchema,
  SearchResults,
  SearchResultsSchema,
  DownloadTrackingSchema
} from './unsplashTypes.js';
import { z } from 'zod';

const API_BASE_URL = 'https://api.unsplash.com';
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class UnsplashClient {
  private accessKey: string;
  private rateLimitRemaining = 50;
  private rateLimitResetTime = 0;

  constructor() {
    this.accessKey = config.unsplash.accessKey;
  }

  /** Get current rate limit status */
  getRateLimitStatus(): { remaining: number; resetsAt: Date } {
    return {
      remaining: this.rateLimitRemaining,
      resetsAt: new Date(this.rateLimitResetTime)
    };
  }

  private updateRateLimitFromHeaders(headers: Headers): void {
    const remaining = headers.get('X-Ratelimit-Remaining');
    if (remaining) this.rateLimitRemaining = parseInt(remaining, 10);
    // Unsplash resets hourly
    this.rateLimitResetTime = Date.now() + 3600000;
  }

  /**
   * Make a request to the Unsplash API with retry logic
   */
  private async request<T>(
    endpoint: string,
    schema: z.ZodType<T>,
    params?: Record<string, string | number | undefined>,
    method: 'GET' | 'POST' = 'GET'
  ): Promise<T> {
    const url = new URL(`${API_BASE_URL}${endpoint}`);

    if (params && method === 'GET') {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const headers = {
      'Authorization': `Client-ID ${this.accessKey}`,
      'Accept-Version': 'v1',
      'Content-Type': 'application/json'
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url.toString(), { method, headers });
        this.updateRateLimitFromHeaders(response.headers);

        // Rate limited - wait and retry
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 60000;
          console.warn(`Rate limited. Waiting ${waitMs / 1000}s...`);
          await sleep(waitMs);
          continue;
        }

        // Server error - retry with backoff
        if (response.status >= 500 && attempt < MAX_RETRIES) {
          console.warn(`Server error ${response.status}, retrying in ${RETRY_DELAYS[attempt]}ms...`);
          await sleep(RETRY_DELAYS[attempt]);
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Unsplash API error (${response.status}): ${errorText}`);
        }

        // Handle no-content responses
        if (response.status === 204 || response.headers.get('content-length') === '0') {
          if (endpoint.includes('/download')) {
            return { url: '' } as unknown as T;
          }
          return {} as T;
        }

        const data = await response.json();
        const validation = schema.safeParse(data);

        if (!validation.success) {
          console.error('Unsplash API response validation failed:', validation.error.flatten());
          throw new Error('Invalid data received from Unsplash API');
        }

        return validation.data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Network errors - retry with backoff
        if (attempt < MAX_RETRIES && (error as NodeJS.ErrnoException).code === 'ECONNRESET') {
          console.warn(`Network error, retrying in ${RETRY_DELAYS[attempt]}ms...`);
          await sleep(RETRY_DELAYS[attempt]);
          continue;
        }

        if (attempt === MAX_RETRIES) break;
      }
    }

    console.error(`Failed after ${MAX_RETRIES + 1} attempts to ${endpoint}:`, lastError);
    throw lastError;
  }

  /**
   * Search photos by query
   */
  async searchPhotos(query: string, page: number = 1, perPage: number = 10): Promise<SearchResults> {
    return this.request('/search/photos', SearchResultsSchema, {
      query,
      page,
      per_page: perPage
    });
  }

  /**
   * Get a photo by ID
   */
  async getPhotoById(id: string): Promise<Photo> {
    return this.request(`/photos/${id}`, PhotoSchema);
  }

  /**
   * Track a photo download (required by Unsplash API terms)
   */
  async trackDownload(photoId: string): Promise<{ success: boolean }> {
    try {
      await this.request(`/photos/${photoId}/download`, DownloadTrackingSchema);
      return { success: true };
    } catch (error) {
      console.error(`Failed to track download for photo ${photoId}:`, error);
      return { success: false };
    }
  }

  /**
   * Download a photo to a local file with retry logic
   */
  async downloadPhoto(photo: Photo, downloadDir: string, customFilename?: string, customUrl?: string): Promise<string> {
    await ensureDir(downloadDir);
    await this.trackDownload(photo.id);

    const filenameBase = customFilename || `unsplash-${photo.id}`;
    const filename = `${filenameBase}.jpg`;
    const filePath = path.join(downloadDir, filename);
    const downloadUrl = customUrl || photo.urls.full;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(downloadUrl);

        if (!response.ok) {
          if (response.status >= 500 && attempt < MAX_RETRIES) {
            console.warn(`Download failed (${response.status}), retrying in ${RETRY_DELAYS[attempt]}ms...`);
            await sleep(RETRY_DELAYS[attempt]);
            continue;
          }
          throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
        }

        const fileStream = createWriteStream(filePath);

        if (response.body instanceof ReadableStream) {
          const reader = response.body.getReader();
          const readable = new Readable({
            async read() {
              const { done, value } = await reader.read();
              if (done) {
                this.push(null);
              } else {
                this.push(Buffer.from(value));
              }
            }
          });

          readable.pipe(fileStream);

          return await new Promise((resolve, reject) => {
            fileStream.on('finish', () => resolve(filePath));
            fileStream.on('error', reject);
          });
        } else {
          const buffer = await response.arrayBuffer();
          const nodeBuffer = Buffer.from(buffer);
          return await new Promise((resolve, reject) => {
            fileStream.write(nodeBuffer, (err) => {
              if (err) reject(err);
              else fileStream.end(() => resolve(filePath));
            });
          });
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < MAX_RETRIES) {
          console.warn(`Download error, retrying in ${RETRY_DELAYS[attempt]}ms...`);
          await sleep(RETRY_DELAYS[attempt]);
          continue;
        }
      }
    }

    console.error(`Failed to download photo ${photo.id} after ${MAX_RETRIES + 1} attempts:`, lastError);
    throw lastError;
  }
} 