#!/usr/bin/env node

/**
 * Beeper Alfred Workflow - Main Entry Point
 * Routes commands to appropriate handlers
 */

const { outputError } = require('./utils/alfred');

// Command routing
const COMMANDS = {
  menu: require('./commands/menu'),
  search: require('./commands/search'),
  send: require('./commands/send'),
  contact: require('./commands/contact'),
  unread: require('./commands/unread'),
  recent: require('./commands/recent'),
  setup: require('./commands/setup'),
  action: require('./commands/action'),
  'action-raw': async (args) => {
    // Split pipe-delimited string and call action handler
    const rawString = args[0] || '';
    const parts = rawString.split('|');
    return COMMANDS.action(parts);
  }
};

/**
 * Main function
 */
async function main() {
  try {
    // Get command and arguments
    const args = process.argv.slice(2);
    const command = args[0] || 'menu';
    const commandArgs = args.slice(1);

    // Validate command
    if (!COMMANDS[command]) {
      throw new Error(`Unknown command: ${command}`);
    }

    // Execute command
    await COMMANDS[command](commandArgs);
    
  } catch (error) {
    console.error('Error:', error);
    outputError(
      error.message || 'An unexpected error occurred',
      'Please check your setup and try again'
    );
  }
}

// Run main function
main();
