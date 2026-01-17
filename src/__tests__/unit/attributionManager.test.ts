/**
 * Unit tests for AttributionManager
 */

import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs-extra';
import path from 'path';
import { mockPhoto } from '../fixtures/mockData.js';
import { AttributionManager } from '../../attributionManager.js';

const TEST_DIR = path.join(process.cwd(), 'test-attributions');

test('AttributionManager Unit Tests', async (t) => {
  t.beforeEach(async () => {
    await fs.ensureDir(TEST_DIR);
  });

  t.afterEach(async () => {
    await fs.remove(TEST_DIR);
  });

  await t.test('creates attribution database file', async () => {
    const manager = new AttributionManager(TEST_DIR);
    const filePath = path.join(TEST_DIR, 'test-image.jpg');

    manager.addAttribution(mockPhoto, filePath);

    const dbPath = path.join(TEST_DIR, 'unsplash-attributions.json');
    assert.ok(await fs.pathExists(dbPath), 'Database file should exist');
  });

  await t.test('addAttribution stores correct data', async () => {
    const manager = new AttributionManager(TEST_DIR);
    const filePath = path.join(TEST_DIR, 'test-image.jpg');

    const attribution = manager.addAttribution(mockPhoto, filePath);

    assert.strictEqual(attribution.id, mockPhoto.id);
    assert.strictEqual(attribution.photographer, mockPhoto.user.name);
    assert.strictEqual(attribution.source, 'Unsplash');
    assert.strictEqual(attribution.license, 'Unsplash License');
    assert.ok(attribution.downloadDate);
  });

  await t.test('getAttribution retrieves stored attribution', async () => {
    const manager = new AttributionManager(TEST_DIR);
    const filePath = path.join(TEST_DIR, 'test-image.jpg');

    manager.addAttribution(mockPhoto, filePath);
    const retrieved = manager.getAttribution(mockPhoto.id);

    assert.ok(retrieved);
    assert.strictEqual(retrieved.id, mockPhoto.id);
  });

  await t.test('getAttribution returns null for unknown id', async () => {
    const manager = new AttributionManager(TEST_DIR);

    const retrieved = manager.getAttribution('nonexistent-id');

    assert.strictEqual(retrieved, null);
  });

  await t.test('getAllAttributions returns all stored attributions', async () => {
    const manager = new AttributionManager(TEST_DIR);

    manager.addAttribution(mockPhoto, path.join(TEST_DIR, 'image1.jpg'));
    manager.addAttribution(
      { ...mockPhoto, id: 'photo-2', user: { ...mockPhoto.user, name: 'Other User' } },
      path.join(TEST_DIR, 'image2.jpg')
    );

    const all = manager.getAllAttributions();

    assert.strictEqual(all.length, 2);
  });

  await t.test('getAttributionsForProject filters by project path', async () => {
    const manager = new AttributionManager(TEST_DIR);
    const projectA = path.join(TEST_DIR, 'projectA');
    const projectB = path.join(TEST_DIR, 'projectB');

    manager.addAttribution(mockPhoto, path.join(projectA, 'image1.jpg'));
    manager.addAttribution(
      { ...mockPhoto, id: 'photo-2' },
      path.join(projectB, 'image2.jpg')
    );

    const projectAAttrs = manager.getAttributionsForProject(projectA);

    assert.strictEqual(projectAAttrs.length, 1);
    assert.strictEqual(projectAAttrs[0].id, mockPhoto.id);
  });

  await t.test('generateAttributionHtml produces valid HTML', async () => {
    const manager = new AttributionManager(TEST_DIR);
    manager.addAttribution(mockPhoto, path.join(TEST_DIR, 'image.jpg'));

    const html = manager.generateAttributionHtml();

    assert.ok(html.includes('<!DOCTYPE html>'));
    assert.ok(html.includes('Image Attributions'));
    assert.ok(html.includes(mockPhoto.user.name || ''));
    assert.ok(html.includes('Unsplash'));
  });

  await t.test('saveAttributionHtml writes file', async () => {
    const manager = new AttributionManager(TEST_DIR);
    manager.addAttribution(mockPhoto, path.join(TEST_DIR, 'image.jpg'));

    const outputPath = path.join(TEST_DIR, 'attributions.html');
    manager.saveAttributionHtml(outputPath);

    assert.ok(await fs.pathExists(outputPath));
    const content = await fs.readFile(outputPath, 'utf8');
    assert.ok(content.includes('<!DOCTYPE html>'));
  });

  await t.test('generateReactComponent creates valid React code', async () => {
    const manager = new AttributionManager(TEST_DIR);
    manager.addAttribution(mockPhoto, path.join(TEST_DIR, 'image.jpg'));

    const outputPath = path.join(TEST_DIR, 'ImageAttribution.tsx');
    manager.generateReactComponent(outputPath);

    assert.ok(await fs.pathExists(outputPath));
    const content = await fs.readFile(outputPath, 'utf8');
    assert.ok(content.includes('import React'));
    assert.ok(content.includes('ImageAttribution'));
    assert.ok(content.includes(mockPhoto.id));
  });

  await t.test('persists and loads data across instances', async () => {
    // First instance - add data
    const manager1 = new AttributionManager(TEST_DIR);
    manager1.addAttribution(mockPhoto, path.join(TEST_DIR, 'image.jpg'));

    // Second instance - should load persisted data
    const manager2 = new AttributionManager(TEST_DIR);
    const attribution = manager2.getAttribution(mockPhoto.id);

    assert.ok(attribution);
    assert.strictEqual(attribution.id, mockPhoto.id);
  });

  await t.test('handles missing user name gracefully', async () => {
    const manager = new AttributionManager(TEST_DIR);
    const photoWithoutName = {
      ...mockPhoto,
      id: 'no-name-photo',
      user: { ...mockPhoto.user, name: null }
    };

    const attribution = manager.addAttribution(
      photoWithoutName,
      path.join(TEST_DIR, 'image.jpg')
    );

    // Should fall back to username
    assert.strictEqual(attribution.photographer, mockPhoto.user.username);
  });
});
