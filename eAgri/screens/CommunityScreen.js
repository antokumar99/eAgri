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
  RefreshControl,
  ImageBackground,
  Dimensions,
} from "react-native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";
import Header from "../components/Header";

const { width } = Dimensions.get("window");

const CommunityFeed = ({ navigation }) => {
  const [search, setSearch] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [originalPosts, setOriginalPosts] = useState([]); // For search functionality
  const [refreshing, setRefreshing] = useState(false);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchPosts();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        const response = await api.get("/profile");
        if (response.data.success) {
          setCurrentUserId(response.data.data._id);
        }
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await api.get("/posts");
      if (response.data.success) {
        const postsWithImages = response.data.data
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .map((post) => post);
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

    const filteredPosts = originalPosts.filter(
      (post) =>
        post.text.toLowerCase().includes(search.toLowerCase()) ||
        (post.userId?.name &&
          post.userId.name.toLowerCase().includes(search.toLowerCase()))
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
        setLikedPosts((prev) => {
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
      console.error("Error liking post:", error);
    }
  };

  const handleCommentUpdate = () => {
    fetchPosts(); // This will refresh the posts and comment counts
  };

  const handleUserNamePress = (userId, userName) => {
    if (userId === currentUserId) {
      // Navigate to own profile
      navigation.navigate("Profile");
    } else {
      // Navigate to other user's profile
      navigation.navigate("PeopleProfileScreen", {
        userId: userId,
        userName: userName,
      });
    }
  };

  const formatDate = (dateString) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffTime = Math.abs(now - postDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
    } else {
      return `${diffMinutes} ${diffMinutes === 1 ? "minute" : "minutes"} ago`;
    }
  };

  const renderPost = ({ item }) => {
    return (
      <View style={styles.postCard}>
        <LinearGradient
          colors={["#ffffff", "#f8f9fa"]}
          style={styles.gradientBackground}
        >
          <View style={styles.postHeader}>
            <View style={styles.userInfoContainer}>
              <View style={styles.userAvatar}>
                <Text style={styles.avatarText}>
                  {item.userId?.name?.charAt(0).toUpperCase() || "A"}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <TouchableOpacity
                  onPress={() =>
                    handleUserNamePress(item.userId?._id, item.userId?.name)
                  }
                  activeOpacity={0.7}
                >
                  <Text style={styles.userName}>
                    {item.userId?.name || "Anonymous"}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.postTime}>
                  {formatDate(item.createdAt)}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.postContent}>{item.text}</Text>

          {item.imageUrl && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.postImage}
                resizeMode="cover"
              />
            </View>
          )}

          <View style={styles.postActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleLike(item._id)}
            >
              <MaterialIcons
                name={likedPosts.has(item._id) ? "favorite" : "favorite-border"}
                size={24}
                color={likedPosts.has(item._id) ? "#FF902F" : "#666"}
              />
              <Text style={styles.actionText}>{item.likes?.length || 0}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                navigation.navigate("CommentScreen", {
                  postId: item._id,
                  postOwnerId: item.userId._id,
                  onCommentUpdate: handleCommentUpdate,
                })
              }
            >
              <MaterialIcons
                name="chat-bubble-outline"
                size={22}
                color="#666"
              />
              <Text style={styles.actionText}>{item.commentsCount || 0}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
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
      <LinearGradient
        colors={["#134E5E", "#71B280"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Community Feed</Text>
          <TouchableOpacity
            style={styles.newPostButton}
            onPress={() => navigation.navigate("CreatePost")}
          >
            <LinearGradient
              colors={["#2AAF62", "#1E8449"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <MaterialIcons name="post-add" size={24} color="#FFFFFF" />
              <Text style={styles.newPostText}>New Post</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <MaterialIcons
          name="search"
          size={24}
          color="#666"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search posts..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
        />
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item._id}
        style={styles.postList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#723CEB"]}
            tintColor="#723CEB"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="post-add" size={50} color="#666" />
            <Text style={styles.emptyText}>
              {loading ? "Loading posts..." : "No posts found"}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9F7",
  },
  headerGradient: {
    paddingTop: Platform.OS === "android" ? 40 : 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
  },
  newPostButton: {
    overflow: "hidden",
    borderRadius: 25,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  newPostText: {
    color: "#FFFFFF",
    marginLeft: 8,
    fontWeight: "600",
    fontSize: 15,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E8F5E9",
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#2D6A4F",
  },
  postList: {
    paddingHorizontal: 16,
  },
  postCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#2D6A4F",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: "#E8F5E9",
  },
  gradientBackground: {
    padding: 16,
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  userAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#48c574",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2D6A4F",
  },
  postTime: {
    fontSize: 13,
    color: "#74A588",
    marginTop: 2,
  },
  postContent: {
    fontSize: 15,
    color: "#06090F",
    lineHeight: 22,
    marginVertical: 12,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
  },
  postImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#F7F9F7",
  },
  postActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#E8F5E9",
    paddingTop: 12,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 24,
    backgroundColor: "#F7F9F7",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  actionText: {
    marginLeft: 6,
    color: "#2D6A4F",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#F7F9F7",
    borderRadius: 12,
    margin: 16,
    borderWidth: 1,
    borderColor: "#E8F5E9",
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#2D6A4F",
    textAlign: "center",
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
});

export default CommunityFeed;
