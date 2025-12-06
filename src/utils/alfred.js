/**
 * Alfred JSON Output Formatter
 * Handles formatting results for Alfred's Script Filter JSON format
 */

/**
 * Create an Alfred item
 * @param {Object} options - Item options
 * @returns {Object} Alfred item object
 */
function createItem({
  uid,
  title,
  subtitle,
  arg,
  icon,
  valid = true,
  autocomplete = null,
  mods = {},
  variables = {},
  badge = null
}) {
  const item = {
    uid,
    title,
    subtitle,
    arg,
    valid,
    icon: icon || { path: 'icon.png' }
  };

  if (autocomplete) {
    item.autocomplete = autocomplete;
  }

  if (Object.keys(mods).length > 0) {
    item.mods = mods;
  }

  if (Object.keys(variables).length > 0) {
    item.variables = variables;
  }

  if (badge) {
    item.badge = badge.toString();
  }

  return item;
}

/**
 * Create Alfred output
 * @param {Array} items - Array of Alfred items
 * @param {Object} variables - Workflow variables
 * @returns {string} JSON string for Alfred
 */
function createOutput(items, variables = {}) {
  const output = { items };
  
  if (Object.keys(variables).length > 0) {
    output.variables = variables;
  }

  return JSON.stringify(output, null, 2);
}

/**
 * Create error item
 * @param {string} message - Error message
 * @param {string} subtitle - Additional context
 * @returns {Object} Alfred item
 */
function createErrorItem(message, subtitle = '') {
  return createItem({
    uid: 'error',
    title: `❌ ${message}`,
    subtitle: subtitle || 'Press Enter to dismiss',
    arg: '',
    valid: false,
    icon: { path: 'icon.png' }
  });
}

/**
 * Create info item
 * @param {string} message - Info message
 * @param {string} subtitle - Additional context
 * @returns {Object} Alfred item
 */
function createInfoItem(message, subtitle = '') {
  return createItem({
    uid: 'info',
    title: `ℹ️ ${message}`,
    subtitle: subtitle || '',
    arg: '',
    valid: false,
    icon: { path: 'icon.png' }
  });
}

/**
 * Create loading item
 * @param {string} message - Loading message
 * @returns {Object} Alfred item
 */
function createLoadingItem(message = 'Loading...') {
  return createItem({
    uid: 'loading',
    title: `⏳ ${message}`,
    subtitle: 'Please wait...',
    arg: '',
    valid: false,
    icon: { path: 'icon.png' }
  });
}

/**
 * Output error to Alfred
 * @param {string} message - Error message
 * @param {string} subtitle - Additional context
 */
function outputError(message, subtitle = '') {
  const output = createOutput([createErrorItem(message, subtitle)]);
  console.log(output);
  process.exit(0);
}

/**
 * Output items to Alfred
 * @param {Array} items - Array of Alfred items
 * @param {Object} variables - Workflow variables
 */
function outputItems(items, variables = {}) {
  const output = createOutput(items, variables);
  console.log(output);
  process.exit(0);
}

module.exports = {
  createItem,
  createOutput,
  createErrorItem,
  createInfoItem,
  createLoadingItem,
  outputError,
  outputItems
};
