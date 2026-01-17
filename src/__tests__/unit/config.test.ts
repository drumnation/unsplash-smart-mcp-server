/**
 * Unit tests for config module
 */

import test from 'node:test';
import assert from 'node:assert';

test('Config Unit Tests', async (t) => {
  await t.test('config exports required properties', async () => {
    const { config } = await import('../../config.js');

    assert.ok(config.unsplash, 'config.unsplash should exist');
    assert.ok(config.download, 'config.download should exist');
    assert.ok(typeof config.unsplash.accessKey === 'string', 'accessKey should be string');
    assert.ok(typeof config.download.defaultDir === 'string', 'defaultDir should be string');
  });

  await t.test('test environment uses placeholder key', async () => {
    // In test environment, should use placeholder
    const { config } = await import('../../config.js');

    // If no real key is set, should have placeholder
    if (!process.env.UNSPLASH_ACCESS_KEY) {
      assert.strictEqual(
        config.unsplash.accessKey,
        'TEST_API_KEY_PLACEHOLDER',
        'Should use placeholder in test environment'
      );
    }
  });

  await t.test('defaultDir is absolute path', async () => {
    const { config } = await import('../../config.js');
    const path = await import('path');

    assert.ok(
      path.isAbsolute(config.download.defaultDir),
      'defaultDir should be absolute path'
    );
  });
});
