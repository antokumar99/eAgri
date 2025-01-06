import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  FlatList,
  Button,
  StyleSheet,
  TouchableOpacity,
  Platform
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import PostCard from "../components/PostCard"; // Import the PostCard component

const CommunityFeed = ({ navigation }) => {
  const [search, setSearch] = useState("");
  const [posts, setPosts] = useState([
    {
      _id: "1",
      profileImage: "https://via.placeholder.com/40",
      username: "Jacob Jones",
      time: "1 hour",
      content:
        "How to deal with pests and diseases on certain plants and how to carry out routine maintenance on tractors or other agricultural equipment?",
      image: "https://via.placeholder.com/400x200",
      likes: 480,
      comments: 128,
      shares: 64,
    },
    {
      _id: "2",
      profileImage: "https://via.placeholder.com/40",
      username: "Emily Brown",
      time: "3 hours",
      content: "Anyone here knows how to improve soil fertility naturally?",
      image: null,
      likes: 320,
      comments: 45,
      shares: 21,
    },
    {
      _id: "3",
      profileImage: "https://via.placeholder.com/40",
      username: "Michael Johnson",
      time: "5 hours",
      content:
        "What are the best practices for planting and growing crops in a greenhouse?",
      image: "https://via.placeholder.com/400x200",
      likes: 640,
      comments: 96,
      shares: 32,
    },
    {
      _id: "4",
      profileImage: "https://via.placeholder.com/40",
      username: "Emma White",
      time: "7 hours",
      content:
        "I'm looking for advice on how to start a small vegetable garden in my backyard.",
      image: null,
      likes: 410,
      comments: 78,
      shares: 42,
    },
    {
      _id: "5",
      profileImage: "https://via.placeholder.com/40",
      username: "James Lee",
      time: "9 hours",
      content:
        "What are the best ways to protect crops from pests and diseases without using harmful chemicals?",
      image: "https://via.placeholder.com/400x200",
      likes: 530,
      comments: 112,
      shares: 56,
    },
  ]);

  const handleSearch = () => {
    // Filter posts based on search input
    const filteredPosts = posts.filter((post) =>
      post.content.toLowerCase().includes(search.toLowerCase())
    );
    setPosts(filteredPosts);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Community Feed</Text>
        <TouchableOpacity
          style={styles.newPostButton}
          onPress={() => navigation.navigate("CreatePost")}
        >
          <FontAwesome name="plus-circle" size={24} color="#fff" />
          <Text style={styles.newPostText}>New Post</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search posts..."
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <FontAwesome name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Post List */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={styles.postList}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No posts found. Try searching again.</Text>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    // padding: Platform.OS === "ios" ? 16 : 0,
    padding: 16,
    paddingTop: Platform.OS === "android" ? 40 : 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  newPostButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#28a745",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  newPostText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "bold",
  },
  searchContainer: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  searchInput: {
    flex: 1,
    padding: 10,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: "#007bff",
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  postList: {
    paddingBottom: 20,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#777",
  },
});

export default CommunityFeed;
