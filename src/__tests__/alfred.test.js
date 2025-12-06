/**
 * Tests for Alfred output formatter
 */

const { outputItems, outputError } = require('../utils/alfred');

describe('Alfred Utils', () => {
  describe('outputItems', () => {
    // Mock console.log to capture output
    let consoleLogSpy;
    let processExitSpy;

    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    test('should output valid JSON for empty items', () => {
      outputItems([]);

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(output).toEqual({ items: [] });
    });

    test('should output valid JSON for single item', () => {
      const items = [
        {
          uid: 'test-1',
          title: 'Test Item',
          subtitle: 'Test Subtitle',
          arg: 'test-arg'
        }
      ];

      outputItems(items);

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(output.items).toHaveLength(1);
      expect(output.items[0].title).toBe('Test Item');
    });

    test('should output valid JSON for multiple items', () => {
      const items = [
        { uid: 'test-1', title: 'Item 1', arg: 'arg1' },
        { uid: 'test-2', title: 'Item 2', arg: 'arg2' }
      ];

      outputItems(items);

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(output.items).toHaveLength(2);
    });
  });

  describe('outputError', () => {
    let consoleLogSpy;
    let processExitSpy;

    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    test('should output error as Alfred item', () => {
      outputError('Test Error', 'Test Subtitle');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(output.items).toHaveLength(1);
      expect(output.items[0].title).toBe('❌ Test Error');
      expect(output.items[0].subtitle).toBe('Test Subtitle');
    });

    test('should include error icon', () => {
      outputError('Error');

      const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(output.items[0].icon).toBeDefined();
    });
  });
});
