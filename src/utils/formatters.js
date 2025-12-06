/**
 * Text and Time Formatters
 * Utility functions for formatting text and timestamps
 */

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text with ellipsis if needed
 */
function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) {
    return text || '';
  }
  return `${text.substring(0, maxLength - 3)  }...`;
}

/**
 * Format timestamp to relative time
 * @param {string|Date} timestamp - Timestamp to format
 * @returns {string} Relative time string (e.g., "2m ago", "5h ago")
 */
function formatRelativeTime(timestamp) {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) {
    return 'just now';
  } else if (diffMin < 60) {
    return `${diffMin}m ago`;
  } else if (diffHour < 24) {
    return `${diffHour}h ago`;
  } else if (diffDay < 7) {
    return `${diffDay}d ago`;
  } else if (diffWeek < 4) {
    return `${diffWeek}w ago`;
  } else if (diffMonth < 12) {
    return `${diffMonth}mo ago`;
  } else {
    return `${diffYear}y ago`;
  }
}

/**
 * Format unread count for display
 * @param {number} count - Unread count
 * @returns {string} Formatted count (e.g., "5 messages", "1 message")
 */
function formatUnreadCount(count) {
  if (count === 0) {
    return 'No unread messages';
  }
  if (count === 1) {
    return '1 message';
  }
  return `${count} messages`;
}

/**
 * Format chat subtitle with network and time
 * @param {string} network - Network name
 * @param {string} timestamp - Timestamp
 * @param {string} preview - Message preview (optional)
 * @returns {string} Formatted subtitle
 */
function formatChatSubtitle(network, timestamp, preview = null) {
  const parts = [network];
  
  if (timestamp) {
    parts.push(formatRelativeTime(timestamp));
  }
  
  if (preview) {
    parts.push(`"${truncateText(preview, 50)}"`);
  }
  
  return parts.join(' • ');
}

/**
 * Highlight search terms in text
 * @param {string} text - Text to highlight
 * @param {string} query - Search query
 * @returns {string} Text with highlighted terms
 */
function highlightSearchTerms(text, query) {
  if (!query || !text) {
    return text;
  }

  // Simple highlighting - could be enhanced with regex
  // const _terms = query.toLowerCase().split(' ');
  const highlighted = text;

  // Note: Alfred doesn't support HTML, so we use Unicode characters
  // or just return the text as-is for now
  return highlighted;
}

/**
 * Format participant names for group chats
 * @param {Array} participants - Array of participant objects
 * @param {number} maxShow - Maximum number of names to show
 * @returns {string} Formatted participant names
 */
function formatParticipantNames(participants, maxShow = 3) {
  if (!participants || participants.length === 0) {
    return '';
  }
  
  const names = participants
    .filter(p => !p.isSelf)
    .map(p => p.fullName || p.username || 'Unknown')
    .slice(0, maxShow);
  
  if (participants.length > maxShow) {
    names.push(`+${participants.length - maxShow} more`);
  }
  
  return names.join(', ');
}

/**
 * Clean message text for preview
 * @param {string} text - Message text
 * @returns {string} Cleaned text
 */
function cleanMessageText(text) {
  if (!text) {
    return '';
  }
  
  // Remove excessive whitespace and newlines
  return text
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Format badge count indicator
 * @param {number} count - Count to display
 * @returns {string} Badge indicator (🔴/🟡/🟢)
 */
function getBadgeIndicator(count) {
  if (count === 0) {
    return '';
  }
  if (count > 10) {
    return '🔴';
  }
  if (count >= 5) {
    return '🟡';
  }
  return '🟢';
}

module.exports = {
  truncateText,
  formatRelativeTime,
  formatUnreadCount,
  formatChatSubtitle,
  highlightSearchTerms,
  formatParticipantNames,
  cleanMessageText,
  getBadgeIndicator
};
