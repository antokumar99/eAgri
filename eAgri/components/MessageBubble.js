import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { formatMessageTime, getUserInitials, chatColors } from '../utils/chatUtils';
import MessageReactions, { MessageReactionBar } from './MessageReactions';

const MessageBubble = ({ 
  message, 
  isCurrentUser, 
  showAvatar = true, 
  showTimestamp = true,
  onPress,
  onLongPress,
  onReactionPress
}) => {
  const messageTime = formatMessageTime(message.timestamp);
  const [showReactions, setShowReactions] = useState(false);
  const [reactionPosition, setReactionPosition] = useState({ x: 0, y: 0 });
  
  // Determine message status
  const getMessageStatus = () => {
    if (message.isRead) return 'read';
    if (message.delivered) return 'delivered';
    if (message.sent) return 'sent';
    return 'sending';
  };

  // Handle long press to show reactions
  const handleLongPress = (event) => {
    const { pageX, pageY } = event.nativeEvent;
    setReactionPosition({ x: pageX - 100, y: pageY - 60 });
    setShowReactions(true);
    if (onLongPress) {
      onLongPress();
    }
  };

  // Handle reaction press
  const handleReactionPress = (messageId, emoji) => {
    if (onReactionPress) {
      onReactionPress(messageId, emoji);
    }
  };

  const renderMessageBubbleContent = () => (
    <>
      {/* Sender name for received messages - only show when showing avatar */}
      {!isCurrentUser && showAvatar && (
        <Text style={styles.senderName}>{message.senderName}</Text>
      )}
      
      {/* Message text */}
      <Text style={[
        styles.messageText,
        isCurrentUser ? styles.sentText : styles.receivedText
      ]}>
        {message.text}
      </Text>
      
      {/* Timestamp and status row */}
      <View style={styles.timestampRow}>
        {showTimestamp && (
          <Text style={[
            styles.timestamp,
            isCurrentUser ? styles.sentTimestamp : styles.receivedTimestamp
          ]}>
            {messageTime}
          </Text>
        )}
        
        {/* Message status for sent messages */}
        {isCurrentUser && (
          <View style={styles.statusContainer}>
            {getMessageStatus() === 'sending' && (
              <MaterialIcons name="schedule" size={12} color={chatColors.message.sentText} style={styles.statusIcon} />
            )}
            {getMessageStatus() === 'sent' && (
              <MaterialIcons name="check" size={12} color={chatColors.message.sentText} style={styles.statusIcon} />
            )}
            {getMessageStatus() === 'delivered' && (
              <MaterialIcons name="done-all" size={12} color={chatColors.message.sentText} style={styles.statusIcon} />
            )}
            {getMessageStatus() === 'read' && (
              <MaterialIcons name="done-all" size={12} color={chatColors.status.online} style={styles.statusIcon} />
            )}
          </View>
        )}
      </View>
      
      {/* Message Reactions */}
      <MessageReactionBar 
        reactions={message.reactions}
        onReactionPress={handleReactionPress}
        messageId={message.id}
      />
    </>
  );
  
  return (
    <Animated.View style={styles.container}>
      <View style={[
        styles.messageRow,
        isCurrentUser ? styles.sentRow : styles.receivedRow
      ]}>
        {/* Avatar for received messages - only show when needed */}
        {!isCurrentUser && (
          <View style={[
            styles.avatarContainer,
            !showAvatar && styles.invisibleAvatar
          ]}>
            {showAvatar && (
              message.senderAvatar ? (
                <Image 
                  source={{ uri: message.senderAvatar }} 
                  style={styles.avatar}
                />
              ) : (
                <LinearGradient
                  colors={[chatColors.primary, chatColors.secondary]}
                  style={styles.avatarFallback}
                >
                  <Text style={styles.avatarText}>
                    {getUserInitials(message.senderName)}
                  </Text>
                </LinearGradient>
              )
            )}
          </View>
        )}
        
        {/* Message bubble */}
        <TouchableOpacity 
          onPress={onPress}
          onLongPress={handleLongPress}
          activeOpacity={0.7}
          style={[
            styles.bubbleWrapper,
            isCurrentUser ? styles.sentBubbleWrapper : styles.receivedBubbleWrapper
          ]}
        >
          {isCurrentUser ? (
            <LinearGradient
              colors={[chatColors.primary, chatColors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.bubble, styles.sentBubble]}
            >
              {renderMessageBubbleContent()}
            </LinearGradient>
          ) : (
            <View style={[styles.bubble, styles.receivedBubble]}>
              {renderMessageBubbleContent()}
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Message Reactions Modal */}
      <MessageReactions
        message={message}
        visible={showReactions}
        onClose={() => setShowReactions(false)}
        onReactionPress={handleReactionPress}
        position={reactionPosition}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 3,
    paddingHorizontal: 16,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
  },
  sentRow: {
    justifyContent: 'flex-end',
  },
  receivedRow: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    marginRight: 8,
    marginBottom: 4,
    justifyContent: 'flex-end',
  },
  invisibleAvatar: {
    opacity: 0,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: chatColors.primary,
  },
  avatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: chatColors.shadow.color,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: chatColors.shadow.opacity,
    shadowRadius: chatColors.shadow.radius,
    elevation: chatColors.shadow.elevation,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  bubbleWrapper: {
    maxWidth: '75%',
    minWidth: 60,
  },
  sentBubbleWrapper: {
    alignItems: 'flex-end',
  },
  receivedBubbleWrapper: {
    alignItems: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    minWidth: 60,
  },
  sentBubble: {
    borderBottomRightRadius: 4,
    shadowColor: chatColors.shadow.color,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: chatColors.shadow.opacity,
    shadowRadius: chatColors.shadow.radius,
    elevation: chatColors.shadow.elevation,
  },
  receivedBubble: {
    backgroundColor: chatColors.message.received,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '700',
    color: chatColors.primary,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '400',
  },
  sentText: {
    color: chatColors.message.sentText,
    fontWeight: '500',
  },
  receivedText: {
    color: chatColors.message.receivedText,
  },
  timestampRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 11,
    fontWeight: '400',
  },
  sentTimestamp: {
    color: chatColors.message.sentText,
    opacity: 0.8,
  },
  receivedTimestamp: {
    color: chatColors.text.hint,
  },
  statusContainer: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIcon: {
    opacity: 0.8,
  },
});

export default MessageBubble;