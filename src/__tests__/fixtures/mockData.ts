/**
 * Mock data for testing - no real API calls needed
 */

import type { Photo, SearchResults } from '../../unsplashTypes.js';

export const mockPhoto: Photo = {
  id: 'mock-photo-123',
  width: 4000,
  height: 3000,
  color: '#ffffff',
  blur_hash: 'L5H2EC=PM+yV0g-mq.wG9c010J}I',
  description: 'A beautiful mock landscape photo',
  alt_description: 'Green hills under blue sky',
  urls: {
    raw: 'https://images.unsplash.com/mock-raw',
    full: 'https://images.unsplash.com/mock-full',
    regular: 'https://images.unsplash.com/mock-regular',
    small: 'https://images.unsplash.com/mock-small',
    thumb: 'https://images.unsplash.com/mock-thumb'
  },
  links: {
    self: 'https://api.unsplash.com/photos/mock-photo-123',
    html: 'https://unsplash.com/photos/mock-photo-123',
    download: 'https://unsplash.com/photos/mock-photo-123/download',
    download_location: 'https://api.unsplash.com/photos/mock-photo-123/download'
  },
  user: {
    id: 'mock-user-456',
    username: 'mockphotographer',
    name: 'Mock Photographer',
    portfolio_url: 'https://mockportfolio.com',
    bio: 'A mock photographer for testing',
    location: 'Test City',
    instagram_username: 'mockphotographer',
    twitter_username: 'mockphotographer'
  }
};

export const mockPortraitPhoto: Photo = {
  ...mockPhoto,
  id: 'mock-portrait-789',
  width: 2000,
  height: 3000,
  description: 'A portrait orientation photo',
  alt_description: 'Portrait mock image'
};

export const mockSquarePhoto: Photo = {
  ...mockPhoto,
  id: 'mock-square-101',
  width: 2000,
  height: 2000,
  description: 'A square photo',
  alt_description: 'Square mock image'
};

export const mockSearchResults: SearchResults = {
  total: 100,
  total_pages: 10,
  results: [mockPhoto, mockPortraitPhoto, mockSquarePhoto]
};

export const emptySearchResults: SearchResults = {
  total: 0,
  total_pages: 0,
  results: []
};

/**
 * Create a mock fetch function for testing
 */
export function createMockFetch(responses: Map<string, { status: number; body: unknown }>) {
  return async (url: string | URL, init?: RequestInit): Promise<Response> => {
    const urlString = url.toString();

    // Find matching response
    for (const [pattern, response] of responses) {
      if (urlString.includes(pattern)) {
        return {
          ok: response.status >= 200 && response.status < 300,
          status: response.status,
          statusText: response.status === 200 ? 'OK' : 'Error',
          headers: new Headers({
            'content-type': 'application/json',
            'content-length': JSON.stringify(response.body).length.toString()
          }),
          json: async () => response.body,
          text: async () => JSON.stringify(response.body),
          arrayBuffer: async () => new ArrayBuffer(0),
          body: null
        } as Response;
      }
    }

    // Default 404 for unmatched URLs
    return {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: new Headers(),
      json: async () => ({ error: 'Not found' }),
      text: async () => 'Not found'
    } as Response;
  };
}

/**
 * Standard mock responses for Unsplash API
 */
export const standardMockResponses = new Map<string, { status: number; body: unknown }>([
  ['/search/photos', { status: 200, body: mockSearchResults }],
  ['/photos/mock-photo-123/download', { status: 200, body: { url: 'https://download.url' } }],
  ['/photos/mock-portrait-789/download', { status: 200, body: { url: 'https://download.url' } }],
  ['/photos/mock-square-101/download', { status: 200, body: { url: 'https://download.url' } }],
  ['/photos/mock-photo-123', { status: 200, body: mockPhoto }],
]);
