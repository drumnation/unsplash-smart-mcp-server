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

export class UnsplashClient {
  private accessKey: string;

  constructor() {
    this.accessKey = config.unsplash.accessKey;
  }

  /**
   * Make a request to the Unsplash API
   */
  private async request<T>(
    endpoint: string,
    schema: z.ZodType<T>,
    params?: Record<string, string | number | undefined>,
    method: 'GET' | 'POST' = 'GET'
  ): Promise<T> {
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    
    // Add query parameters
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

    try {
      const response = await fetch(url.toString(), {
        method,
        headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Unsplash API error (${response.status}): ${errorText}`);
      }

      // Handle no-content responses (like download tracking)
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        if (endpoint.includes('/download')) {
          // Special case for download tracking
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
      console.error(`Error during Unsplash API request to ${endpoint}:`, error);
      throw error;
    }
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
   * Download a photo to a local file
   */
  async downloadPhoto(photo: Photo, downloadDir: string, customFilename?: string, customUrl?: string): Promise<string> {
    // Ensure the download directory exists
    await ensureDir(downloadDir);

    // Track the download first (required by Unsplash API terms)
    await this.trackDownload(photo.id);

    // Prepare the file path - using the photo ID to ensure uniqueness
    const filenameBase = customFilename || `unsplash-${photo.id}`;
    const filename = `${filenameBase}.jpg`;
    const filePath = path.join(downloadDir, filename);

    try {
      // Use the custom URL if provided, otherwise fall back to the default URL
      const downloadUrl = customUrl || photo.urls.full;
      
      // Fetch the image
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
      }

      // Stream the image to a file
      const fileStream = createWriteStream(filePath);
      
      if (response.body instanceof ReadableStream) {
        // For environments with native fetch
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
        
        return new Promise((resolve, reject) => {
          fileStream.on('finish', () => resolve(filePath));
          fileStream.on('error', reject);
        });
      } else {
        // Fallback for other environments
        const buffer = await response.arrayBuffer();
        const nodeBuffer = Buffer.from(buffer);
        return new Promise((resolve, reject) => {
          fileStream.write(nodeBuffer, (err) => {
            if (err) {
              reject(err);
            } else {
              fileStream.end(() => {
                resolve(filePath);
              });
            }
          });
        });
      }
    } catch (error) {
      console.error(`Error downloading photo ${photo.id}:`, error);
      throw error;
    }
  }
} 