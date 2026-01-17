/**
 * Unit tests for UnsplashClient
 * Uses mocked fetch - no real API calls
 */

import test from 'node:test';
import assert from 'node:assert';
import {
  mockPhoto,
  mockSearchResults,
  emptySearchResults,
  createMockFetch,
  standardMockResponses
} from '../fixtures/mockData.js';

// Store original fetch
const originalFetch = globalThis.fetch;

test('UnsplashClient Unit Tests', async (t) => {
  t.afterEach(() => {
    // Restore original fetch after each test
    globalThis.fetch = originalFetch;
  });

  await t.test('searchPhotos returns validated results', async () => {
    // Setup mock
    globalThis.fetch = createMockFetch(standardMockResponses) as typeof fetch;

    // Dynamic import to pick up mocked fetch
    const { UnsplashClient } = await import('../../unsplashClient.js');
    const client = new UnsplashClient();

    const results = await client.searchPhotos('nature', 1, 10);

    assert.strictEqual(results.total, 100);
    assert.strictEqual(results.total_pages, 10);
    assert.strictEqual(results.results.length, 3);
    assert.strictEqual(results.results[0].id, 'mock-photo-123');
  });

  await t.test('searchPhotos handles empty results', async () => {
    const emptyResponses = new Map([
      ['/search/photos', { status: 200, body: emptySearchResults }]
    ]);
    globalThis.fetch = createMockFetch(emptyResponses) as typeof fetch;

    const { UnsplashClient } = await import('../../unsplashClient.js');
    const client = new UnsplashClient();

    const results = await client.searchPhotos('nonexistent', 1, 10);

    assert.strictEqual(results.total, 0);
    assert.strictEqual(results.results.length, 0);
  });

  await t.test('getPhotoById returns single photo', async () => {
    const photoResponses = new Map([
      ['photos/mock-photo-123', { status: 200, body: mockPhoto }]
    ]);
    globalThis.fetch = createMockFetch(photoResponses) as typeof fetch;

    const { UnsplashClient } = await import('../../unsplashClient.js');
    const client = new UnsplashClient();

    const photo = await client.getPhotoById('mock-photo-123');

    assert.strictEqual(photo.id, 'mock-photo-123');
    assert.strictEqual(photo.user.username, 'mockphotographer');
  });

  await t.test('trackDownload returns success', async () => {
    globalThis.fetch = createMockFetch(standardMockResponses) as typeof fetch;

    const { UnsplashClient } = await import('../../unsplashClient.js');
    const client = new UnsplashClient();

    const result = await client.trackDownload('mock-photo-123');

    assert.strictEqual(result.success, true);
  });

  await t.test('trackDownload handles errors gracefully', async () => {
    const errorResponses = new Map([
      ['/download', { status: 500, body: { error: 'Server error' } }]
    ]);
    globalThis.fetch = createMockFetch(errorResponses) as typeof fetch;

    const { UnsplashClient } = await import('../../unsplashClient.js');
    const client = new UnsplashClient();

    const result = await client.trackDownload('mock-photo-123');

    assert.strictEqual(result.success, false);
  });

  await t.test('request throws on API error', async () => {
    const errorResponses = new Map([
      ['/search/photos', { status: 401, body: { errors: ['Invalid API key'] } }]
    ]);
    globalThis.fetch = createMockFetch(errorResponses) as typeof fetch;

    const { UnsplashClient } = await import('../../unsplashClient.js');
    const client = new UnsplashClient();

    await assert.rejects(
      async () => client.searchPhotos('test', 1, 10),
      /Unsplash API error/
    );
  });

  await t.test('request validates response schema', async () => {
    // Return invalid data that won't pass Zod validation
    const invalidResponses = new Map([
      ['/search/photos', { status: 200, body: { invalid: 'data' } }]
    ]);
    globalThis.fetch = createMockFetch(invalidResponses) as typeof fetch;

    const { UnsplashClient } = await import('../../unsplashClient.js');
    const client = new UnsplashClient();

    await assert.rejects(
      async () => client.searchPhotos('test', 1, 10),
      /Invalid data received from Unsplash API/
    );
  });
});
