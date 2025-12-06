/**
 * Setup Command
 * Initial configuration and API token setup
 */

const { createItem, outputItems, outputError } = require('../utils/alfred');
const BeeperClient = require('../api/client');

/**
 * Setup command handler
 * @param {Array} args - Command arguments (token if provided for validation)
 */
async function setup(args) {
  try {
    const currentToken = process.env.BEEPER_ACCESS_TOKEN;
    const testToken = args.join(' ').trim();

    // If token is provided as argument, validate it
    if (testToken) {
      // Check if it looks like a valid token (basic validation)
      if (testToken.length < 20) {
        outputItems([
          createItem({
            uid: 'setup-error',
            title: '❌ Invalid Token',
            subtitle: 'Token seems too short. Please copy the full token from Beeper Desktop.',
            valid: false,
            icon: { path: 'icon.png' }
          })
        ]);
        return;
      }

      // Try to connect with the token
      try {
        const client = new BeeperClient(testToken);
        await client.testConnection();

        // Connection successful
        outputItems([
          createItem({
            uid: 'setup-success',
            title: '✅ Token Validated Successfully!',
            subtitle: 'Now configure it in the workflow settings (see below)',
            valid: false,
            icon: { path: 'icon.png' }
          }),
          createItem({
            uid: 'setup-instructions-1',
            title: '📝 Step 1: Press ⌘C to Copy Token',
            subtitle: 'Copy the validated token to clipboard',
            valid: false,
            text: {
              copy: testToken,
              largetype: testToken
            },
            icon: { path: 'icon.png' }
          }),
          createItem({
            uid: 'setup-instructions-2',
            title: '📝 Step 2: Open Workflow Configuration',
            subtitle: 'Click the [≡] button at top-right of workflow → Configure Workflow...',
            valid: false,
            icon: { path: 'icon.png' }
          }),
          createItem({
            uid: 'setup-instructions-3',
            title: '📝 Step 3: Paste Token',
            subtitle: 'Paste into "Beeper Access Token" field and click Save',
            valid: false,
            icon: { path: 'icon.png' }
          })
        ]);
      } catch (error) {
        outputItems([
          createItem({
            uid: 'setup-connection-error',
            title: '❌ Connection Failed',
            subtitle: error.message || 'Could not connect to Beeper Desktop API',
            valid: false,
            icon: { path: 'icon.png' }
          }),
          createItem({
            uid: 'setup-help-1',
            title: '1. Make sure Beeper Desktop is running',
            subtitle: 'Open Beeper Desktop application',
            valid: false,
            icon: { path: 'icon.png' }
          }),
          createItem({
            uid: 'setup-help-2',
            title: '2. Enable API in Settings',
            subtitle: 'Settings (⌘,) → Developers → Toggle "Beeper Desktop API" ON',
            valid: false,
            icon: { path: 'icon.png' }
          })
        ]);
      }
    } else {
      // No token provided - show setup instructions
      const items = [];

      if (currentToken) {
        // Token already configured - test it
        try {
          const client = new BeeperClient(currentToken);
          await client.testConnection();

          items.push(
            createItem({
              uid: 'setup-configured',
              title: '✅ Workflow Configured & Connected',
              subtitle: 'Your Beeper token is working correctly!',
              valid: false,
              icon: { path: 'icon.png' }
            }),
            createItem({
              uid: 'setup-token-info',
              title: `🔑 Token: ${currentToken.substring(0, 20)}...`,
              subtitle: 'Press ⌘C to copy full token',
              valid: false,
              text: {
                copy: currentToken,
                largetype: currentToken
              },
              icon: { path: 'icon.png' }
            }),
            createItem({
              uid: 'setup-reconfigure',
              title: '🔄 To Reconfigure',
              subtitle: 'Click [≡] button → Configure Workflow... → Update token',
              valid: false,
              icon: { path: 'icon.png' }
            })
          );
        } catch (error) {
          items.push(
            createItem({
              uid: 'setup-error-connection',
              title: '⚠️ Token Configured But Connection Failed',
              subtitle: error.message || 'Check if Beeper Desktop is running',
              valid: false,
              icon: { path: 'icon.png' }
            }),
            createItem({
              uid: 'setup-token-info',
              title: `🔑 Current Token: ${currentToken.substring(0, 20)}...`,
              subtitle: 'Press ⌘C to copy',
              valid: false,
              text: {
                copy: currentToken,
                largetype: currentToken
              },
              icon: { path: 'icon.png' }
            }),
            createItem({
              uid: 'setup-help-1',
              title: '1. Start Beeper Desktop',
              subtitle: 'Open the Beeper Desktop application',
              valid: false,
              icon: { path: 'icon.png' }
            }),
            createItem({
              uid: 'setup-help-2',
              title: '2. Enable API',
              subtitle: 'Settings (⌘,) → Developers → Toggle "Beeper Desktop API" ON',
              valid: false,
              icon: { path: 'icon.png' }
            })
          );
        }
      } else {
        // No token configured - show initial setup
        items.push(
          createItem({
            uid: 'setup-header',
            title: '⚙️ Setup Beeper Alfred Workflow',
            subtitle: 'Configure your Beeper Desktop API token',
            valid: false,
            icon: { path: 'icon.png' }
          }),
          createItem({
            uid: 'setup-step-1',
            title: '📍 Step 1: Enable API in Beeper Desktop',
            subtitle: 'Open Beeper → Settings (⌘,) → Developers → Enable "Beeper Desktop API"',
            valid: false,
            icon: { path: 'icon.png' }
          }),
          createItem({
            uid: 'setup-step-2',
            title: '📍 Step 2: Copy Access Token',
            subtitle: 'In Developers settings, copy your Access Token',
            valid: false,
            icon: { path: 'icon.png' }
          }),
          createItem({
            uid: 'setup-step-3',
            title: '📍 Step 3: Configure Workflow',
            subtitle: 'Click [≡] button at top-right → Configure Workflow... → Paste token',
            valid: false,
            icon: { path: 'icon.png' }
          }),
          createItem({
            uid: 'setup-step-4',
            title: '📍 Optional: Validate Token First',
            subtitle: 'Type "bp setup <paste-token>" to test before saving',
            valid: false,
            icon: { path: 'icon.png' }
          })
        );
      }

      outputItems(items);
    }

  } catch (error) {
    outputError('Setup failed', error.message);
  }
}

module.exports = setup;
