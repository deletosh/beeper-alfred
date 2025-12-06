/**
 * Search Command
 * Search messages across all networks
 */

const { createItem, outputItems, outputError, createInfoItem } = require('../utils/alfred');
const BeeperClient = require('../api/client');
const { formatRelativeTime, truncateText } = require('../utils/formatters');
const { getNetworkInfo } = require('../config/networks');

/**
 * Search command handler
 * @param {Array} args - Command arguments
 */
async function search(args) {
  try {
    const query = args.join(' ').trim();

    if (!query) {
      outputItems([
        createInfoItem(
          'Type to search messages',
          'Search across all messaging networks'
        )
      ]);
      return;
    }

    // Check if token is configured
    if (!process.env.BEEPER_ACCESS_TOKEN) {
      outputItems([
        createItem({
          uid: 'search-no-token',
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

    // Use global search for better results
    const searchResults = await client.globalSearch(query);

    // Combine all results
    const allItems = [];

    // Add chat results
    searchResults.chats.forEach(chat => {
      const chatName = chat.title || 'Unknown Chat';
      const network = getNetworkInfo(chat.network);
      const unreadCount = chat.unreadCount || 0;
      const lastMessage = chat.lastMessage?.text || '';

      allItems.push(createItem({
        uid: `search-chat-${chat.id}`,
        title: `💬 ${chatName}`,
        subtitle: `${network.emoji || ''} ${network.name} • ${unreadCount > 0 ? `${unreadCount} unread` : 'Chat'} ${lastMessage ? `• "${truncateText(lastMessage, 40)}"` : ''}`,
        arg: `open-chat|${chat.id}`,
        valid: true,
        text: {
          copy: chatName,
          largetype: `${chatName}\n${network.name}`
        },
        icon: network.icon ? { path: network.icon } : { path: 'icon.png' }
      }));
    });

    // Add group results
    searchResults.groups.forEach(group => {
      const groupName = group.title || 'Unknown Group';
      const network = getNetworkInfo(group.network);
      const participantCount = group.participants?.total || 0;

      allItems.push(createItem({
        uid: `search-group-${group.id}`,
        title: `👥 ${groupName}`,
        subtitle: `${network.emoji || ''} ${network.name} • ${participantCount} members`,
        arg: `open-chat|${group.id}`,
        valid: true,
        text: {
          copy: groupName,
          largetype: `${groupName}\n${network.name}\n${participantCount} members`
        },
        icon: network.icon ? { path: network.icon } : { path: 'icon.png' }
      }));
    });

    // Add message results
    searchResults.messages.items.forEach(message => {
      const messageChat = searchResults.messages.chats[message.chatID];
      const chatName = messageChat?.title || 'Unknown Chat';
      const senderName = message.senderName || 'Unknown';
      const messageText = message.text || '[No text content]';
      const timestamp = formatRelativeTime(message.timestamp);
      const network = getNetworkInfo(messageChat?.network);

      allItems.push(createItem({
        uid: `search-message-${message.id}`,
        title: `📩 ${truncateText(messageText, 80)}`,
        subtitle: `👤 ${senderName} • ${network.emoji || ''} ${network.name || 'Unknown'} • ${timestamp} • ${chatName}`,
        arg: `open-message|${message.chatID}|${message.id}`,
        valid: true,
        text: {
          copy: messageText,
          largetype: messageText
        },
        icon: network.icon ? { path: network.icon } : { path: 'icon.png' }
      }));
    });

    if (allItems.length === 0) {
      outputItems([
        createInfoItem(
          'No results found',
          `No chats, groups, or messages found for: ${query}`
        )
      ]);
      return;
    }

    outputItems(allItems);

  } catch (error) {
    if (error.message.includes('ECONNREFUSED')) {
      outputItems([
        createItem({
          uid: 'search-no-connection',
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
          uid: 'search-invalid-token',
          title: '❌ Invalid API Token',
          subtitle: 'Type "bp setup" to reconfigure your token',
          valid: false,
          icon: { path: 'icon.png' }
        })
      ]);
    } else {
      outputError('Search failed', error.message);
    }
  }
}

module.exports = search;
