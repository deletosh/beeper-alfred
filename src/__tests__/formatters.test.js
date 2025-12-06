/**
 * Tests for text formatters
 */

const { formatRelativeTime, truncateText } = require('../utils/formatters');

describe('Formatters', () => {
  describe('formatRelativeTime', () => {
    test('should format recent timestamps as "Xm ago"', () => {
      const now = Date.now();
      const twoMinutesAgo = now - (2 * 60 * 1000);

      const result = formatRelativeTime(twoMinutesAgo);
      expect(result).toBe('2m ago');
    });

    test('should format hour-old timestamps as "Xh ago"', () => {
      const now = Date.now();
      const twoHoursAgo = now - (2 * 60 * 60 * 1000);

      const result = formatRelativeTime(twoHoursAgo);
      expect(result).toBe('2h ago');
    });

    test('should format day-old timestamps as "Xd ago"', () => {
      const now = Date.now();
      const twoDaysAgo = now - (2 * 24 * 60 * 60 * 1000);

      const result = formatRelativeTime(twoDaysAgo);
      expect(result).toBe('2d ago');
    });

    test('should handle just now timestamps', () => {
      const now = Date.now();

      const result = formatRelativeTime(now);
      expect(result).toBe('just now');
    });
  });

  describe('truncateText', () => {
    test('should not truncate short text', () => {
      const text = 'Short text';
      const result = truncateText(text, 20);
      expect(result).toBe('Short text');
    });

    test('should truncate long text with ellipsis', () => {
      const text = 'This is a very long text that should be truncated';
      const result = truncateText(text, 20);
      expect(result).toBe('This is a very lo...');
      expect(result.length).toBe(20);
    });

    test('should use default length of 100', () => {
      const text = 'a'.repeat(150);
      const result = truncateText(text);
      expect(result.length).toBe(100);
      expect(result.endsWith('...')).toBe(true);
    });

    test('should handle empty text', () => {
      const result = truncateText('', 10);
      expect(result).toBe('');
    });

    test('should handle null or undefined', () => {
      expect(truncateText(null)).toBe('');
      expect(truncateText(undefined)).toBe('');
    });
  });
});
