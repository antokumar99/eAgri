import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Image,
  RefreshControl
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import api from "../services/api";
import Header from "../components/Header";

const CommunityFeed = ({ navigation }) => {
  const [search, setSearch] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [originalPosts, setOriginalPosts] = useState([]); // For search functionality
  const [refreshing, setRefreshing] = useState(false);
  const [likedPosts, setLikedPosts] = useState(new Set());

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await api.get("/posts");
      //console.log('Full posts response:', response.data);  // to show the post data
      
      if (response.data.success) {
        const postsWithImages = response.data.data.map(post => {
          //console.log('Full post data:', post);  // to show the post data
          return post;
        });
        setPosts(postsWithImages);
        setOriginalPosts(postsWithImages);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = () => {
    if (!search.trim()) {
      setPosts(originalPosts);
      return;
    }
    
    const filteredPosts = originalPosts.filter((post) =>
      post.text.toLowerCase().includes(search.toLowerCase())
    );
    setPosts(filteredPosts);
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchPosts();
  }, []);

  const handleLike = async (postId) => {
    try {
      const response = await api.post(`/posts/${postId}/like`);
      if (response.data.success) {
        // Update local state
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          if (response.data.data.isLiked) {
            newSet.add(postId);
          } else {
            newSet.delete(postId);
          }
          return newSet;
        });
        // Refresh posts to get updated like count
        fetchPosts();
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleCommentUpdate = () => {
    fetchPosts(); // This will refresh the posts and comment counts
  };

  const renderPost = ({ item }) => {
    const createdAt = new Date(item.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

   // console.log('Post data:', item);  // to show the post data

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.userId?.name || "Anonymous"}</Text>
            <Text style={styles.postTime}>{createdAt}</Text>
          </View>
        </View>

        <Text style={styles.postContent}>{item.text}</Text>

        {item.imageUrl && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.postImage}
              resizeMode="cover"
              onError={(error) => {
                console.error('Image loading error:', error);
                console.log('Failed image URL:', item.imageUrl);
              }}
            />
          </View>
        )}

        <View style={styles.postActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleLike(item._id)}
          >
            <FontAwesome 
              name={likedPosts.has(item._id) ? "thumbs-up" : "thumbs-o-up"} 
              size={20} 
              color={likedPosts.has(item._id) ? "#28a745" : "#666"} 
            />
            <Text style={[
              styles.actionText,
              likedPosts.has(item._id) && styles.actionTextActive
            ]}>
              {item.likes?.length || 0} Likes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('CommentScreen', { 
              postId: item._id,
              postOwnerId: item.userId._id,
              onCommentUpdate: handleCommentUpdate
            })}
          >
            <FontAwesome name="comment" size={20} color="#666" />
            <Text style={styles.actionText}>
              {item.commentsCount || 0} Comments
            </Text>
          </TouchableOpacity>
        </View>
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
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <FontAwesome name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Post List */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item._id}
        style={styles.postList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#28a745"]}
            tintColor="#28a745"
          />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {loading ? "Loading posts..." : "No posts found. Try searching again."}
          </Text>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  postCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userInfo: {
    flexDirection: "column",
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  postTime: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  postContent: {
    fontSize: 14,
    color: "#444",
    marginVertical: 12,
    lineHeight: 20,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 12,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionText: {
    marginLeft: 8,
    color: "#666",
    fontSize: 14,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    marginVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  actionTextActive: {
    color: '#28a745',
    fontWeight: 'bold',
  },
});

export default CommunityFeed;
