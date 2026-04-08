// frontend/screens/PostDetailsScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  TextInput,
  FlatList,
  Alert,
  SafeAreaView,
} from "react-native";
//import API from '../services/api';
import CommentCard from "../components/CommentCard";

export default function PostDetailsScreen({ route }) {
  const { postId } = route.params;
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");

  //   const fetchPostDetails = async () => {
  //     try {
  //       const res = await API.get(`/posts/${postId}`);
  //       setPost(res.data);
  //     } catch (err) {
  //       console.error(err);
  //     }
  //   };

  //   const fetchComments = async () => {
  //     try {
  //       const res = await API.get(`/comments/${postId}`);
  //       setComments(res.data);
  //     } catch (err) {
  //       console.error(err);
  //     }
  //   };

  //   useEffect(() => {
  //     fetchPostDetails();
  //     fetchComments();
  //   }, []);

  //   const handleLike = async () => {
  //     try {
  //       await API.post(`/posts/${postId}/like`);
  //       fetchPostDetails(); // update post data
  //     } catch (err) {
  //       console.error(err);
  //     }
  //   };

  //   const handleAddComment = async () => {
  //     try {
  //       if (!commentText.trim()) return;
  //       await API.post('/comments', { postId, text: commentText });
  //       setCommentText('');
  //       fetchComments();
  //     } catch (err) {
  //       console.error(err);
  //       Alert.alert('Error', 'Could not add comment.');
  //     }
  //   };

  if (!post) {
    return (
      <SafeAreaView style={{ flex: 1, padding: 16 }}>
        <Text>Loading post details...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, marginBottom: 8 }}>{post.title}</Text>
      <Text style={{ marginBottom: 8 }}>{post.content}</Text>
      <Text>Category: {post.category}</Text>
      <Text>Visibility: {post.visibility}</Text>
      <Text>Likes: {post.likes ? post.likes.length : 0}</Text>

      <Button title="Like / Unlike" onPress={handleLike} />

      <View style={{ marginVertical: 16 }}>
        <Text style={{ fontSize: 16, marginBottom: 8 }}>Comments</Text>
        <FlatList
          data={comments}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <CommentCard comment={item} />}
        />
      </View>

      <View style={{ flexDirection: "row", marginTop: 8 }}>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            flex: 1,
            marginRight: 8,
            padding: 8,
          }}
          placeholder="Add a comment"
          value={commentText}
          onChangeText={setCommentText}
        />
        <Button title="Send" onPress={handleAddComment} />
      </View>
    </SafeAreaView>
  );
}
