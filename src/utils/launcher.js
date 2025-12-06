/**
 * Beeper Desktop Launcher
 * Utilities for launching and checking Beeper Desktop app
 */

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * Check if Beeper Desktop is running
 * @returns {Promise<boolean>} True if running
 */
async function isBeeperRunning() {
  try {
    const { stdout } = await execAsync('pgrep -x "Beeper"');
    return stdout.trim().length > 0;
  } catch (error) {
    // pgrep returns non-zero exit code if process not found
    return false;
  }
}

/**
 * Launch Beeper Desktop
 * @returns {Promise<void>}
 */
async function launchBeeperDesktop() {
  try {
    await execAsync('open -a "Beeper"');
    // Wait 3 seconds for app to start
    await sleep(3000);
  } catch (error) {
    throw new Error('Failed to launch Beeper Desktop. Is it installed?');
  }
}

/**
 * Check if Beeper Desktop API is accessible
 * @param {string} apiUrl - API URL (default: http://localhost:23373)
 * @returns {Promise<boolean>} True if accessible
 */
async function isApiAccessible(apiUrl = 'http://localhost:23373') {
  try {
    const response = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      timeout: 2000
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Ensure Beeper Desktop is running and API is accessible
 * @param {string} apiUrl - API URL
 * @returns {Promise<boolean>} True if ready
 */
async function ensureBeeperReady(apiUrl = 'http://localhost:23373') {
  // Check if API is already accessible
  if (await isApiAccessible(apiUrl)) {
    return true;
  }

  // Check if Beeper is running
  const isRunning = await isBeeperRunning();
  
  if (!isRunning) {
    // Launch Beeper Desktop
    await launchBeeperDesktop();
  } else {
    // Beeper is running but API might not be enabled
    // Wait a moment and check again
    await sleep(2000);
  }

  // Check API again
  if (await isApiAccessible(apiUrl)) {
    return true;
  }

  throw new Error('Beeper Desktop API not accessible. Please enable it in Settings → Developers');
}

/**
 * Sleep utility
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Open Beeper Desktop to a specific chat
 * @param {string} chatId - Chat ID
 * @returns {Promise<void>}
 */
async function openBeeperToChat(chatId) {
  // Use Beeper's custom URL scheme if available
  // Otherwise, use API to open chat
  try {
    await execAsync(`open "beeper://chat/${chatId}"`);
  } catch (error) {
    // Fallback to API call (handled by client)
    throw new Error('Could not open Beeper to chat');
  }
}

module.exports = {
  isBeeperRunning,
  launchBeeperDesktop,
  isApiAccessible,
  ensureBeeperReady,
  sleep,
  openBeeperToChat
};
