import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import MessageBubble from '../components/MessageBubble';
import chatService from '../services/chatService';
import { chatColors, shouldGroupMessages, validateMessage } from '../utils/chatUtils';

const ChatScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, userName } = route.params || {};

  // State management
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [userPresence, setUserPresence] = useState(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // Refs
  const flatListRef = useRef(null);

  // Keyboard handling
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Initialize chat when component mounts
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Initialize current user
        const user = await chatService.initializeUser();
        if (!user) {
          throw new Error('Failed to initialize user');
        }
        
        // Validate that we have a target user ID
        if (!userId) {
          throw new Error('No target user ID provided. Cannot start chat without knowing who to chat with.');
        }
        
        // Get or create chat room
        const roomId = await chatService.getOrCreateChatRoom(userId);
        setChatId(roomId);
        
      } catch (error) {
        console.error('Error initializing chat:', error);
        Alert.alert('Error', `Failed to initialize chat: ${error.message}`);
        setIsLoading(false);
      }
    };

    initializeChat();

    // Cleanup on unmount
    return () => {
      chatService.cleanup();
    };
  }, [userId]);

  // Handle screen focus - reestablish subscriptions when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const setupSubscriptions = async () => {
        if (!chatId) {
          return;
        }

        try {
          setIsLoading(true);
          
          // Subscribe to messages
          chatService.subscribeToMessages(chatId, (newMessages) => {
            setMessages(newMessages);
            setIsLoading(false);
          });
          
          // Subscribe to user presence if userId is provided
          if (userId) {
            chatService.subscribeToUserPresence(userId, (presence) => {
              // Only update if we have valid presence data to avoid flashing
              if (presence) {
                setUserPresence(presence);
              }
            });
          }
          
          // Mark messages as read
          await chatService.markMessagesAsRead(chatId);
          
        } catch (error) {
          console.error('Error setting up subscriptions:', error);
          setIsLoading(false);
        }
      };

      setupSubscriptions();

      // Cleanup when screen loses focus
      return () => {
        chatService.cleanup();
      };
    }, [chatId, userId])
  );

  // Send message function
  const sendMessage = async () => {
    const validation = validateMessage(newMessage);
    if (!validation.isValid) {
      Alert.alert('Invalid Message', validation.error);
      return;
    }

    if (!chatId) {
      Alert.alert('Error', 'Chat not initialized. Please try again.');
      return;
    }

    try {
      setIsSending(true);
      await chatService.sendMessage(chatId, validation.message);
      setNewMessage('');
      
      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Handle text change
  const handleTextChange = (text) => {
    setNewMessage(text);
  };

  // Handle reaction press
  const handleReactionPress = (messageId, emoji) => {
    // Implement reaction functionality
    // This would typically update the message reactions in Firebase
    // You would call chatService.addReaction(messageId, emoji) here
  };

  // Memoized render message item
  const renderMessage = useCallback(({ item, index }) => {
    const isCurrentUser = item.senderId === chatService.currentUser?._id;
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const showAvatar = !shouldGroupMessages(item, previousMessage);
    
    return (
      <MessageBubble
        message={item}
        isCurrentUser={isCurrentUser}
        showAvatar={showAvatar}
        showTimestamp={true}
        onPress={() => {
          // Handle message press (could show details)
        }}
        onLongPress={() => {
          // Handle long press (could show options)
        }}
        onReactionPress={handleReactionPress}
      />
    );
  }, [messages, handleReactionPress]);

  // Get status text
  const getStatusText = () => {
    if (!userPresence) return 'Connecting...';
    if (userPresence.isOnline) {
      return 'Online';
    } else if (userPresence.lastSeen) {
      return `Last seen recently`;
    }
    return 'Offline';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={[chatColors.primary, chatColors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Loading...</Text>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={chatColors.accent} />
          <Text style={styles.loadingText}>Loading chat...</Text>
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{userName || 'User'}</Text>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
          
          <View style={styles.headerActions}>
            <View style={styles.statusContainer}>
              <View style={[
                styles.onlineIndicator,
                { backgroundColor: userPresence?.isOnline ? chatColors.status.online : chatColors.status.offline }
              ]} />
              {userPresence?.isOnline && (
                <View style={styles.onlineIndicatorGlow} />
              )}
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
        inverted={false}
        ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={20}
        windowSize={10}
      />
      
      {/* Message Input */}
      <View style={[styles.inputContainer, { marginBottom: keyboardHeight > 0 ? keyboardHeight - 0 : 0 }]}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={chatColors.text.hint}
            value={newMessage}
            onChangeText={handleTextChange}
            multiline
            maxLength={1000}
            editable={!isSending}
          />
          
          <TouchableOpacity
            onPress={sendMessage}
            disabled={newMessage.trim().length === 0 || isSending}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={newMessage.trim().length > 0 && !isSending ? 
                [chatColors.primary, chatColors.secondary] : 
                [chatColors.text.hint, chatColors.text.hint]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.sendButton,
                { opacity: newMessage.trim().length > 0 && !isSending ? 1 : 0.5 }
              ]}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={22} color="#FFFFFF" />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ChatScreen;

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
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statusText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  headerActions: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 2,
  },
  onlineIndicatorGlow: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: chatColors.status.online,
    opacity: 0.3,
    zIndex: 1,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: chatColors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: chatColors.text.secondary,
  },
  messagesList: {
    flex: 1,
    backgroundColor: chatColors.background,
    paddingTop: 8,
  },
  messagesContent: {
    paddingVertical: 12,
    paddingBottom: 20,
    flexGrow: 1,
  },
  inputContainer: {
    backgroundColor: chatColors.surface,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 15 : 30,
    borderTopWidth: 1,
    borderTopColor: chatColors.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginBottom: 35,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: chatColors.background,
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: chatColors.primary,
    shadowColor: chatColors.shadow.color,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: chatColors.shadow.opacity,
    shadowRadius: chatColors.shadow.radius,
    elevation: chatColors.shadow.elevation,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: chatColors.text.primary,
    maxHeight: 100,
    paddingVertical: 10,
    paddingRight: 12,
    fontWeight: '400',
  },
  sendButton: {
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: chatColors.shadow.color,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: chatColors.shadow.opacity,
    shadowRadius: chatColors.shadow.radius,
    elevation: chatColors.shadow.elevation,
  },
});