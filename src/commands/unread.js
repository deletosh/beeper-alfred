/**
 * Unread Command
 * View and manage unread messages
 */

const { createItem, outputItems, outputError, createInfoItem } = require('../utils/alfred');
const BeeperClient = require('../api/client');
const { formatRelativeTime, truncateText } = require('../utils/formatters');
const { getNetworkInfo } = require('../config/networks');

/**
 * Unread command handler
 */
async function unread() {
  try {
    // Check if token is configured
    if (!process.env.BEEPER_ACCESS_TOKEN) {
      outputItems([
        createItem({
          uid: 'unread-no-token',
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

    // Get unread chats
    const chats = await client.getUnreadChats();

    if (!chats || chats.length === 0) {
      outputItems([
        createInfoItem(
          '✅ No unread messages',
          'All caught up across all networks!'
        )
      ]);
      return;
    }

    // Format results for Alfred
    const items = chats.map(chat => {
      const chatName = chat.title || chat.name || 'Unknown Chat';
      const network = getNetworkInfo(chat.network);
      const unreadCount = chat.unreadCount || 0;
      const lastMessage = chat.lastMessage?.text || chat.lastMessage?.body || '';
      const lastMessageId = chat.lastMessage?.id;
      const timestamp = chat.lastMessage?.timestamp ? formatRelativeTime(chat.lastMessage.timestamp) : '';

      // Badge color based on unread count
      let badge = '';
      if (unreadCount > 10) {
        badge = '🔴';
      } else if (unreadCount >= 5) {
        badge = '🟡';
      } else if (unreadCount > 0) {
        badge = '🟢';
      }

      const subtitle = [
        `${network.emoji || ''} ${network.name || 'Unknown'}`,
        `${badge} ${unreadCount} unread`,
        timestamp ? `• ${timestamp}` : '',
        lastMessage ? `• "${truncateText(lastMessage, 40)}"` : ''
      ].filter(Boolean).join(' ');

      // If we have a last message ID, open that specific message, otherwise just open the chat
      const actionArg = lastMessageId
        ? `open-message|${chat.id}|${lastMessageId}`
        : `open-chat|${chat.id}`;

      return createItem({
        uid: `unread-chat-${chat.id}`,
        title: chatName,
        subtitle: subtitle,
        arg: actionArg,
        valid: true,
        text: {
          copy: chatName,
          largetype: `${chatName}\n${network.name}\n${unreadCount} unread messages\nLast: ${lastMessage}`
        },
        icon: network.icon ? { path: network.icon } : { path: 'icon.png' },
        mods: {
          cmd: {
            subtitle: 'Quick reply to this chat',
            arg: `quick-reply|${chat.id}`,
            valid: true
          },
          alt: {
            subtitle: 'Archive chat',
            arg: `archive-chat|${chat.id}`,
            valid: true
          }
        }
      });
    });

    outputItems(items);

  } catch (error) {
    // Log full error to stderr for debugging
    console.error('Unread command error:', error);
    console.error('Error stack:', error.stack);

    if (error.message.includes('ECONNREFUSED')) {
      outputItems([
        createItem({
          uid: 'unread-no-connection',
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
    } else if (error.message.includes('401')) {
      outputItems([
        createItem({
          uid: 'unread-invalid-token',
          title: '❌ Invalid API Token',
          subtitle: 'Type "bp setup" to reconfigure your token',
          valid: false,
          icon: { path: 'icon.png' }
        })
      ]);
    } else {
      outputError('Failed to load unread messages', error.message);
    }
  }
}

module.exports = unread;
