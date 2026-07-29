/**
 * Tests for persistent token storage
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

describe('tokenStore', () => {
  let dir;
  let store;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'beeper-token-'));
    process.env.alfred_workflow_data = dir;
    delete process.env.BEEPER_ACCESS_TOKEN;

    // Re-require so the module picks up the temp data dir
    jest.resetModules();
    store = require('../utils/tokenStore');
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
    process.env = { ...originalEnv };
  });

  test('reports no token before setup has run', () => {
    expect(store.loadToken()).toBeNull();
    expect(store.getAccessToken()).toBeNull();
  });

  test('persists a token across reads', () => {
    store.saveToken({ access_token: 'bdapi_abc', token_type: 'Bearer', scope: 'read write' });

    expect(store.loadToken().access_token).toBe('bdapi_abc');
    expect(store.getAccessToken()).toBe('bdapi_abc');
  });

  test('converts expires_in into an absolute expiry', () => {
    store.saveToken({ access_token: 'a', expires_in: 3600 });

    const delta = store.loadToken().expires_at - Date.now();

    // Allow a second of slack for test execution time
    expect(delta).toBeGreaterThan(3599 * 1000);
    expect(delta).toBeLessThanOrEqual(3600 * 1000);
  });

  test('stores the token readable only by its owner', () => {
    store.saveToken({ access_token: 'secret' });

    const mode = fs.statSync(store.tokenPath()).mode & 0o777;

    expect(mode).toBe(0o600);
  });

  test('restores restrictive permissions when the file was loosened', () => {
    store.saveToken({ access_token: 'secret' });
    fs.chmodSync(store.tokenPath(), 0o644);

    store.saveToken({ access_token: 'secret2' });

    expect(fs.statSync(store.tokenPath()).mode & 0o777).toBe(0o600);
  });

  test('treats a token with no expiry as unexpired', () => {
    expect(store.isExpired({ access_token: 'a', expires_at: null })).toBe(false);
  });

  test('detects an elapsed expiry', () => {
    expect(store.isExpired({ expires_at: Date.now() - 1000 })).toBe(true);
    expect(store.isExpired({ expires_at: Date.now() + 60000 })).toBe(false);
  });

  test('lets an explicit workflow variable override the stored token', () => {
    store.saveToken({ access_token: 'stored' });
    process.env.BEEPER_ACCESS_TOKEN = 'from-env';

    expect(store.getAccessToken()).toBe('from-env');
  });

  test('treats a corrupt token file as absent rather than throwing', () => {
    fs.mkdirSync(store.dataDir(), { recursive: true });
    fs.writeFileSync(store.tokenPath(), 'not json');

    expect(store.loadToken()).toBeNull();
    expect(store.getAccessToken()).toBeNull();
  });

  test('clearToken removes the stored credential', () => {
    store.saveToken({ access_token: 'a' });

    expect(store.clearToken()).toBe(true);
    expect(store.loadToken()).toBeNull();
    expect(store.clearToken()).toBe(false);
  });
});
