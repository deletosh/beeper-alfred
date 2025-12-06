/**
 * Network Configuration
 * Maps Beeper network names to icon paths and metadata
 */

module.exports = {
  'WhatsApp': {
    id: 'whatsapp',
    icon: 'icons/whatsapp.png',
    color: '#25D366',
    sfSymbol: 'message.fill',
    displayName: 'WhatsApp',
    emoji: '💬',
    name: 'WhatsApp'
  },
  'Telegram': {
    id: 'telegram',
    icon: 'icons/telegram.png',
    color: '#0088cc',
    sfSymbol: 'paperplane.fill',
    displayName: 'Telegram',
    emoji: '✈️',
    name: 'Telegram'
  },
  'Signal': {
    id: 'signal',
    icon: 'icons/signal.png',
    color: '#3A76F0',
    sfSymbol: 'lock.shield.fill',
    displayName: 'Signal',
    emoji: '🔒',
    name: 'Signal'
  },
  'Slack': {
    id: 'slack',
    icon: 'icons/slack.png',
    color: '#4A154B',
    sfSymbol: 'number.square.fill',
    displayName: 'Slack',
    emoji: '#️⃣',
    name: 'Slack'
  },
  'Instagram': {
    id: 'instagram',
    icon: 'icons/instagram.png',
    color: '#E4405F',
    sfSymbol: 'camera.fill',
    displayName: 'Instagram',
    emoji: '📷',
    name: 'Instagram'
  },
  'Messenger': {
    id: 'messenger',
    icon: 'icons/messenger.png',
    color: '#0084FF',
    sfSymbol: 'bolt.fill',
    displayName: 'Messenger',
    emoji: '⚡',
    name: 'Messenger'
  },
  'Discord': {
    id: 'discord',
    icon: 'icons/discord.png',
    color: '#5865F2',
    sfSymbol: 'gamecontroller.fill',
    displayName: 'Discord',
    emoji: '🎮',
    name: 'Discord'
  },
  'X': {
    id: 'twitter',
    icon: 'icons/twitter.png',
    color: '#000000',
    sfSymbol: 'bird.fill',
    displayName: 'X',
    emoji: '🐦',
    name: 'X'
  },
  'Twitter': {
    id: 'twitter',
    icon: 'icons/twitter.png',
    color: '#000000',
    sfSymbol: 'bird.fill',
    displayName: 'X',
    emoji: '🐦',
    name: 'X'
  },
  'LinkedIn': {
    id: 'linkedin',
    icon: 'icons/linkedin.png',
    color: '#0A66C2',
    sfSymbol: 'briefcase.fill',
    displayName: 'LinkedIn',
    emoji: '💼',
    name: 'LinkedIn'
  },
  'Google Messages': {
    id: 'googlemessages',
    icon: 'icons/googlemessages.png',
    color: '#4285F4',
    sfSymbol: 'message.fill',
    displayName: 'Google Messages',
    emoji: '💬',
    name: 'Google Messages'
  },
  'iMessage': {
    id: 'imessage',
    icon: 'icons/imessage.png',
    color: '#007AFF',
    sfSymbol: 'message.fill',
    displayName: 'iMessage',
    emoji: '💙',
    name: 'iMessage'
  },
  'SMS': {
    id: 'sms',
    icon: 'icons/sms.png',
    color: '#34C759',
    sfSymbol: 'message.fill',
    displayName: 'SMS',
    emoji: '📱',
    name: 'SMS'
  },
  'Google Chat': {
    id: 'googlechat',
    icon: 'icons/googlechat.png',
    color: '#00AC47',
    sfSymbol: 'bubble.left.and.bubble.right.fill',
    displayName: 'Google Chat',
    emoji: '💬',
    name: 'Google Chat'
  },
  'Google Voice': {
    id: 'googlevoice',
    icon: 'icons/googlevoice.png',
    color: '#00897B',
    sfSymbol: 'phone.fill',
    displayName: 'Google Voice',
    emoji: '☎️',
    name: 'Google Voice'
  }
};

/**
 * Get network configuration by name
 * @param {string} networkName - Network name from Beeper API
 * @returns {Object|null} Network config or null if not found
 */
function getNetworkConfig(networkName) {
  return module.exports[networkName] || null;
}

/**
 * Get network icon path
 * @param {string} networkName - Network name from Beeper API
 * @returns {string} Icon path or default icon
 */
function getNetworkIcon(networkName) {
  const config = getNetworkConfig(networkName);
  return config ? config.icon : 'icons/default.png';
}

/**
 * Get network info (alias for getNetworkConfig with default fallback)
 * @param {string} networkName - Network name from Beeper API
 * @returns {Object} Network info with emoji, name, and icon
 */
function getNetworkInfo(networkName) {
  const config = getNetworkConfig(networkName);
  if (config) {
    return config;
  }
  // Return default for unknown networks
  return {
    id: 'unknown',
    icon: 'icon.png',
    color: '#999999',
    displayName: networkName || 'Unknown',
    emoji: '💬',
    name: networkName || 'Unknown'
  };
}

module.exports.getNetworkConfig = getNetworkConfig;
module.exports.getNetworkIcon = getNetworkIcon;
module.exports.getNetworkInfo = getNetworkInfo;
