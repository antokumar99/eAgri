import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Keyboard
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import api from '../services/api';
import Header from '../components/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CommentScreen = ({ route, navigation }) => {
  const { postId, postOwnerId } = route.params;
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
  const [userData, setUserData] = useState(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    fetchUserData();
    fetchComments();
  }, [postId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchComments();
    });

    return unsubscribe;
  }, [navigation]);

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

  const fetchComments = async () => {
    try {
      const response = await api.get(`/posts/${postId}/comments`);
      if (response.data.success) {
        const organizedComments = organizeComments(response.data.data);
        setComments(organizedComments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      Alert.alert('Error', 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;

    try {
      const response = await api.post(`/posts/${postId}/comments`, {
        text: comment,
        parentId: replyTo?._id
      });

      if (response.data.success) {
        setComment('');
        setReplyTo(null);
        fetchComments();
        // Refresh the posts list to update comment count
        if (route.params?.onCommentUpdate) {
          route.params.onCommentUpdate();
        }
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      Alert.alert('Error', 'Failed to post comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.delete(`/posts/${postId}/comments/${commentId}`);
              if (response.data.success) {
                fetchComments();
                // Update the parent post's comment count
                if (route.params?.onCommentUpdate) {
                  route.params.onCommentUpdate();
                }
              }
            } catch (error) {
              console.error('Error deleting comment:', error);
              Alert.alert('Error', 'Failed to delete comment');
            }
          }
        }
      ]
    );
  };

  const organizeComments = (comments) => {
    const parentComments = comments.filter(comment => !comment.parentId);
    const replies = comments.filter(comment => comment.parentId);
    
    return parentComments.map(parent => ({
      ...parent,
      replies: replies.filter(reply => 
        reply.parentId && reply.parentId._id === parent._id
      ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    }));
  };

  const renderReply = (reply, parentId) => {
    const isCommentOwner = reply.userId._id === userData?.data?._id;
    const isPostOwner = postOwnerId === userData?.data?._id;
    const canDelete = isCommentOwner || isPostOwner;

    return (
      <View key={reply._id} style={styles.replyContainer}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentUser}>{reply.userId.name}</Text>
          <Text style={styles.commentTime}>
            {new Date(reply.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
              hour12: true
            })}
          </Text>
        </View>
        
        <Text style={styles.commentText}>{reply.text}</Text>
        
        <View style={styles.commentActions}>
          {canDelete && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleDeleteComment(reply._id)}
            >
              <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderComment = ({ item }) => {
    const isCommentOwner = item.userId._id === userData?.data?._id;
    const isPostOwner = postOwnerId === userData?.data?._id;
    const canDelete = isCommentOwner || isPostOwner;

    return (
      <View style={styles.commentContainer}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentUser}>{item.userId.name}</Text>
          <Text style={styles.commentTime}>
            {new Date(item.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
              hour12: true
            })}
          </Text>
        </View>
        
        <Text style={styles.commentText}>{item.text}</Text>
        
        <View style={styles.commentActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setReplyTo(item)}
          >
            <Text style={styles.actionText}>Reply</Text>
          </TouchableOpacity>
          
          {canDelete && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleDeleteComment(item._id)}
            >
              <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Render replies */}
        {item.replies && item.replies.map(reply => renderReply(reply, item._id))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#28a745" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Comments" />
      
      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.commentsList}
      />

      <View style={[styles.bottomContainer, { marginBottom: keyboardHeight > 0 ? keyboardHeight - 20 : 0 }]}>
        {replyTo && (
          <View style={styles.replyingTo}>
            <Text>Replying to {replyTo.userId.name}</Text>
            <TouchableOpacity onPress={() => setReplyTo(null)}>
              <FontAwesome name="times" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={replyTo ? "Write a reply..." : "Write a comment..."}
            value={comment}
            onChangeText={setComment}
            multiline
            textAlignVertical="top"
          />
          <TouchableOpacity 
            style={styles.sendButton} 
            onPress={handleComment}
          >
            <FontAwesome name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentsList: {
    padding: 16,
  },
  commentContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  replyContainer: {
    marginLeft: 32,
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderLeftWidth: 2,
    borderLeftColor: '#28a745',
    borderRadius: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentUser: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  commentTime: {
    fontSize: 12,
    color: '#666',
  },
  commentText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    marginRight: 16,
    padding: 4,
  },
  actionText: {
    fontSize: 14,
    color: '#28a745',
  },
  deleteText: {
    color: '#dc3545',
  },
  bottomContainer: {
    backgroundColor: '#fff',
  },
  replyingTo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#e9ecef',
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  inputContainer: {
    marginBottom: 35,
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
    paddingBottom: 40,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#28a745',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CommentScreen; 