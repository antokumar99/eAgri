/**
 * Chat Navigation Utilities
 * 
 * Helper functions for navigating to chat screens with proper user data
 */

import { Alert } from 'react-native';
import chatService from '../services/chatService';

/**
 * Navigate to chat screen with a specific user
 * @param {Object} navigation - React Navigation object
 * @param {Object} targetUser - The user to chat with
 * @param {string} targetUser._id - Target user's ID
 * @param {string} targetUser.name - Target user's display name
 * @param {string} [targetUser.avatar] - Target user's avatar URL
 */
export const navigateToChat = (navigation, targetUser) => {
  // Validate parameters
  if (!navigation) {
    console.error('Navigation object is required');
    return;
  }

  if (!targetUser || !targetUser._id) {
    Alert.alert('Error', 'Cannot start chat: User information is missing');
    return;
  }

  // Check if current user is authenticated
  if (!chatService.isAuthenticated()) {
    Alert.alert(
      'Authentication Required', 
      'Please login to use chat features',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Login', 
          onPress: () => navigation.navigate('Login')
        }
      ]
    );
    return;
  }

  // Navigate to chat screen
  navigation.navigate('ChatScreen', {
    userId: targetUser._id,
    userName: targetUser.name || targetUser.username || 'User',
    userAvatar: targetUser.avatar
  });
};

/**
 * Start chat from user profile context
 * @param {Object} navigation - React Navigation object
 * @param {Object} userProfile - User profile data
 */
export const startChatFromProfile = (navigation, userProfile) => {
  const currentUser = chatService.getCurrentUser();
  
  // Don't allow chat with self
  if (currentUser && currentUser._id === userProfile._id) {
    Alert.alert('Info', 'You cannot chat with yourself');
    return;
  }

  navigateToChat(navigation, userProfile);
};

/**
 * Start chat from order/transaction context
 * @param {Object} navigation - React Navigation object
 * @param {Object} order - Order/transaction data
 * @param {string} role - 'buyer' or 'seller' - who to chat with
 */
export const startChatFromOrder = (navigation, order, role = 'seller') => {
  let targetUser;

  if (role === 'seller' && order.sellerId) {
    targetUser = {
      _id: order.sellerId,
      name: order.sellerName || 'Seller',
      avatar: order.sellerAvatar
    };
  } else if (role === 'buyer' && order.buyerId) {
    targetUser = {
      _id: order.buyerId,
      name: order.buyerName || 'Buyer',
      avatar: order.buyerAvatar
    };
  } else {
    Alert.alert('Error', `Cannot find ${role} information for this order`);
    return;
  }

  navigateToChat(navigation, targetUser);
};

/**
 * Start chat from post/community context
 * @param {Object} navigation - React Navigation object
 * @param {Object} post - Post data
 */
export const startChatFromPost = (navigation, post) => {
  if (!post.userId) {
    Alert.alert('Error', 'Cannot find post author information');
    return;
  }

  const targetUser = {
    _id: post.userId._id || post.userId,
    name: post.userId.name || post.authorName || 'User',
    avatar: post.userId.avatar || post.authorAvatar
  };

  navigateToChat(navigation, targetUser);
};

/**
 * Check if chat is available for current user
 * @returns {boolean} - True if chat is available
 */
export const isChatAvailable = () => {
  return chatService.isAuthenticated();
};

/**
 * Get current user's chat info
 * @returns {Object|null} - Current user info or null
 */
export const getCurrentChatUser = () => {
  return chatService.getCurrentUser();
};

/**
 * Navigate to Messages screen (chat list)
 * @param {Object} navigation - React Navigation object
 */
export const navigateToMessages = (navigation) => {
  if (!navigation) {
    console.error('Navigation object is required');
    return;
  }

  // Check if current user is authenticated
  if (!chatService.isAuthenticated()) {
    showChatUnavailable(navigation);
    return;
  }

  navigation.navigate('Messages');
};

/**
 * Display chat unavailable message
 * @param {Object} navigation - React Navigation object
 */
export const showChatUnavailable = (navigation) => {
  Alert.alert(
    'Chat Unavailable',
    'Please login to use chat features',
    [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Login', 
        onPress: () => navigation.navigate('Login')
      }
    ]
  );
};

export default {
  navigateToChat,
  navigateToMessages,
  startChatFromProfile,
  startChatFromOrder,
  startChatFromPost,
  isChatAvailable,
  getCurrentChatUser,
  showChatUnavailable
};