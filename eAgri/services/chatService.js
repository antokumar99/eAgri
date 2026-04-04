import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
  setDoc,
  getDoc,
  where,
  limit,
  startAfter,
  getDocs
} from 'firebase/firestore';
import { db } from './firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ChatService {
  constructor() {
    this.messagesCollection = 'messages';
    this.usersCollection = 'users';
    this.chatsCollection = 'chats';
    this.currentUser = null;
    this.unsubscribers = new Map();
  }

  // Initialize current user from AsyncStorage
  async initializeUser() {
    try {
      // First try to get user data from AsyncStorage
      const userData = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');
      
      if (userData) {
        this.currentUser = JSON.parse(userData);
        await this.updateUserPresence(true);
        return this.currentUser;
      } else if (token) {
        // If we have a token but no user data, user needs to re-login
        console.warn('Token found but no user data. User should re-login to use chat.');
        throw new Error('User data missing. Please login again to use chat features.');
      } else {
        // No authentication - this should only happen in development
        // Only create demo user in development
        if (__DEV__) {
          this.currentUser = {
            _id: 'demo-user-' + Date.now(),
            username: 'Demo User (Dev)',
            email: 'demo@example.com',
            avatar: null
          };
          await this.updateUserPresence(true);
          return this.currentUser;
        } else {
          throw new Error('Authentication required. Please login to use chat features.');
        }
      }
    } catch (error) {
      console.error('Error initializing user:', error);
      
      // In production, don't create demo users
      if (!__DEV__) {
        throw new Error('Chat initialization failed. Please login and try again.');
      }
      
      // Development fallback only
      console.warn('⚠️  Fallback to demo user - DEVELOPMENT ONLY');
      this.currentUser = {
        _id: 'demo-user-' + Date.now(),
        username: 'Demo User (Fallback)',
        email: 'demo@example.com',
        avatar: null
      };
      return this.currentUser;
    }
  }

  // Update user presence status
  async updateUserPresence(isOnline = true) {
    if (!this.currentUser) return;

    try {
      const userRef = doc(db, this.usersCollection, this.currentUser._id);
      await setDoc(userRef, {
        userId: this.currentUser._id,
        username: this.currentUser.username,
        email: this.currentUser.email,
        isOnline,
        lastSeen: serverTimestamp(),
        avatar: this.currentUser.avatar || null
      }, { merge: true });
    } catch (error) {
      console.error('Error updating user presence:', error);
    }
  }

  // Get or create a chat room between two users
  async getOrCreateChatRoom(participantId) {
    if (!this.currentUser) {
      throw new Error('User not initialized');
    }

    try {
      const participants = [this.currentUser._id, participantId].sort();
      const chatId = participants.join('_');
      
      const chatRef = doc(db, this.chatsCollection, chatId);
      const chatDoc = await getDoc(chatRef);
      
      if (!chatDoc.exists()) {
        // Create new chat room
        await setDoc(chatRef, {
          participants,
          participantIds: participants,
          createdAt: serverTimestamp(),
          lastMessage: null,
          lastMessageTime: serverTimestamp()
        });
      }
      
      return chatId;
    } catch (error) {
      console.error('Error getting/creating chat room:', error);
      throw error;
    }
  }

  // Send a message
  async sendMessage(chatId, text, messageType = 'text') {
    if (!this.currentUser || !text.trim()) {
      throw new Error('Invalid message data');
    }

    try {
      const now = new Date();
      const messageData = {
        chatId,
        senderId: this.currentUser._id,
        senderName: this.currentUser.username,
        senderAvatar: this.currentUser.avatar || null,
        text: text.trim(),
        messageType,
        timestamp: serverTimestamp(),
        isRead: false,
        sent: false,
        delivered: false
      };

      // Add message to messages collection
      const messageRef = await addDoc(collection(db, this.messagesCollection), messageData);

      // Update message status to sent
      await updateDoc(messageRef, { sent: true });

      // Update chat room with last message info
      const chatRef = doc(db, this.chatsCollection, chatId);
      await updateDoc(chatRef, {
        lastMessage: text.trim(),
        lastMessageTime: serverTimestamp(),
        lastSenderId: this.currentUser._id
      });

      return messageRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Listen to messages in a chat room
  subscribeToMessages(chatId, callback, limitCount = 50) {
    try {
      // Clean up existing subscription for this chat
      const existingUnsubscribe = this.unsubscribers.get(`messages_${chatId}`);
      if (existingUnsubscribe) {
        existingUnsubscribe();
        this.unsubscribers.delete(`messages_${chatId}`);
      }

      const messagesRef = collection(db, this.messagesCollection);
      // Query for recent messages - order by timestamp DESC to get latest first, then reverse
      const q = query(
        messagesRef,
        where('chatId', '==', chatId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messages = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          messages.push({
            id: doc.id,
            ...data,
            // Ensure timestamp is properly handled
            timestamp: data.timestamp || new Date()
          });
        });
        
        // Reverse to show oldest first (chat order)
        messages.reverse();
        
        callback(messages);
      }, (error) => {
        console.error('Error listening to messages:', error);
        // Fallback: try without ordering if index doesn't exist
        this.subscribeToMessagesWithClientSort(chatId, callback, limitCount);
      });

      // Store unsubscriber for cleanup
      this.unsubscribers.set(`messages_${chatId}`, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to messages:', error);
      return () => {};
    }
  }

  // Fallback method with client-side sorting
  subscribeToMessagesWithClientSort(chatId, callback, limitCount = 50) {
    try {
      // Clean up existing subscription for this chat
      const existingUnsubscribe = this.unsubscribers.get(`messages_${chatId}`);
      if (existingUnsubscribe) {
        existingUnsubscribe();
        this.unsubscribers.delete(`messages_${chatId}`);
      }

      const messagesRef = collection(db, this.messagesCollection);
      const q = query(
        messagesRef,
        where('chatId', '==', chatId)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messages = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          messages.push({
            id: doc.id,
            ...data,
            // Ensure timestamp is properly handled
            timestamp: data.timestamp || new Date()
          });
        });
        
        // Sort messages by timestamp on client side (ascending - oldest first)
        messages.sort((a, b) => {
          const aTime = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
          const bTime = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
          return aTime.getTime() - bTime.getTime();
        });
        
        // Get the most recent messages (slice from end)
        const limitedMessages = messages.slice(-limitCount);
        
        callback(limitedMessages);
      }, (error) => {
        console.error('Error listening to messages with fallback:', error);
        callback([]);
      });

      this.unsubscribers.set(`messages_${chatId}`, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to messages with fallback:', error);
      return () => {};
    }
  }

  // Get user's chat rooms
  async getUserChatRooms() {
    if (!this.currentUser) return [];

    try {
      const chatsRef = collection(db, this.chatsCollection);
      // Simplified query - just get chats with current user
      const q = query(
        chatsRef,
        where('participantIds', 'array-contains', this.currentUser._id)
      );

      const snapshot = await getDocs(q);
      const chatRooms = [];
      
      snapshot.forEach((doc) => {
        chatRooms.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Sort by lastMessageTime on client side
      chatRooms.sort((a, b) => {
        const aTime = a.lastMessageTime?.toDate ? a.lastMessageTime.toDate() : new Date(0);
        const bTime = b.lastMessageTime?.toDate ? b.lastMessageTime.toDate() : new Date(0);
        return bTime.getTime() - aTime.getTime();
      });

      return chatRooms;
    } catch (error) {
      console.error('Error getting chat rooms:', error);
      return [];
    }
  }

  // Subscribe to user's chat rooms for real-time updates
  subscribeToUserChatRooms(userId, callback) {
    try {
      // Clean up existing subscription
      const existingUnsubscribe = this.unsubscribers.get(`chatRooms_${userId}`);
      if (existingUnsubscribe) {
        existingUnsubscribe();
        this.unsubscribers.delete(`chatRooms_${userId}`);
      }

      const chatsRef = collection(db, this.chatsCollection);
      const q = query(
        chatsRef,
        where('participantIds', 'array-contains', userId)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        callback();
      }, (error) => {
        console.error('Error listening to chat rooms:', error);
      });

      // Store unsubscriber for cleanup
      this.unsubscribers.set(`chatRooms_${userId}`, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to chat rooms:', error);
      return () => {};
    }
  }

  // Helper function to check if user ID is a demo/test user
  isDemoOrTestUser(userId) {
    if (!userId || typeof userId !== 'string') return true;
    
    const demoPatterns = [
      'demo-user',
      'user1', 'user2', 'user3', 'user4', 'user5',
      'test-user',
      'mock-user',
      'fake-user'
    ];
    
    return demoPatterns.some(pattern => 
      userId.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  // Helper function to validate MongoDB ObjectId format
  isValidObjectId(id) {
    if (!id || typeof id !== 'string') return false;
    // MongoDB ObjectId is 24 hex characters
    return /^[0-9a-fA-F]{24}$/.test(id);
  }

  // Clean up demo/test chat rooms (call this manually if needed)
  async cleanupDemoChats() {
    if (!this.currentUser) return [];

    try {
      const chatsRef = collection(db, this.chatsCollection);
      const q = query(
        chatsRef,
        where('participantIds', 'array-contains', this.currentUser._id)
      );

      const snapshot = await getDocs(q);
      const demoChatIds = [];
      
      snapshot.forEach((doc) => {
        const chatData = doc.data();
        const hasDemoUser = chatData.participantIds?.some(id => 
          this.isDemoOrTestUser(id) || !this.isValidObjectId(id)
        );
        
        if (hasDemoUser) {
          demoChatIds.push(doc.id);
        }
      });

      return demoChatIds;
    } catch (error) {
      console.error('Error cleaning up demo chats:', error);
      return [];
    }
  }

  // Listen to user presence
  subscribeToUserPresence(userId, callback) {
    try {
      const userRef = doc(db, this.usersCollection, userId);
      
      const unsubscribe = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          const presenceData = {
            id: doc.id,
            isOnline: userData.isOnline === true,
            lastSeen: userData.lastSeen,
            ...userData
          };
          callback(presenceData);
        } else {
          callback({ isOnline: false });
        }
      }, (error) => {
        console.error('Error listening to user presence:', error);
        callback({ isOnline: false });
      });

      this.unsubscribers.set(`presence_${userId}`, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to user presence:', error);
      return () => {};
    }
  }

  // Mark messages as read
  async markMessagesAsRead(chatId) {
    if (!this.currentUser) return;

    try {
      const messagesRef = collection(db, this.messagesCollection);
      // Simplified query - just get messages for this chat
      const q = query(
        messagesRef,
        where('chatId', '==', chatId)
      );

      const snapshot = await getDocs(q);
      const batch = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Filter on client side to avoid complex query
        if (data.senderId !== this.currentUser._id && !data.isRead) {
          batch.push(updateDoc(doc.ref, { isRead: true }));
        }
      });

      if (batch.length > 0) {
        await Promise.all(batch);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // Load more messages (pagination)
  async loadMoreMessages(chatId, lastMessage, limitCount = 20) {
    try {
      const messagesRef = collection(db, this.messagesCollection);
      let q;

      if (lastMessage) {
        q = query(
          messagesRef,
          where('chatId', '==', chatId),
          orderBy('timestamp', 'desc'),
          startAfter(lastMessage.timestamp),
          limit(limitCount)
        );
      } else {
        q = query(
          messagesRef,
          where('chatId', '==', chatId),
          orderBy('timestamp', 'desc'),
          limit(limitCount)
        );
      }

      const snapshot = await getDocs(q);
      const messages = [];
      
      snapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return messages.reverse();
    } catch (error) {
      console.error('Error loading more messages:', error);
      return [];
    }
  }

  // Clean up specific subscription
  cleanupSubscription(key) {
    const unsubscribe = this.unsubscribers.get(key);
    if (unsubscribe && typeof unsubscribe === 'function') {
      unsubscribe();
      this.unsubscribers.delete(key);
    }
  }

  // Clean up all subscriptions
  cleanup() {
    this.unsubscribers.forEach((unsubscribe, key) => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    this.unsubscribers.clear();
    
    // Update user presence to offline
    if (this.currentUser) {
      this.updateUserPresence(false);
    }
  }

  // Get online users
  subscribeToOnlineUsers(callback) {
    try {
      const usersRef = collection(db, this.usersCollection);
      const q = query(
        usersRef,
        where('isOnline', '==', true)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const onlineUsers = [];
        snapshot.forEach((doc) => {
          const userData = { id: doc.id, ...doc.data() };
          // Don't include current user in online users list
          if (this.currentUser && userData.userId !== this.currentUser._id) {
            onlineUsers.push(userData);
          }
        });
        callback(onlineUsers);
      }, (error) => {
        console.error('Error listening to online users:', error);
        callback([]);
      });

      this.unsubscribers.set('online_users', unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to online users:', error);
      return () => {};
    }
  }

  // Logout and cleanup user session
  async logout() {
    // Set user presence to offline
    if (this.currentUser) {
      await this.updateUserPresence(false);
    }
    
    // Clean up all subscriptions
    this.cleanup();
    
    // Clear current user
    this.currentUser = null;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return this.currentUser !== null && 
           this.currentUser._id && 
           !this.currentUser._id.startsWith('demo-user-');
  }

  // Get current user info
  getCurrentUser() {
    return this.currentUser;
  }
}

// Export singleton instance
export default new ChatService();