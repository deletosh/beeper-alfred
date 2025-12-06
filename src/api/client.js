/**
 * Beeper API Client
 * Wrapper around @beeper/desktop-api with helper methods
 */

const BeeperDesktop = require('@beeper/desktop-api');

class BeeperClient {
  constructor(accessToken = null) {
    // Get token from environment or parameter
    this.accessToken = accessToken || process.env.BEEPER_ACCESS_TOKEN;
    this.apiUrl = process.env.BEEPER_API_URL || 'http://localhost:23373';
    
    if (!this.accessToken) {
      throw new Error('BEEPER_ACCESS_TOKEN not configured. Run: bp setup');
    }

    // Initialize SDK client
    this.client = new BeeperDesktop({
      accessToken: this.accessToken,
      baseURL: this.apiUrl
    });
  }

  /**
   * Test API connection
   * @returns {Promise<boolean>} True if connected
   */
  async testConnection() {
    try {
      await this.client.accounts.list();
      return true;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
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
    // Use the SDK's app.search method (uses /v0/search endpoint)
    const results = await this.client.app.search({ query });

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

    const results = await this.client.messages.search({
      query,
      accountIDs,
      limit
    });

    return results.items || [];
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

    const results = await this.client.chats.search(searchParams);

    return results.items || [];
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

    const results = await this.client.chats.search({
      query,
      limit,
      type
    });

    return results.items || [];
  }

  /**
   * Get recent chats
   * @param {number} limit - Number of chats to return
   * @returns {Promise<Array>} Array of recent chats
   */
  async getRecentChats(limit = 10) {
    const results = await this.client.chats.search({
      limit,
      inbox: 'primary'
    });

    return results.items || [];
  }

  /**
   * Send message to chat
   * @param {string} chatId - Chat ID
   * @param {string} text - Message text
   * @param {Array} attachments - File attachments (optional)
   * @returns {Promise<Object>} Send result
   */
  async sendMessage(chatId, text, _attachments = []) {
    // TODO: Handle attachments when API supports it
    const result = await this.client.messages.send(chatId, {
      text
    });

    return result;
  }

  /**
   * Archive chat
   * @param {string} chatId - Chat ID
   * @param {boolean} archived - True to archive, false to unarchive
   * @returns {Promise<void>}
   */
  async archiveChat(chatId, archived = true) {
    await this.client.chats.archive(chatId, {
      archived
    });
  }

  /**
   * Open chat or message in Beeper Desktop
   * @param {string} chatId - Chat ID
   * @param {string} messageId - Message ID (optional)
   * @returns {Promise<void>}
   */
  async openInBeeper(chatId, messageId = null) {
    console.error(`[BeeperClient] openInBeeper called with chatId=${chatId}, messageId=${messageId}`);

    const focusParams = { chatID: chatId };

    if (messageId) {
      focusParams.messageID = messageId;
    }

    console.error('[BeeperClient] Calling focus with params:', JSON.stringify(focusParams));

    try {
      // SDK doesn't have focus() method yet, so we make a direct POST request to /v1/focus
      const result = await this.client.post('/v1/focus', { body: focusParams });
      console.error('[BeeperClient] focus result:', JSON.stringify(result));
      return result;
    } catch (error) {
      console.error('[BeeperClient] focus error:', error.message);
      throw error;
    }
  }

  /**
   * Get all connected accounts
   * @returns {Promise<Array>} Array of accounts
   */
  async getAccounts() {
    const results = await this.client.accounts.list();
    // accounts.list() returns an array directly, not wrapped in an object
    return results || [];
  }

  /**
   * Get chat details
   * @param {string} chatId - Chat ID
   * @returns {Promise<Object>} Chat object
   */
  getChat(chatId) {
    return this.client.chats.retrieve(chatId);
  }

  /**
   * Search contacts within a specific account
   * @param {string} accountId - Account ID to search within
   * @param {string} query - Search query
   * @returns {Promise<Array>} Array of contacts (User objects)
   */
  async searchContacts(accountId, query) {
    const results = await this.client.accounts.contacts.search(accountId, { query });
    return results.items || [];
  }

  /**
   * Search contacts across all accounts (grouped by account)
   * @param {string} query - Search query
   * @returns {Promise<Array>} Array of contacts with account info
   */
  async searchContactsGlobal(query) {
    // Get all accounts first
    const accounts = await this.getAccounts();

    // Search contacts in each account
    const contactsByAccount = await Promise.all(
      accounts.map(async (account) => {
        try {
          const contacts = await this.searchContacts(account.accountID, query);
          return contacts.map(contact => ({
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

    // Flatten results
    return contactsByAccount.flat();
  }

  /**
   * Create a new chat with a user
   * @param {string} accountId - Account ID to create chat in
   * @param {string} userId - User ID to chat with
   * @returns {Promise<Object>} Created chat object
   */
  async createChat(accountId, userId) {
    const result = await this.client.chats.create({
      accountID: accountId,
      userIDs: [userId]
    });
    return result;
  }
}

module.exports = BeeperClient;
