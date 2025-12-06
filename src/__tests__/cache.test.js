/**
 * Tests for cache utility
 */

const { Cache } = require('../utils/cache');

describe('Cache', () => {
  let cache;

  beforeEach(() => {
    cache = new Cache(1000); // 1 second TTL for testing
  });

  test('should store and retrieve values', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  test('should return null for non-existent keys', () => {
    expect(cache.get('nonexistent')).toBeNull();
  });

  test('should expire values after TTL', async () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');

    // Wait for TTL to expire
    await new Promise(resolve => setTimeout(resolve, 1100));

    expect(cache.get('key1')).toBeNull();
  });

  test('should handle object values', () => {
    const obj = { name: 'test', value: 123 };
    cache.set('obj', obj);
    expect(cache.get('obj')).toEqual(obj);
  });

  test('should handle array values', () => {
    const arr = [1, 2, 3, 4, 5];
    cache.set('arr', arr);
    expect(cache.get('arr')).toEqual(arr);
  });

  test('should overwrite existing keys', () => {
    cache.set('key1', 'value1');
    cache.set('key1', 'value2');
    expect(cache.get('key1')).toBe('value2');
  });

  test('should use default TTL when not specified', () => {
    const defaultCache = new Cache();
    expect(defaultCache.defaultTTL).toBe(300000); // 5 minutes default
  });

  test('should handle multiple keys independently', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');

    expect(cache.get('key1')).toBe('value1');
    expect(cache.get('key2')).toBe('value2');
  });
});
