/**
 * Contact Command
 * Search for a person across every connected network and message them
 * on whichever network they are reachable on.
 */

const { createItem, outputItems, outputError, createInfoItem } = require('../utils/alfred');
const BeeperClient = require('../api/client');
const { getAccessToken } = require('../utils/tokenStore');
const { formatRelativeTime, truncateText } = require('../utils/formatters');
const { getNetworkInfo } = require('../config/networks');

/**
 * Best available display name for a contact or chat participant
 * @param {Object} person - User object from the API
 * @returns {string} Display name
 */
function displayName(person) {
  return person.fullName
    || person.username
    || person.phoneNumber
    || person.email
    || 'Unknown Contact';
}

/**
 * Secondary identifier shown after the network name (handle, phone, email)
 * @param {Object} person - User object from the API
 * @returns {string} Handle string, or empty when nothing extra is known
 */
function handleFor(person) {
  const name = displayName(person);
  const handle = person.username || person.phoneNumber || person.email;
  // Don't repeat the title back in the subtitle
  return handle && handle !== name ? handle : '';
}

/**
 * Group reachable destinations by person, so one human with three networks
 * produces one group of three rows rather than three unrelated results.
 * @param {Array} chats - Existing chats from chat search
 * @param {Array} contacts - Contacts from cross-network contact search
 * @returns {Array} Array of {name, destinations[]} sorted by relevance
 */
function groupByPerson(chats, contacts) {
  const groups = new Map();

  const groupFor = (name) => {
    const key = name.toLowerCase();
    if (!groups.has(key)) {
      groups.set(key, { name, destinations: [] });
    }
    return groups.get(key);
  };

  // Existing 1:1 chats and groups — messaging these needs no chat creation
  chats.forEach(chat => {
    const name = chat.title || 'Unknown Chat';
    groupFor(name).destinations.push({
      kind: 'chat',
      chatID: chat.id,
      network: chat.network,
      accountID: chat.accountID,
      isGroup: chat.type === 'group',
      lastActivity: chat.lastActivity || chat.lastMessage?.timestamp || null,
      preview: chat.lastMessage?.text || chat.lastMessage?.body || ''
    });
  });

  // Network contacts without an existing chat — messaging these creates one
  contacts.forEach(contact => {
    const name = displayName(contact);
    const group = groupFor(name);

    // Skip a network we can already reach this person on via an existing chat
    const alreadyReachable = group.destinations.some(
      d => d.kind === 'chat' && d.network === contact.network && !d.isGroup
    );
    if (alreadyReachable) {
      return;
    }

    group.destinations.push({
      kind: 'contact',
      userID: contact.id,
      accountID: contact.accountID,
      network: contact.network,
      handle: handleFor(contact),
      cannotMessage: Boolean(contact.cannotMessage),
      // /v1/chats/start resolves the best identifier per network, so keep them all
      user: {
        id: contact.id,
        username: contact.username,
        phoneNumber: contact.phoneNumber,
        email: contact.email,
        fullName: contact.fullName
      }
    });
  });

  // Existing chats first, then most recently active
  const rank = (group) => {
    const hasChat = group.destinations.some(d => d.kind === 'chat');
    const recent = Math.max(
      0,
      ...group.destinations.map(d => (d.lastActivity ? new Date(d.lastActivity).getTime() : 0))
    );
    return { hasChat, recent };
  };

  return [...groups.values()].sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    if (ra.hasChat !== rb.hasChat) {
      return ra.hasChat ? -1 : 1;
    }
    return rb.recent - ra.recent;
  });
}

/**
 * Encode a contact payload for transport through Alfred's pipe-delimited arg.
 * base64 keeps pipes, spaces and newlines out of the argument string.
 * @param {Object} user - Contact payload
 * @returns {string} base64-encoded JSON
 */
function encodeUser(user) {
  return Buffer.from(JSON.stringify(user), 'utf8').toString('base64');
}

/**
 * Build the Alfred row for one reachable destination
 * @param {Object} group - Person group
 * @param {Object} dest - One destination for that person
 * @param {boolean} showName - Whether to lead with the person's name
 * @returns {Object} Alfred item
 */
