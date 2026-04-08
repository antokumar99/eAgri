// Native JavaScript date utilities (no external dependencies)

// Helper functions for date operations
const isToday = (date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const isYesterday = (date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
};

const formatTime = (date) => {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
};

const formatDate = (date) => {
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
};

const formatFullDate = (date) => {
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  }) + ' ' + formatTime(date);
};

const differenceInMinutes = (date1, date2) => {
  return Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60);
};

// Format timestamp for message display
export const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  
  if (isToday(date)) {
    return formatTime(date);
  } else if (isYesterday(date)) {
    return 'Yesterday';
  } else {
    return formatDate(date);
  }
};

// Format timestamp for detailed view
export const formatDetailedTime = (timestamp) => {
  if (!timestamp) return '';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  
  if (isToday(date)) {
    return formatTime(date);
  } else if (isYesterday(date)) {
    return `Yesterday ${formatTime(date)}`;
  } else {
    return formatFullDate(date);
  }
};

// Check if messages should be grouped (same sender, within 5 minutes)
export const shouldGroupMessages = (currentMessage, previousMessage) => {
  if (!previousMessage || !currentMessage) return false;
  
  if (currentMessage.senderId !== previousMessage.senderId) return false;
  
  const currentTime = currentMessage.timestamp?.toDate ? 
    currentMessage.timestamp.toDate() : new Date(currentMessage.timestamp);
  const previousTime = previousMessage.timestamp?.toDate ? 
    previousMessage.timestamp.toDate() : new Date(previousMessage.timestamp);
  
  return differenceInMinutes(currentTime, previousTime) <= 5;
};

// Generate chat room ID from participant IDs
export const generateChatId = (userId1, userId2) => {
  return [userId1, userId2].sort().join('_');
};

// Get other participant from chat participants array
export const getOtherParticipant = (participants, currentUserId) => {
  return participants.find(id => id !== currentUserId);
};

// Truncate long messages for preview
export const truncateMessage = (message, maxLength = 50) => {
  if (!message) return '';
  return message.length > maxLength ? `${message.substring(0, maxLength)}...` : message;
};

// Get user initials for avatar fallback
export const getUserInitials = (username) => {
  if (!username) return '?';
  
  const names = username.trim().split(' ');
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  
  return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
};

// Check if user is online (last seen within 5 minutes)
export const isUserOnline = (lastSeen) => {
  if (!lastSeen) return false;
  
  const lastSeenDate = lastSeen.toDate ? lastSeen.toDate() : new Date(lastSeen);
  const now = new Date();
  
  return differenceInMinutes(now, lastSeenDate) <= 5;
};

// Format last seen time
export const formatLastSeen = (lastSeen, isOnline) => {
  if (isOnline) return 'Online';
  if (!lastSeen) return 'Last seen unknown';
  
  const date = lastSeen.toDate ? lastSeen.toDate() : new Date(lastSeen);
  
  if (isToday(date)) {
    return `Last seen ${format(date, 'HH:mm')}`;
  } else if (isYesterday(date)) {
    return `Last seen yesterday`;
  } else {
    return `Last seen ${format(date, 'MMM dd')}`;
  }
};

// Validate message text
export const validateMessage = (text) => {
  if (!text || typeof text !== 'string') {
    return { isValid: false, error: 'Message cannot be empty' };
  }
  
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Message cannot be empty' };
  }
  
  if (trimmed.length > 1000) {
    return { isValid: false, error: 'Message is too long (max 1000 characters)' };
  }
  
  return { isValid: true, message: trimmed };
};

// Generate unique message ID for optimistic updates
export const generateTempMessageId = () => {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Color scheme for the chat interface - Crystal Teal & Aquamarine Theme
export const chatColors = {
  primary: '#2db39e', // Turquoise/Crystal Teal
  secondary: '#2daab3', // Aquamarine
  accent: '#20B2AA', // Light Sea Green
  background: '#F0FFFF', // Azure (very light cyan)
  surface: '#E0FFFF', // Light Cyan
  text: {
    primary: '#2F4F4F', // Dark Slate Gray
    secondary: '#708090', // Slate Gray
    hint: '#B0C4DE' // Light Steel Blue
  },
  message: {
    sent: 'linear-gradient(135deg, #40E0D0, #7FFFD4)', // Gradient from crystal teal to aquamarine
    sentSolid: '#40E0D0', // Crystal Teal for sent messages
    received: '#F5FFFA', // Mint Cream for received messages
    sentText: '#FFFFFF', // White text for sent messages
    receivedText: '#2F4F4F' // Dark Slate Gray for received messages
  },
  status: {
    online: '#00CED1', // Dark Turquoise
    offline: '#B0C4DE', // Light Steel Blue
    away: '#48D1CC', // Medium Turquoise
    typing: '#7FFFD4' // Aquamarine
  },
  shadow: {
    color: '#40E0D0',
    opacity: 0.2,
    radius: 4,
    elevation: 3
  }
};

export default {
  formatMessageTime,
  formatDetailedTime,
  shouldGroupMessages,
  generateChatId,
  getOtherParticipant,
  truncateMessage,
  getUserInitials,
  isUserOnline,
  formatLastSeen,
  validateMessage,
  generateTempMessageId,
  chatColors
};