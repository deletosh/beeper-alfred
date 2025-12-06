/**
 * Action Command
 * Handle actions from Alfred results (open, archive, send, etc.)
 */

const BeeperClient = require('../api/client');

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
    case 'create-chat':
      await createChat(actionParams);
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
  const messageText = messageParts.join(' ');

  if (!chatId) {
    throw new Error('Chat ID is required');
  }

  if (!messageText) {
    throw new Error('Message text is required');
  }

  const client = new BeeperClient();
  await client.sendMessage(chatId, messageText);
}

/**
 * Create a new chat and open it
 */
async function createChat(params) {
  const [accountId, userId] = params;

  console.error(`createChat called with accountId: ${accountId}, userId: ${userId}`);

  if (!accountId) {
    throw new Error('Account ID is required');
  }

  if (!userId) {
    throw new Error('User ID is required');
  }

  const client = new BeeperClient();

  // Create the chat
  console.error('Creating new chat...');
  const newChat = await client.createChat(accountId, userId);
  console.error(`Chat created: ${JSON.stringify(newChat)}`);

  // Open the newly created chat
  const chatId = newChat.chatID || newChat.id;
  if (chatId) {
    console.error(`Opening chat: ${chatId}`);
    await client.openInBeeper(chatId);
  } else {
    console.error('Warning: No chat ID returned from createChat');
  }
}

module.exports = action;
