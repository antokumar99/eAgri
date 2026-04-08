import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { chatColors } from '../utils/chatUtils';

const ChatItem = memo(({ 
  item, 
  onPress, 
  searchQuery, 
  searchMode,
  formattedTime,
  userInitials,
  messageIcon
}) => {
  // Highlight search query in text
  const highlightSearchQuery = (text, query) => {
    if (!query.trim() || !searchMode) {
      return <Text style={styles.userName} numberOfLines={1}>{text}</Text>;
    }

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <Text style={styles.userName} numberOfLines={1}>
        {parts.map((part, index) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <Text key={index} style={styles.highlightedText}>
              {part}
            </Text>
          ) : (
            <Text key={index}>{part}</Text>
          )
        )}
      </Text>
    );
  };

  return (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {item.userAvatar ? (
          <Image source={{ uri: item.userAvatar }} style={styles.avatar} />
        ) : (
          <LinearGradient
            colors={[chatColors.primary, chatColors.secondary]}
            style={styles.avatarFallback}
          >
            <Text style={styles.avatarText}>{userInitials}</Text>
          </LinearGradient>
        )}
        {item.isOnline && <View style={styles.onlineIndicator} />}
      </View>

      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          {highlightSearchQuery(item.userName, searchQuery)}
          <Text style={styles.timestamp}>{formattedTime}</Text>
        </View>

        <View style={styles.messageRow}>
          <View style={styles.lastMessageContainer}>
            {messageIcon}
            <Text
              style={[
                styles.lastMessage,
                { marginLeft: messageIcon ? 4 : 0 }
              ]}
              numberOfLines={1}
            >
              {item.lastMessage}
            </Text>
          </View>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

ChatItem.displayName = 'ChatItem';

const styles = StyleSheet.create({
  chatItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarFallback: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: chatColors.status.online,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: chatColors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  highlightedText: {
    backgroundColor: chatColors.primary,
    color: '#FFFFFF',
    fontWeight: '700',
    borderRadius: 3,
    paddingHorizontal: 2,
  },
  timestamp: {
    fontSize: 12,
    color: chatColors.text.secondary,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  lastMessage: {
    fontSize: 14,
    color: chatColors.text.secondary,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: chatColors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ChatItem;