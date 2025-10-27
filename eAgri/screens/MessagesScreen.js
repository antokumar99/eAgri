import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
  TextInput,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import chatService from '../services/chatService';
import { chatColors } from '../utils/chatUtils';
import ChatItem from '../components/ChatItem';

const MessagesScreen = () => {
  const navigation = useNavigation();
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Helper function to check if user ID is a demo/test user
  const isDemoOrTestUser = (userId) => {
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
  };

  // Helper function to validate MongoDB ObjectId format
  const isValidObjectId = (id) => {
    if (!id || typeof id !== 'string') return false;
    // MongoDB ObjectId is 24 hex characters
    return /^[0-9a-fA-F]{24}$/.test(id);
  };

  // Search functionality
  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredChats([]);
      return;
    }

    const filtered = chats.filter(chat => 
      chat.userName.toLowerCase().includes(query.toLowerCase().trim())
    );
    
    setFilteredChats(filtered);
  };

  const toggleSearchMode = () => {
    if (searchMode) {
      // Exiting search mode - clear search
      setSearchQuery('');
      setFilteredChats([]);
    }
    setSearchMode(!searchMode);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setFilteredChats([]);
  };

  // Memoized keyExtractor for better FlatList performance
  const keyExtractor = useCallback((item) => item.id, []);

  // Static item layout for better FlatList performance (if all items have same height)
  const getItemLayout = useCallback((data, index) => ({
    length: 82, // Height of each chat item (16 + 50 + 16 = 82px)
    offset: 82 * index,
    index,
  }), []);

  useEffect(() => {
    fetchUserData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadChats();
      
      // Set up real-time listener for chat updates
      const setupChatListener = async () => {
        try {
          const currentUser = await chatService.initializeUser();
          if (currentUser) {
            // Listen for changes to chat rooms (new messages, etc.)
            const unsubscribe = chatService.subscribeToUserChatRooms(currentUser._id, () => {
              // Reload chats when changes occur
              loadChats();
            });
            
            return unsubscribe;
          }
        } catch (error) {
          // Could not set up chat listener (non-critical)
        }
      };

      let unsubscribe;
      setupChatListener().then(unsub => {
        unsubscribe = unsub;
      });

      // Cleanup when screen loses focus
      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }, [])
  );

  const fetchUserData = async () => {
    try {
      const response = await api.get('/profile');
      if (response.data) {
        setUserData(response.data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (error.response?.status === 401) {
        navigation.replace('Login');
      }
    }
  };

  const loadChats = async () => {
    try {
      setLoading(true);
      
      // Initialize chat service
      const currentUser = await chatService.initializeUser();
      if (!currentUser) {
        navigation.replace('Login');
        return;
      }

      // Get user's chat rooms
      const chatRooms = await chatService.getUserChatRooms();

      // Clean up any demo/test chats (run in background)
      chatService.cleanupDemoChats().catch(() => {
        // Cleanup failed (non-critical)
      });

      if (chatRooms.length === 0) {
        setChats([]);
        return;
      }

      // Process chat rooms to get participant info
      const processedChats = await Promise.all(
        chatRooms.map(async (chatRoom) => {
          try {
            // Find the other participant (not current user)
            const otherParticipantId = chatRoom.participantIds?.find(
              id => id !== currentUser._id
            );

            if (!otherParticipantId) {
              console.warn('No other participant found for chat:', chatRoom.id);
              return null;
            }

            // Filter out demo/test users and invalid IDs
            if (isDemoOrTestUser(otherParticipantId)) {
              return null;
            }

            // Validate MongoDB ObjectId format (24 hex characters)
            if (!isValidObjectId(otherParticipantId)) {
              return null;
            }

            // Try to get user info from your backend API
            let participantInfo = {
              _id: otherParticipantId,
              name: 'User', // Default name
              avatar: null
            };

            try {
              // Try to fetch user profile from your backend
              const userResponse = await api.get(`/users/${otherParticipantId}`);
              if (userResponse.data?.success) {
                const userData = userResponse.data.data;
                participantInfo = {
                  _id: userData._id,
                  name: userData.name || userData.username || 'User',
                  avatar: userData.avatar || null
                };
              }
            } catch (apiError) {
              // If we can't fetch the user, skip this chat (likely invalid user)
              return null;
            }

            // Format last message time
            let lastMessageTime = new Date();
            if (chatRoom.lastMessageTime?.toDate) {
              lastMessageTime = chatRoom.lastMessageTime.toDate();
            } else if (chatRoom.lastMessageTime) {
              lastMessageTime = new Date(chatRoom.lastMessageTime);
            }

            // Determine message type and display text
            let displayMessage = chatRoom.lastMessage || 'No messages yet';
            let messageType = 'text';
            
            if (!chatRoom.lastMessage) {
              displayMessage = 'No messages yet';
            } else if (chatRoom.lastMessage.toLowerCase().includes('photo') || chatRoom.lastMessage.toLowerCase().includes('image')) {
              displayMessage = 'Photo';
              messageType = 'photo';
            } else if (chatRoom.lastMessage.toLowerCase().includes('voice') || chatRoom.lastMessage.toLowerCase().includes('audio')) {
              displayMessage = 'Voice message';
              messageType = 'voice';
            } else if (chatRoom.lastMessage.toLowerCase().includes('video')) {
              displayMessage = 'Video';
              messageType = 'video';
            } else {
              // Regular text message - truncate if too long
              displayMessage = chatRoom.lastMessage.length > 50 
                ? chatRoom.lastMessage.substring(0, 50) + '...'
                : chatRoom.lastMessage;
            }

            return {
              id: chatRoom.id,
              userId: otherParticipantId,
              userName: participantInfo.name,
              userAvatar: participantInfo.avatar,
              lastMessage: displayMessage,
              lastMessageTime: lastMessageTime,
              unreadCount: 0, // TODO: Implement unread count logic
              isOnline: false, // TODO: Get real online status from chatService
              messageType: messageType,
              lastSeen: null,
            };
          } catch (error) {
            console.error('Error processing chat room:', chatRoom.id, error);
            return null;
          }
        })
      );

      // Filter out null results and set chats
      const validChats = processedChats.filter(chat => chat !== null);
      setChats(validChats);

    } catch (error) {
      console.error('Error loading chats:', error);
      if (error.message?.includes('Authentication required')) {
        Alert.alert(
          'Authentication Required',
          'Please login to view your messages',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Login', onPress: () => navigation.replace('Login') }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to load conversations');
      }
    } finally {
      setLoading(false);
    }
  };

  // Memoized formatTime function
  const formatTime = useCallback((timestamp) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInHours = (now - messageTime) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return messageTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return messageTime.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  }, []);

  // Memoized getInitials function
  const getInitials = useCallback((name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }, []);

  // Memoized getMessageIcon function
  const getMessageIcon = useCallback((messageType) => {
    switch (messageType) {
      case 'photo':
        return <Ionicons name="camera" size={14} color={chatColors.text.secondary} />;
      case 'voice':
        return <Ionicons name="mic" size={14} color={chatColors.text.secondary} />;
      case 'video':
        return <Ionicons name="videocam" size={14} color={chatColors.text.secondary} />;
      default:
        return null;
    }
  }, []);

  const handleChatPress = useCallback((chat) => {
    navigation.navigate('ChatScreen', {
      userId: chat.userId,
      userName: chat.userName,
      userAvatar: chat.userAvatar,
    });
  }, [navigation]);

  // Memoized render function for chat items
  const renderChatItem = useCallback(({ item }) => {
    const formattedTime = formatTime(item.lastMessageTime);
    const userInitials = getInitials(item.userName);
    const messageIcon = getMessageIcon(item.messageType);

    return (
      <ChatItem
        item={item}
        onPress={() => handleChatPress(item)}
        searchQuery={searchQuery}
        searchMode={searchMode}
        formattedTime={formattedTime}
        userInitials={userInitials}
        messageIcon={messageIcon}
      />
    );
  }, [formatTime, getInitials, getMessageIcon, handleChatPress, searchQuery, searchMode]);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={80} color={chatColors.text.secondary} />
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptySubtitle}>
        Start a conversation by visiting someone's profile and tapping the message button, or begin chatting from posts and products.
      </Text>
    </View>
  );

  const renderSearchEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={80} color={chatColors.text.secondary} />
      <Text style={styles.emptyTitle}>No results found</Text>
      <Text style={styles.emptySubtitle}>
        No conversations match "{searchQuery}". Try searching with a different name.
      </Text>
    </View>
  );

  // Render search results counter
  const renderSearchResults = () => {
    if (!searchMode || !searchQuery.trim()) return null;
    
    return (
      <View style={styles.searchResultsHeader}>
        <Text style={styles.searchResultsText}>
          {filteredChats.length} {filteredChats.length === 1 ? 'result' : 'results'} for "{searchQuery}"
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={[chatColors.primary, chatColors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Messages</Text>
            <TouchableOpacity style={styles.headerButton}>
              <MaterialIcons name="search" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={chatColors.primary} />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[chatColors.primary, chatColors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          {!searchMode ? (
            <>
              <Text style={styles.headerTitle}>Messages</Text>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={toggleSearchMode}
              >
                <MaterialIcons name="search" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.searchContainer}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={toggleSearchMode}
              >
                <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TextInput
                style={styles.searchInput}
                placeholder="Search conversations..."
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                value={searchQuery}
                onChangeText={handleSearch}
                autoFocus={true}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity 
                  style={styles.clearButton}
                  onPress={clearSearch}
                >
                  <MaterialIcons name="clear" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </LinearGradient>

      {renderSearchResults()}

      <FlatList
        data={searchMode && searchQuery.trim() ? filteredChats : chats}
        renderItem={renderChatItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        style={styles.chatsList}
        contentContainerStyle={(searchMode && searchQuery.trim() ? filteredChats : chats).length === 0 ? styles.emptyContentContainer : null}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={searchMode && searchQuery.trim() ? renderSearchEmptyState : renderEmptyState}
        refreshing={loading}
        onRefresh={searchMode ? undefined : loadChats}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: chatColors.background,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
  },
  clearButton: {
    padding: 8,
    marginLeft: 8,
  },
  searchResultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  searchResultsText: {
    fontSize: 14,
    color: chatColors.text.secondary,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: chatColors.text.secondary,
  },
  chatsList: {
    flex: 1,
  },
  emptyContentContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: chatColors.text.primary,
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: chatColors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },

});

export default MessagesScreen;