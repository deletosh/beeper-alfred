/**
 * Beeper API Client
 *
 * Talks to the Beeper Desktop REST API (/v1/*) directly via src/api/http.js.
 * The @beeper/desktop-api SDK is deliberately not used: it targets the older
 * RPC-style /v0/* routes, which return 404 on current Beeper builds.
 */

const { request } = require('./http');
const { getAccessToken } = require('../utils/tokenStore');

class BeeperClient {
  constructor(accessToken = null) {
    // Explicit argument wins, then the workflow variable, then the OAuth token
    // saved by `bp setup` (see src/utils/tokenStore.js).
    this.accessToken = accessToken || getAccessToken();
    this.apiUrl = process.env.BEEPER_API_URL || 'http://localhost:23373';

    if (!this.accessToken) {
      throw new Error('Not authorized with Beeper. Run: bp setup');
    }
  }

  /**
   * Call the Beeper Desktop v1 REST API directly.
   * Current Beeper builds serve /v1/*; the pinned SDK still targets /v0/*.
   * @param {Object} options - See src/api/http.js
   * @returns {Promise<*>} Parsed response
   */
  v1(options) {
    return request({
      ...options,
      token: this.accessToken,
      baseUrl: this.apiUrl
    });
  }

  /**
   * Test API connection
   * @returns {Promise<boolean>} True if connected
   */
  async testConnection() {
    try {
      await this.v1({ path: '/v1/accounts' });
      return true;
    } catch (error) {
      // http.js surfaces connection failures as an ECONNREFUSED-prefixed message
      if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
        throw new Error('Beeper Desktop not running. Please start the app.');
      }
      throw error;
    }
  }

  /**
   * Global search across chats, messages, and groups
   * @param {string} query - Search query
   * @returns {Promise<Object>} Search results with chats, in_groups, and messages
   */
  async globalSearch(query) {
    const results = await this.v1({
      path: '/v1/search',
      query: { query }
    });

    return {
      chats: results.results?.chats || [],
      groups: results.results?.in_groups || [],
      messages: {
        items: results.results?.messages?.items || [],
        chats: results.results?.messages?.chats || {},
        hasMore: results.results?.messages?.hasMore || false
      }
    };
  }

  /**
   * Search messages across all chats
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Array of messages
   */
  async searchMessages(query, options = {}) {
    const {
      accountIDs = null,
      limit = 20
    } = options;

    const results = await this.v1({
      path: '/v1/messages/search',
      query: { query, accountIDs, limit }
    });

    return results?.items || [];
  }

  /**
   * Get unread chats
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} Array of unread chats
   */
  async getUnreadChats(options = {}) {
    const {
      networkFilter = null,
      includeMuted = false,
      limit = 50
    } = options;

    const searchParams = {
      inbox: 'primary',
      includeMuted,
      limit,
      unreadOnly: true
    };

    if (networkFilter) {
      // TODO: Add network filtering logic
      // Need to get account IDs for specific network
    }

    const results = await this.v1({
      path: '/v1/chats/search',
      query: searchParams
    });

    return results?.items || [];
  }

  /**
   * Search chats by name/participants
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Array of chats
   */
  async searchChats(query, options = {}) {
    const {
      limit = 20,
      type = 'any' // 'single', 'group', or 'any'
    } = options;

    const results = await this.v1({
      path: '/v1/chats/search',
      query: { query, limit, type }
    });

    return results?.items || [];
  }

  /**
   * Get recent chats
   * @param {number} limit - Number of chats to return
   * @returns {Promise<Array>} Array of recent chats
   */
  async getRecentChats(limit = 10) {
    const results = await this.v1({
      path: '/v1/chats/search',
      query: { limit, inbox: 'primary' }
    });

    return results?.items || [];
  }

  /**
   * Send message to chat
   * @param {string} chatId - Chat ID
   * @param {string} text - Message text
   * @param {Array} attachments - File attachments (optional)
   * @returns {Promise<Object>} Send result
   */
  sendMessage(chatId, text, _attachments = []) {
    // TODO: Handle attachments when API supports it
    return this.sendMessageV1(chatId, text);
  }

  /**
   * Archive chat
   * @param {string} chatId - Chat ID
   * @param {boolean} archived - True to archive, false to unarchive
   * @returns {Promise<void>}
   */
  async archiveChat(chatId, archived = true) {
    await this.v1({
      method: 'POST',
      path: `/v1/chats/${encodeURIComponent(chatId)}/archive`,
      body: { archived }
    });
  }

  /**
   * Open chat or message in Beeper Desktop
   * @param {string} chatId - Chat ID
   * @param {string} messageId - Message ID (optional)
   * @returns {Promise<void>}
   */
  openInBeeper(chatId, messageId = null) {
    const focusParams = { chatID: chatId };

    if (messageId) {
      focusParams.messageID = messageId;
    }

    return this.focus(focusParams);
  }

  /**
   * Get all connected accounts
   * @returns {Promise<Array>} Array of accounts
   */
  async getAccounts() {
    // GET /v1/accounts returns an array directly, not wrapped in an object
    const results = await this.v1({ path: '/v1/accounts' });
    return results || [];
  }

  /**
   * Get chat details
   * @param {string} chatId - Chat ID
   * @returns {Promise<Object>} Chat object
   */
  getChat(chatId) {
    return this.v1({ path: `/v1/chats/${encodeURIComponent(chatId)}` });
  }

  /**
   * Search contacts within a specific account
   * @param {string} accountId - Account ID to search within
   * @param {string} query - Search query
   * @returns {Promise<Array>} Array of contacts (User objects)
   */
  async searchContacts(accountId, query) {
    const results = await this.v1({
      path: `/v1/accounts/${encodeURIComponent(accountId)}/contacts`,
      query: { query }
    });
    return results?.items || [];
  }

  /**
   * Search contacts across every connected account, in parallel.
   * A failing network (unsupported search, disconnected bridge) is skipped
   * rather than failing the whole lookup.
   *
   * Results are capped per account: GET /v1/accounts/{id}/contacts takes no
   * limit parameter, so a short query like "a" can match thousands of contacts
   * per network. Rendering all of them overflows the 128 KB pipe Alfred reads
   * a Script Filter's output through, which truncates the JSON and shows the
   * user nothing at all.
   * @param {string} query - Search query
   * @param {number} perAccountLimit - Max contacts to keep from each account
   * @returns {Promise<Array>} Array of contacts annotated with accountID/network
   */
  async searchContactsGlobal(query, perAccountLimit = 20) {
    const accounts = await this.getAccounts();

    const contactsByAccount = await Promise.all(
      accounts.map(async (account) => {
        try {
          const contacts = await this.searchContacts(account.accountID, query);
          return contacts
            // Never offer to message yourself
            .filter(contact => !contact.isSelf)
            .slice(0, perAccountLimit)
            .map(contact => ({
              ...contact,
              accountID: account.accountID,
              network: account.network
            }));
        } catch (error) {
          console.error(`Failed to search contacts in ${account.network}:`, error.message);
          return [];
        }
      })
    );

    return contactsByAccount.flat();
  }

  /**
   * Start (or reuse) a 1:1 chat with a contact.
   * POST /v1/chats/start resolves the best identifier for the network, so pass
   * through whatever the contact search returned rather than only the ID.
   * @param {string} accountId - Account to start the chat on
   * @param {Object} user - Contact payload ({id, username, phoneNumber, email, fullName})
   * @param {string} messageText - Optional first message, if the network requires one
   * @returns {Promise<Object>} Chat object (includes id and chatID alias)
   */
  startChat(accountId, user, messageText = null) {
    const body = {
      accountID: accountId,
      user: {
        id: user.id,
        username: user.username,
        phoneNumber: user.phoneNumber,
        email: user.email,
        fullName: user.fullName
      }
    };

    // Drop undefined identifier hints so the resolver isn't given empty values
    Object.keys(body.user).forEach(k => body.user[k] === undefined && delete body.user[k]);

    if (messageText) {
      body.messageText = messageText;
    }

    return this.v1({ method: 'POST', path: '/v1/chats/start', body });
  }

  /**
   * Send a message to an existing chat
   * @param {string} chatId - Chat ID
   * @param {string} text - Message text
   * @returns {Promise<Object>} Send result
   */
  sendMessageV1(chatId, text) {
    return this.v1({
      method: 'POST',
      path: `/v1/chats/${encodeURIComponent(chatId)}/messages`,
      body: { text }
    });
  }

  /**
   * Focus Beeper Desktop, optionally on a chat and with a prefilled draft
   * @param {Object} params - {chatID, messageID, draftText}
   * @returns {Promise<Object>} Focus result
   */
  focus(params) {
    return this.v1({ method: 'POST', path: '/v1/focus', body: params });
  }
}

module.exports = BeeperClient;
