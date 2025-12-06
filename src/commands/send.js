/**
 * Send Command
 * Send message to a contact
 */

const { createItem, outputItems, outputError, createInfoItem } = require('../utils/alfred');
const BeeperClient = require('../api/client');
const { formatRelativeTime, truncateText } = require('../utils/formatters');
const { getNetworkInfo } = require('../config/networks');

/**
 * Send command handler
 * @param {Array} args - Command arguments
 */
async function send(args) {
  try {
    const query = args.join(' ').trim();

    if (!query) {
      outputItems([
        createInfoItem(
          'Type contact name to send message',
          'Search across all networks'
        )
      ]);
      return;
    }

    // Check if token is configured
    if (!process.env.BEEPER_ACCESS_TOKEN) {
      outputItems([
        createItem({
          uid: 'send-no-token',
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

    // Search for both existing chats and contacts
    const [chats, contacts] = await Promise.all([
      client.searchChats(query, { limit: 10 }),
      client.searchContactsGlobal(query)
    ]);

    const items = [];

    // Add existing chats first (higher priority)
    chats.forEach(chat => {
      const chatName = chat.title || 'Unknown Chat';
      const network = getNetworkInfo(chat.network);
      const lastMessage = chat.lastMessage?.text || chat.lastMessage?.body || 'No recent messages';
      const timestamp = chat.lastMessage?.timestamp ? formatRelativeTime(chat.lastMessage.timestamp) : '';

      items.push(createItem({
        uid: `send-chat-${chat.id}`,
        title: `💬 ${chatName}`,
        subtitle: `${network.emoji || ''} ${network.name} • ${timestamp ? `Last message ${timestamp}` : 'Existing chat'}`,
        arg: `open-chat|${chat.id}`,
        valid: true,
        text: {
          copy: chatName,
          largetype: `${chatName}\n${network.name}\nLast: ${truncateText(lastMessage, 200)}`
        },
        icon: network.icon ? { path: network.icon } : { path: 'icon.png' }
      }));
    });

    // Add contacts (for creating new chats)
    contacts.forEach(contact => {
      const contactName = contact.fullName || contact.username || contact.phoneNumber || contact.email || 'Unknown Contact';
      const network = getNetworkInfo(contact.network);

      // Check if this contact already has a chat (avoid duplicates)
      const existingChat = chats.find(chat =>
        chat.participants?.items?.some(p => p.id === contact.id)
      );

      if (!existingChat) {
        items.push(createItem({
          uid: `send-contact-${contact.accountID}-${contact.id}`,
          title: `👤 ${contactName}`,
          subtitle: `${network.emoji || ''} ${network.name} • New conversation`,
          arg: `create-chat|${contact.accountID}|${contact.id}`,
          valid: true,
          text: {
            copy: contactName,
            largetype: `${contactName}\n${network.name}\nNew conversation`
          },
          icon: network.icon ? { path: network.icon } : { path: 'icon.png' }
        }));
      }
    });

    if (items.length === 0) {
      outputItems([
        createInfoItem(
          'No contacts or chats found',
          `No results for: ${query}`
        )
      ]);
      return;
    }

    outputItems(items);

  } catch (error) {
    if (error.message.includes('ECONNREFUSED')) {
      outputItems([
        createItem({
          uid: 'send-no-connection',
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
          uid: 'send-invalid-token',
          title: '❌ Invalid API Token',
          subtitle: 'Type "bp setup" to reconfigure your token',
          valid: false,
          icon: { path: 'icon.png' }
        })
      ]);
    } else {
      outputError('Failed to search contacts', error.message);
    }
  }
}

module.exports = send;
