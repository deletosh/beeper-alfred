/**
 * Recent Command
 * Show recent chats
 */

const { createItem, outputItems, outputError, createInfoItem } = require('../utils/alfred');
const BeeperClient = require('../api/client');
const { getAccessToken } = require('../utils/tokenStore');
const { formatRelativeTime, truncateText } = require('../utils/formatters');
const { getNetworkInfo } = require('../config/networks');

/**
 * Recent command handler
 */
async function recent() {
  try {
    // Covers both the workflow variable and the token saved by bp setup
    if (!getAccessToken()) {
      outputItems([
        createItem({
          uid: 'recent-no-token',
          title: '⚠️ API Token Not Configured',
          subtitle: 'Type "bp setup" to configure your Beeper Desktop API token',
          valid: false,
          icon: { path: 'icon.png' }
        })
      ]);
      return;
    }

    // Initialize Beeper client
    const client = new BeeperClient();

    // Get recent chats (last 10)
    const chats = await client.getRecentChats(10);

    if (!chats || chats.length === 0) {
      outputItems([
        createInfoItem(
          'No recent chats',
          'Start a conversation to see recent chats here'
        )
      ]);
      return;
    }

    // Format results for Alfred
    const items = chats.map(chat => {
      const chatName = chat.title || chat.name || 'Unknown Chat';
      const network = getNetworkInfo(chat.network);
      const lastMessage = chat.lastMessage?.text || chat.lastMessage?.body || 'No messages';
      const timestamp = chat.lastMessage?.timestamp ? formatRelativeTime(chat.lastMessage.timestamp) : '';
      const unreadCount = chat.unreadCount || 0;

      const subtitle = [
        `${network.emoji || ''} ${network.name || 'Unknown'}`,
        `Last message: "${truncateText(lastMessage, 50)}"`,
        timestamp ? `• ${timestamp}` : '',
        unreadCount > 0 ? `• ${unreadCount} unread` : ''
      ].filter(Boolean).join(' ');

      return createItem({
        uid: `recent-chat-${chat.id}`,
        title: chatName,
        subtitle: subtitle,
        arg: `open-chat|${chat.id}`,
        valid: true,
        text: {
          copy: chatName,
          largetype: `${chatName}\n${network.name}\nLast: ${lastMessage}`
        },
        icon: network.icon ? { path: network.icon } : { path: 'icon.png' }
      });
    });

    outputItems(items);

  } catch (error) {
    if (error.message.includes('ECONNREFUSED')) {
      outputItems([
        createItem({
          uid: 'recent-no-connection',
          title: '❌ Cannot Connect to Beeper Desktop',
          subtitle: 'Make sure Beeper Desktop is running',
          valid: false,
          icon: { path: 'icon.png' }
        }),
        createInfoItem(
          'Start Beeper Desktop',
          'Open the Beeper Desktop application and enable API in Settings'
        )
      ]);
    } else if (error.status === 401) {
      outputItems([
        createItem({
          uid: 'recent-invalid-token',
          title: '❌ Invalid API Token',
          subtitle: 'Type "bp setup" to reconfigure your token',
          valid: false,
          icon: { path: 'icon.png' }
        })
      ]);
    } else {
      outputError('Failed to load recent chats', error.message);
    }
  }
}

module.exports = recent;
