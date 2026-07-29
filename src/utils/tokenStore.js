/**
 * Persistent access-token storage
 *
 * A script cannot write Alfred's workflow environment variables — those live
 * in the workflow's prefs.plist, which Alfred keeps in memory and rewrites on
 * save, so a script's edits get clobbered. Instead the OAuth token is stored
 * in Alfred's per-workflow data directory, which persists across workflow
 * updates and is the conventional place for script-managed state.
 *
 * Precedence when reading: BEEPER_ACCESS_TOKEN (an explicitly configured
 * workflow variable) wins over the stored token, so anyone who already pasted
 * a token by hand keeps working.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const BUNDLE_ID = 'com.deletosh.beeper-alfred';
const FILENAME = 'auth.json';

/**
 * Resolve the directory used for persistent workflow data.
 * Alfred sets alfred_workflow_data when running inside a workflow; fall back
 * to the standard location so the CLI works when run directly.
 * @returns {string} Absolute directory path
 */
function dataDir() {
  if (process.env.alfred_workflow_data) {
    return process.env.alfred_workflow_data;
  }

  const bundleId = process.env.alfred_workflow_bundleid || BUNDLE_ID;

  return path.join(
    os.homedir(),
    'Library/Application Support/Alfred/Workflow Data',
    bundleId
  );
}

/**
 * Absolute path to the token file
 * @returns {string} File path
 */
function tokenPath() {
  return path.join(dataDir(), FILENAME);
}

/**
 * Persist an OAuth token response.
 * The file is written 0600 — it holds a credential granting full account access.
 * @param {Object} tokenResponse - Response from POST /oauth/token
 * @returns {Object} The stored record
 */
function saveToken(tokenResponse) {
  const dir = dataDir();
  fs.mkdirSync(dir, { recursive: true });

  const record = {
    access_token: tokenResponse.access_token,
    token_type: tokenResponse.token_type || 'Bearer',
    scope: tokenResponse.scope || null,
    // Absolute expiry is what later runs need; expires_in is relative to now
    expires_at: tokenResponse.expires_in
      ? Date.now() + tokenResponse.expires_in * 1000
      : null,
    obtained_at: Date.now()
  };

  const file = tokenPath();
  // Create with restrictive permissions rather than widening them after write
  fs.writeFileSync(file, JSON.stringify(record, null, 2), { mode: 0o600 });
  // writeFileSync's mode is ignored for an existing file, so enforce it
  fs.chmodSync(file, 0o600);

  return record;
}

/**
 * Read the stored token record
 * @returns {Object|null} Stored record, or null if absent/unreadable
 */
function loadToken() {
  try {
    return JSON.parse(fs.readFileSync(tokenPath(), 'utf8'));
  } catch {
    // Missing or corrupt file is not an error — it just means "not set up yet"
    return null;
  }
}

/**
 * Whether a stored record has passed its expiry
 * @param {Object|null} record - Stored token record
 * @returns {boolean} True if expired
 */
function isExpired(record) {
  if (!record?.expires_at) {
    return false;
  }
  return Date.now() >= record.expires_at;
}

/**
 * Resolve the access token to use for API calls.
 * @returns {string|null} Token, or null if none is configured
 */
function getAccessToken() {
  if (process.env.BEEPER_ACCESS_TOKEN) {
    return process.env.BEEPER_ACCESS_TOKEN;
  }

  const record = loadToken();

  // Return an expired token anyway: the API is the authority on validity, and
  // callers surface a 401 as "run bp setup" regardless.
  return record?.access_token || null;
}

/**
 * Remove the stored token
 * @returns {boolean} True if a file was removed
 */
function clearToken() {
  try {
    fs.unlinkSync(tokenPath());
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  dataDir,
  tokenPath,
  saveToken,
  loadToken,
  getAccessToken,
  clearToken,
  isExpired
};
