/**
 * Utility script to clean up demo/test chat rooms from Firestore
 * 
 * This script helps remove leftover demo chat rooms that were created during development.
 * Run this manually if you want to clean up your Firestore database.
 */

import chatService from '../services/chatService';

/**
 * Clean up demo chat rooms from Firestore
 * Call this function manually from console or a debug screen
 */
export const cleanupAllDemoChats = async () => {
  try {
    // Initialize chat service first
    const currentUser = await chatService.initializeUser();
    if (!currentUser) {
      return [];
    }
    
    // Run the cleanup
    const demoChatIds = await chatService.cleanupDemoChats();
    return demoChatIds;
  } catch (error) {
    console.error('Cleanup failed:', error);
    return [];
  }
};

/**
 * Check if current user has any demo chats (read-only)
 */
export const checkForDemoChats = async () => {
  try {
    const currentUser = await chatService.initializeUser();
    if (!currentUser) {
      return [];
    }
    
    const chatRooms = await chatService.getUserChatRooms();
    const demoChats = chatRooms.filter(chatRoom => {
      return chatRoom.participantIds?.some(id => 
        chatService.isDemoOrTestUser(id) || !chatService.isValidObjectId(id)
      );
    });
    
    return demoChats;
  } catch (error) {
    console.error('Error checking for demo chats:', error);
    return [];
  }
};

export default {
  cleanupAllDemoChats,
  checkForDemoChats
};