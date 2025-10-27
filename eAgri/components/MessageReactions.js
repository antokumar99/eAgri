import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { chatColors } from '../utils/chatUtils';

const MessageReactions = ({ message, onReactionPress, visible, onClose, position }) => {
  const [selectedReaction, setSelectedReaction] = useState(null);
  
  const commonReactions = ['👍', '❤️', '😂', '😮', '😢', '😡', '👏', '🔥'];
  
  const handleReactionPress = (emoji) => {
    setSelectedReaction(emoji);
    onReactionPress(message.id, emoji);
    onClose();
  };

  const existingReactions = message.reactions || {};
  
  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="fade"
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={[styles.container, position && { top: position.y, left: position.x }]}>
          <LinearGradient
            colors={[chatColors.background, chatColors.surface]}
            style={styles.reactionsContainer}
          >
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {commonReactions.map((emoji, index) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.reactionButton,
                    selectedReaction === emoji && styles.selectedReaction
                  ]}
                  onPress={() => handleReactionPress(emoji)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emoji}>{emoji}</Text>
                  {existingReactions[emoji] && (
                    <View style={styles.reactionCount}>
                      <Text style={styles.countText}>
                        {existingReactions[emoji].count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// Component to display existing reactions on messages
export const MessageReactionBar = ({ reactions, onReactionPress, messageId }) => {
  if (!reactions || Object.keys(reactions).length === 0) return null;

  return (
    <View style={styles.reactionBar}>
      {Object.entries(reactions).map(([emoji, data]) => (
        <TouchableOpacity
          key={emoji}
          style={[
            styles.reactionChip,
            data.userReacted && styles.userReactedChip
          ]}
          onPress={() => onReactionPress(messageId, emoji)}
          activeOpacity={0.7}
        >
          <Text style={styles.chipEmoji}>{emoji}</Text>
          <Text style={[
            styles.chipCount,
            data.userReacted && styles.userReactedText
          ]}>
            {data.count}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    position: 'absolute',
    zIndex: 1000,
  },
  reactionsContainer: {
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: chatColors.shadow.color,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: chatColors.primary,
  },
  scrollContent: {
    alignItems: 'center',
  },
  reactionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    position: 'relative',
  },
  selectedReaction: {
    backgroundColor: chatColors.primary,
  },
  emoji: {
    fontSize: 24,
  },
  reactionCount: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: chatColors.accent,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Reaction bar styles
  reactionBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    marginHorizontal: 4,
  },
  reactionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: chatColors.surface,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: chatColors.text.hint,
  },
  userReactedChip: {
    backgroundColor: chatColors.primary,
    borderColor: chatColors.accent,
  },
  chipEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  chipCount: {
    fontSize: 12,
    color: chatColors.text.secondary,
    fontWeight: '600',
  },
  userReactedText: {
    color: '#FFFFFF',
  },
});

export default MessageReactions;