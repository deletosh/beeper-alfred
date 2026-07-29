/**
 * Action Command
 * Handle actions from Alfred results (open, archive, send, etc.)
 */

const { exec } = require('child_process');
const BeeperClient = require('../api/client');
const { authorize: runOAuth } = require('../api/oauth');
const { saveToken } = require('../utils/tokenStore');

/**
 * Action command handler
 * @param {Array} args - Command arguments [action-type, ...params]
 */
async function action(args) {
  try {
    if (args.length === 0) {
      console.error('No action specified');
      process.exit(1);
    }

    const actionType = args[0];
    const actionParams = args.slice(1);

    // Debug logging
    console.error(`Action: ${actionType}, Params: ${JSON.stringify(actionParams)}`);

    // Route to appropriate action handler
    switch (actionType) {
    case 'open-chat':
      await openChat(actionParams);
      break;
    case 'open-message':
      await openMessage(actionParams);
      break;
    case 'archive-chat':
      await archiveChat(actionParams);
      break;
    case 'copy-message':
      await copyMessage(actionParams);
      break;
    case 'quick-reply':
      await quickReply(actionParams);
      break;
    case 'send-message':
      await sendMessage(actionParams);
      break;
    case 'start-chat':
      await startChat(actionParams);
      break;
    case 'send-new':
      await sendToNewChat(actionParams);
      break;
    case 'compose':
      await compose(actionParams);
      break;
    case 'copy-text':
      // Handled by Alfred's clipboard output; no API call needed
      break;
    case 'authorize':
      await authorize();
      break;
    default:
      console.error(`Unknown action: ${actionType}`);
      console.error(`All args: ${JSON.stringify(args)}`);
      process.exit(1);
    }

    // Success - exit silently
    process.exit(0);

  } catch (error) {
    // Log to stderr (visible in Alfred debugger) but don't output JSON
    console.error('Action failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Open chat in Beeper Desktop
 */
async function openChat(params) {
  const [chatId] = params;

  console.error(`openChat called with chatId: ${chatId}`);

  if (!chatId) {
    throw new Error('Chat ID is required');
  }

  const client = new BeeperClient();
  console.error(`Calling openInBeeper with chatId: ${chatId}`);
  await client.openInBeeper(chatId);
  console.error('openInBeeper completed');
}

/**
 * Open specific message in Beeper Desktop
 */
async function openMessage(params) {
  const [chatId, messageId] = params;

  console.error(`openMessage called with chatId: ${chatId}, messageId: ${messageId}`);

  if (!chatId) {
    throw new Error('Chat ID is required');
  }

  const client = new BeeperClient();
  console.error(`Calling openInBeeper with chatId: ${chatId}, messageId: ${messageId}`);
  await client.openInBeeper(chatId, messageId);
  console.error('openInBeeper completed');
}

/**
 * Archive chat
 */
async function archiveChat(params) {
  const [chatId] = params;

  if (!chatId) {
    throw new Error('Chat ID is required');
  }

  const client = new BeeperClient();
  await client.archiveChat(chatId, true);
}

/**
 * Copy message text to clipboard
 */
function copyMessage(params) {
  const [messageId] = params;

  if (!messageId) {
    throw new Error('Message ID is required');
  }

  // This is handled by Alfred's text.copy property
  // No API call needed
}

/**
 * Quick reply to chat
 */
async function quickReply(params) {
  const [chatId] = params;

  if (!chatId) {
    throw new Error('Chat ID is required');
  }

  // Open the chat in Beeper for now
  // Future: Could open Alfred input for inline reply
  const client = new BeeperClient();
  await client.openInBeeper(chatId);
}

/**
 * Send message to chat
 */
async function sendMessage(params) {
  const [chatId, ...messageParts] = params;
  // Rejoin on '|' so a message containing pipes survives the split in index.js
  const messageText = messageParts.join('|');

  if (!chatId) {
    throw new Error('Chat ID is required');
  }

  if (!messageText) {
    throw new Error('Message text is required');
  }

  const client = new BeeperClient();
  await client.sendMessageV1(chatId, messageText);
}

/**
 * Decode a base64-encoded contact payload passed through the Alfred arg
 * @param {string} encoded - base64 JSON
 * @returns {Object} Contact payload
 */
function decodeUser(encoded) {
  try {
    return JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
  } catch {
    throw new Error('Could not read the selected contact');
  }
}

/**
 * Start a chat with a contact and open it in Beeper
 */
async function startChat(params) {
  const [accountId, encodedUser] = params;

  if (!accountId) {
    throw new Error('Account ID is required');
  }

  if (!encodedUser) {
    throw new Error('Contact is required');
  }

  const client = new BeeperClient();
  const chat = await client.startChat(accountId, decodeUser(encodedUser));
  const chatId = chat?.id || chat?.chatID;

  if (!chatId) {
    throw new Error('Could not start a chat with this contact');
  }

  await client.focus({ chatID: chatId });
}

/**
 * Start a chat with a contact and send the first message
 */
async function sendToNewChat(params) {
  const [accountId, encodedUser, ...messageParts] = params;
  // Rejoin on '|' so a message containing pipes survives the split in index.js
  const messageText = messageParts.join('|');

  if (!accountId) {
    throw new Error('Account ID is required');
  }

  if (!encodedUser) {
    throw new Error('Contact is required');
  }

  if (!messageText) {
    throw new Error('Message text is required');
  }

  const client = new BeeperClient();

  // start-chat reuses an existing DM when there is one, in which case messageText
  // is not delivered. Resolve the chat first, then send explicitly — one send
  // path means no risk of double-posting.
  const chat = await client.startChat(accountId, decodeUser(encodedUser));
  const chatId = chat?.id || chat?.chatID;

  if (!chatId) {
    throw new Error('Could not start a chat with this contact');
  }

  await client.sendMessageV1(chatId, messageText);
}

/**
 * Open a chat in Beeper with the message box pre-filled
 */
async function compose(params) {
  const [chatId, ...draftParts] = params;
  const draftText = draftParts.join('|');

  if (!chatId) {
    throw new Error('Chat ID is required');
  }

  const client = new BeeperClient();
  await client.focus({ chatID: chatId, draftText: draftText || undefined });
}

/**
 * Post a macOS notification.
 * Actions have no Alfred UI, and the OAuth flow is slow enough that silent
 * success or failure would be indistinguishable from nothing happening.
 * @param {string} title - Notification title
 * @param {string} message - Notification body
 * @returns {Promise<void>}
 */
function notify(title, message) {
  return new Promise((resolve) => {
    // JSON.stringify escapes quotes so a message can't break out of the script
    const script = `display notification ${JSON.stringify(message)} with title ${JSON.stringify(title)}`;
    exec(`osascript -e ${JSON.stringify(script)}`, () => resolve());
  });
}

/**
 * Run the OAuth authorization flow and persist the resulting token.
 * Blocks while the user approves the consent page in their browser.
 */
async function authorize() {
  const apiUrl = process.env.BEEPER_API_URL || 'http://localhost:23373';

  try {
    const token = await runOAuth({ baseUrl: apiUrl });
    saveToken(token);

    // Prove the token actually works before claiming success
    const client = new BeeperClient(token.access_token);
    const accounts = await client.getAccounts();

    await notify(
      'Beeper for Alfred',
      `Connected — ${accounts.length} account${accounts.length === 1 ? '' : 's'} available`
    );
  } catch (error) {
    await notify('Beeper for Alfred', `Authorization failed: ${error.message}`);
    throw error;
  }

  if (process.env.BEEPER_ACCESS_TOKEN) {
    // A stale workflow variable outranks the new token in getAccessToken(),
    // so warn rather than let commands keep failing with 401 after success.
    await notify(
      'Beeper for Alfred',
      'Clear the BEEPER_ACCESS_TOKEN workflow variable — it overrides the new authorization'
    );
  }
}

module.exports = action;
