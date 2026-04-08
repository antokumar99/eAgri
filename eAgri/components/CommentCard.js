// frontend/components/CommentCard.js
import React from 'react';
import { View, Text } from 'react-native';

const CommentCard = ({ comment }) => {
  return (
    <View
      style={{
        backgroundColor: '#ebebeb',
        marginVertical: 4,
        padding: 8,
        borderRadius: 4,
      }}
    >
      <Text>{comment.text}</Text>
      <Text style={{ fontSize: 12, fontStyle: 'italic' }}>
        by {comment.createdBy?.name || 'Unknown'}
      </Text>
    </View>
  );
};

export default CommentCard;
