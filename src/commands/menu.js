/**
 * Menu Command
 * Main menu with quick actions
 */

const { createItem, outputItems } = require('../utils/alfred');

/**
 * Menu command handler
 */
function menu() {
  const items = [
    createItem({
      uid: 'menu-search',
      title: '🔍 Search Messages',
      subtitle: 'Search across all messaging networks',
      autocomplete: 'search ',
      valid: false,
      icon: { path: 'icon.png' }
    }),
    createItem({
      uid: 'menu-send',
      title: '💬 Send Message',
      subtitle: 'Quick send to any contact',
      autocomplete: 'send ',
      valid: false,
      icon: { path: 'icon.png' }
    }),
    createItem({
      uid: 'menu-contact',
      title: '👤 Find Contact',
      subtitle: 'Search a person across all networks and pick where to message them',
      autocomplete: 'contact ',
      valid: false,
      icon: { path: 'icon.png' }
    }),
    createItem({
      uid: 'menu-unread',
      title: '📬 Unread Inbox',
      subtitle: 'View and manage unread messages',
      autocomplete: 'unread',
      valid: false,
      icon: { path: 'icon.png' }
    }),
    createItem({
      uid: 'menu-recent',
      title: '🕐 Recent Chats',
      subtitle: 'Quick access to recent conversations',
      autocomplete: 'recent',
      valid: false,
      icon: { path: 'icon.png' }
    }),
    createItem({
      uid: 'menu-setup',
      title: '⚙️ Setup',
      subtitle: 'Configure Beeper Desktop API access',
      autocomplete: 'setup',
      valid: false,
      icon: { path: 'icon.png' }
    })
  ];

  outputItems(items);
}

module.exports = menu;