function destinationItem(group, dest, showName) {
  const network = getNetworkInfo(dest.network);
  const icon = network.icon ? { path: network.icon } : { path: 'icon.png' };
  const title = showName ? group.name : `   ↳ ${group.name}`;

  if (dest.kind === 'chat') {
    const parts = [`${network.emoji || ''} ${network.name}`.trim()];
    parts.push(dest.isGroup ? 'Group chat' : 'Existing chat');
    if (dest.lastActivity) {
      parts.push(formatRelativeTime(dest.lastActivity));
    }
    if (dest.preview) {
      parts.push(`"${truncateText(dest.preview, 40)}"`);
    }

    return createItem({
      uid: `contact-chat-${dest.chatID}`,
      title,
      subtitle: parts.join(' • '),
      // Type a message after the destination to send it straight away
      arg: `open-chat|${dest.chatID}`,
      valid: true,
      variables: {
        selected_chat_id: dest.chatID,
        selected_chat_name: group.name,
        selected_network: network.name
      },
      mods: {
        cmd: {
          subtitle: `Compose a message to ${group.name} on ${network.name}`,
          arg: `compose|${dest.chatID}`
        },
        alt: {
          subtitle: `Copy name: ${group.name}`,
          arg: `copy-text|${group.name}`
        }
      },
      text: {
        copy: group.name,
        largetype: `${group.name}\n${network.name}`
      },
      icon
    });
  }

  // Contact with no existing chat — selecting it creates the chat first
  const parts = [`${network.emoji || ''} ${network.name}`.trim()];
  parts.push(dest.cannotMessage ? 'Cannot start a chat here' : 'Start new conversation');
  if (dest.handle) {
    parts.push(dest.handle);
  }

  return createItem({
    uid: `contact-new-${dest.accountID}-${dest.userID}`,
    title,
    subtitle: parts.join(' • '),
    arg: `start-chat|${dest.accountID}|${encodeUser(dest.user)}`,
    valid: !dest.cannotMessage,
    variables: {
      selected_account_id: dest.accountID,
      selected_user_id: dest.userID,
      selected_chat_name: group.name,
      selected_network: network.name
    },
    mods: {
      cmd: {
        subtitle: `Compose a message to ${group.name} on ${network.name}`,
        arg: `start-chat|${dest.accountID}|${encodeUser(dest.user)}`
      },
      alt: {
        subtitle: `Copy name: ${group.name}`,
        arg: `copy-text|${group.name}`
      }
    },
    text: {
      copy: group.name,
      largetype: `${group.name}\n${network.name}`
    },
    icon
  });
}

/**
 * Contact command handler
 * @param {Array} args - Command arguments
 */
async function contact(args) {
  try {
    const raw = args.join(' ').trim();

    if (!raw) {
      outputItems([
        createInfoItem(
          'Type a name to find someone',
          'Searches contacts across every connected network'
        )
      ]);
      return;
    }

    if (!getAccessToken()) {
      outputItems([
        createItem({
          uid: 'contact-no-token',
          title: '⚠️ API Token Not Configured',
          subtitle: 'Type "bp setup" to configure your Beeper Desktop API token',
          valid: false,
          icon: { path: 'icon.png' }
        })
      ]);
      return;
    }

    // "alice >> hey there" sends immediately; plain "alice" just lists destinations
    const [namePart, ...messageParts] = raw.split('>>');
    const query = namePart.trim();
    const message = messageParts.join('>>').trim();

    if (!query) {
      outputItems([
        createInfoItem('Type a name before ">>"', 'Example: bp contact alice >> running late')
      ]);
      return;
    }

    const client = new BeeperClient();
    const [chats, contacts] = await Promise.all([
      client.searchChats(query, { limit: 10 }),
      client.searchContactsGlobal(query)
    ]);
    const groups = groupByPerson(chats, contacts);

    if (groups.length === 0) {
      outputItems([
        createInfoItem(
          'No contacts found',
          `Nobody matching "${query}" on any connected network`
        )
      ]);
      return;
    }

    const items = [];

    // Alfred only ever shows a handful of rows, and a Script Filter's output
    // travels through a 128 KB pipe — more people than this truncates the JSON.
    const MAX_PEOPLE = 20;
    const shown = groups.slice(0, MAX_PEOPLE);

    shown.forEach(group => {
      group.destinations.forEach((dest, index) => {
        const item = destinationItem(group, dest, index === 0);

        // With a message typed, Enter sends it rather than opening the chat
        if (message) {
          const network = getNetworkInfo(dest.network);
          item.subtitle = `Send on ${network.name}: "${truncateText(message, 45)}"`;
          item.arg = dest.kind === 'chat'
            ? `send-message|${dest.chatID}|${message}`
            : `send-new|${dest.accountID}|${encodeUser(dest.user)}|${message}`;
        }

        items.push(item);
      });
    });

    // Say so rather than silently dropping people off the end of the list
    if (groups.length > shown.length) {
      items.push(createInfoItem(
        `Showing ${shown.length} of ${groups.length} matches`,
        'Type more of the name to narrow the search'
      ));
    }

    outputItems(items);

  } catch (error) {
    if (error.message.includes('ECONNREFUSED')) {
      outputItems([
        createItem({
          uid: 'contact-no-connection',
          title: '❌ Cannot Connect to Beeper Desktop',
          subtitle: 'Make sure Beeper Desktop is running',
          valid: false,
          icon: { path: 'icon.png' }
        })
      ]);
    } else if (error.status === 401) {
      outputItems([
        createItem({
          uid: 'contact-invalid-token',
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

module.exports = contact;
module.exports.groupByPerson = groupByPerson;
module.exports.displayName = displayName;
