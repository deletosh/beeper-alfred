/**
 * Setup Command
 *
 * Shows connection status and offers to authorize via OAuth.
 *
 * This runs as an Alfred Script Filter, which is re-executed on every
 * keystroke and killed when the user types again — so it must never run the
 * OAuth flow itself. It only reports status and emits an actionable item;
 * the flow runs in the `authorize` action (see src/commands/action.js).
 */

const { createItem, outputItems, outputError } = require('../utils/alfred');
const BeeperClient = require('../api/client');
const { loadToken, isExpired } = require('../utils/tokenStore');

/**
 * Build the item that kicks off the OAuth flow
 * @param {string} title - Item title
 * @param {string} subtitle - Item subtitle
 * @returns {Object} Alfred item
 */
function authorizeItem(title, subtitle) {
  return createItem({
    uid: 'setup-authorize',
    title,
    subtitle,
    arg: 'authorize',
    valid: true,
    icon: { path: 'icon.png' }
  });
}

/**
 * Describe where the active token came from, so a stale hand-pasted
 * workflow variable overriding the OAuth token is visible rather than baffling.
 * @returns {string} Human-readable source
 */
function tokenSource() {
  return process.env.BEEPER_ACCESS_TOKEN
    ? 'Workflow variable (BEEPER_ACCESS_TOKEN)'
    : 'Saved by bp setup';
}

/**
 * Setup command handler
 * @param {Array} _args - Unused; authorization is interactive
 */
async function setup(_args) {
  try {
    const stored = loadToken();
    const hasEnvToken = Boolean(process.env.BEEPER_ACCESS_TOKEN);

    // Nothing configured at all — first run
    if (!stored && !hasEnvToken) {
      outputItems([
        authorizeItem(
          '🔐 Connect Alfred to Beeper',
          'Press ↵ to authorize in your browser'
        ),
        createItem({
          uid: 'setup-info',
          title: 'ℹ️ What happens next',
          subtitle: 'Beeper opens a consent page; approve it and you are done',
          valid: false,
          icon: { path: 'icon.png' }
        })
      ]);
      return;
    }

    // Something is configured — the API is the authority on whether it works
    try {
      const client = new BeeperClient();
      await client.testConnection();

      const items = [
        createItem({
          uid: 'setup-connected',
          title: '✅ Connected to Beeper',
          subtitle: `Authorization is working • ${tokenSource()}`,
          valid: false,
          icon: { path: 'icon.png' }
        }),
        authorizeItem(
          '🔄 Re-authorize',
          'Replace the current authorization with a fresh one'
        )
      ];

      // A token past its stated expiry that still works is worth flagging
      if (stored && isExpired(stored)) {
        items.splice(1, 0, createItem({
          uid: 'setup-expiry',
          title: '⚠️ Stored authorization has passed its expiry',
          subtitle: 'It still works for now — re-authorize to avoid surprises',
          valid: false,
          icon: { path: 'icon.png' }
        }));
      }

      outputItems(items);
      return;
    } catch (error) {
      // Distinguish "not running" from "not authorized" — different fixes
      if (error.message.includes('ECONNREFUSED') || error.message.includes('not running')) {
        outputItems([
          createItem({
            uid: 'setup-offline',
            title: '❌ Beeper Desktop is not running',
            subtitle: 'Start Beeper Desktop, then run bp setup again',
            valid: false,
            icon: { path: 'icon.png' }
          }),
          createItem({
            uid: 'setup-offline-help',
            title: 'Also check the API is enabled',
            subtitle: 'Beeper → Settings (⌘,) → Developers → Allow connections',
            valid: false,
            icon: { path: 'icon.png' }
          })
        ]);
        return;
      }

      if (error.status === 401) {
        const detail = hasEnvToken
          ? 'The BEEPER_ACCESS_TOKEN workflow variable is invalid or expired'
          : 'Your saved authorization has expired or was revoked';

        outputItems([
          authorizeItem('🔐 Re-authorize with Beeper', 'Press ↵ to authorize in your browser'),
          createItem({
            uid: 'setup-401',
            title: '⚠️ Not authorized',
            subtitle: detail,
            valid: false,
            icon: { path: 'icon.png' }
          })
        ]);
        return;
      }

      outputItems([
        createItem({
          uid: 'setup-error',
          title: '⚠️ Connection failed',
          subtitle: error.message,
          valid: false,
          icon: { path: 'icon.png' }
        }),
        authorizeItem('🔐 Try authorizing', 'Press ↵ to authorize in your browser')
      ]);
    }
  } catch (error) {
    outputError('Setup failed', error.message);
  }
}

module.exports = setup;
