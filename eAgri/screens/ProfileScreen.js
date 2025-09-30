import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  ScrollView,
  RefreshControl,
  Modal,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Header from "../components/Header";
import api from "../services/api";

const { width, height } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.8;
const drawerAnimation = new Animated.Value(0);

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showOptions, setShowOptions] = useState(false);

  const menuItems = [
    {
      id: 1,
      label: "Cart",
      icon: "cart",
      onPress: () => navigation.navigate("Cart"),
    },
    {
      id: 2,
      label: "Edit Profile",
      icon: "create-outline",
      onPress: () => navigation.navigate("EditProfile", { userData }),
    },
    {
      id: 3,
      label: "Order History",
      icon: "document-text-outline",
      onPress: () => navigation.navigate("OrderHistory"),
    },
    {
      id: 4,
      label: "Settings",
      icon: "settings-outline",
      onPress: () => navigation.navigate("Settings"),
    },
    {
      id: 5,
      label: "Logout",
      icon: "log-out-outline",
      onPress: async () => {
        try {
          // await AsyncStorage.removeItem("token");
          // console.log("Logged out");
          // navigation.replace("Login");
          // Clear the location data
          global.userLocation = null;
          
          // Clear the token and other data
          await AsyncStorage.clear();
          
          // Navigate to login
          navigation.replace('Login');
        } catch (error) {
          console.error('Error logging out:', error);
          Alert.alert('Error', 'Failed to log out');
        }
      },
    },
  ];

  const toggleDrawer = () => {
    const toValue = isDrawerOpen ? 0 : 1;
    setIsDrawerOpen(!isDrawerOpen);
    
    Animated.spring(drawerAnimation, {
      toValue,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
      duration: 400,
    }).start();
  };

  useEffect(() => {
    fetchUserData();
    if (userData?.data?._id) {
      fetchUserPosts();
    }
  }, [userData?.data?._id]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    Promise.all([
      fetchUserData(),
      fetchUserPosts()
    ])
    .finally(() => {
      setRefreshing(false);
    });
  }, [userData?.data?._id]);

  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.replace("Login");
        return;
      }

      const response = await api.get("/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUserData(response.data);

    } catch (error) {
      console.error("Error fetching user data:", error);
      Alert.alert("Error", "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  // const handleLogout = async () => {
  //   try {
  //     await AsyncStorage.removeItem("token");
  //     console.log("Logged out");
  //     navigation.replace("Login");
  //   } catch (error) {
  //     console.error("Error logging out:", error);
  //     Alert.alert("Error", "Failed to logout");
  //   }
  // };

  const fetchUserPosts = async () => {
    try {
      // First get user's posts directly using the dedicated endpoint
      const response = await api.get(`/posts/user/${userData?.data?._id}`);
      if (response.data.success) {
        const myPosts = response.data.data.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setUserPosts(myPosts);
      }
    } catch (error) {
      console.error("Error fetching user posts:", error);
      // If there's an error, try the fallback method
      try {
        const allPostsResponse = await api.get('/posts');
        if (allPostsResponse.data.success) {
          const myPosts = allPostsResponse.data.data
            .filter(post => post.userId._id === userData?.data?._id)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setUserPosts(myPosts);
        }
      } catch (fallbackError) {
        console.error("Error in fallback fetch:", fallbackError);
      }
    }
  };

  const handlePostOptions = (post) => {
    setSelectedPost(post);
    setShowOptions(true);
  };

  const handleUpdateSuccess = () => {
    fetchUserPosts(); // Refresh posts after update
  };

  const handleUpdatePost = () => {
    setShowOptions(false);
    navigation.navigate('UpdatePostScreen', { 
      post: selectedPost,
      onUpdateSuccess: handleUpdateSuccess // Pass the callback
    });
  };

  const handleDeletePost = async () => {
    try {
      setShowOptions(false);
      // Show loading indicator
      setLoading(true);

      const response = await api.delete(`/posts/${selectedPost._id}`);
      if (response.data.success) {
        // Update posts list
        setUserPosts(posts => posts.filter(p => p._id !== selectedPost._id));
        Alert.alert('Success', 'Post deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      Alert.alert('Error', 'Failed to delete post');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentUpdate = () => {
    fetchUserPosts(); // This will refresh the posts and update comment counts
  };

  const renderDrawerItem = (item) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.drawerItem,
        { opacity: 1 }
      ]}
      onPress={() => {
        toggleDrawer();
        setTimeout(item.onPress, 1000);
      }}
      activeOpacity={0.7}
    >
      <Icon name={item.icon} size={24} color="#558B2F" />
      <Text style={styles.drawerItemText}>{item.label}</Text>
    </TouchableOpacity>
  );

  const translateX = drawerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [DRAWER_WIDTH, 0],
  });

  const overlayOpacity = drawerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const renderPost = (post) => {
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      
      // Format date
      const dateOptions = {
        year: "numeric",
        month: "long",
        day: "numeric"
      };
      const dateStr = date.toLocaleDateString("en-US", dateOptions);
      
      // Format time
      const timeOptions = {
        hour: "numeric",
        minute: "numeric",
        hour12: true  // This ensures 12-hour format with AM/PM
      };
      const timeStr = date.toLocaleTimeString("en-US", timeOptions);
      
      return { dateStr, timeStr };
    };

    const { dateStr, timeStr } = formatDate(post.createdAt);

    return (
      <View key={post._id} style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={styles.postUserInfo}>
            <Image
              source={
                userData?.photo
                  ? { uri: userData.photo }
                  : require("../assets/avatar.png")
              }
              style={styles.postAvatar}
            />
            <View>
              <Text style={styles.postUsername}>{userData?.data?.name}</Text>
              <View style={styles.timeContainer}>
                <Text style={styles.postDate}>{dateStr}</Text>
                <Text style={styles.postTime}>{timeStr}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => handlePostOptions(post)}
            style={styles.optionsButton}
          >
            <Icon name="ellipsis-vertical" size={20} color="#666" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.postText}>{post.text}</Text>
        
        {post.imageUrl && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: post.imageUrl }}
              style={styles.postImage}
              resizeMode="cover"
            />
          </View>
        )}

        <View style={styles.postFooter}>
          <View style={styles.postStats}>
            <Text style={styles.statsText}>
              {post.likes?.length || 0} likes
            </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('CommentScreen', { 
                postId: post._id,
                postOwnerId: userData?.data?._id,
                onCommentUpdate: handleCommentUpdate
              })}
            >
              <Text style={styles.statsText}>
                {post.commentsCount || 0} comments
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2ecc71" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="My Profile" />

      {/* Menu Button */}
      <TouchableOpacity 
        style={styles.menuButton} 
        onPress={toggleDrawer}
      >
        <Icon name="menu-outline" size={30} color="#555" />
      </TouchableOpacity>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#8BC34A']}
          />
        }
      >
        {/* Profile Info */}
        <View style={styles.profileInfo}>
          {userData?.photo ? (
            <Image source={{ uri: userData.photo }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar}>
              <Image
                source={require("../assets/avatar.png")}
                style={{ width: 60, height: 60 }}
              />
              {/* <Icon name="person-outline" size={40} color="#555" /> */}
            </View>
          )}

          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Favorites</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
          </View>

          <Text style={styles.profileName}>{userData?.data?.name}</Text>
          <View style={styles.locationContainer}>
            <Icon name="location-outline" size={16} color="#555" />
            <Text style={styles.locationText}>
              {userData?.data?.address?.city}, {userData?.data?.address?.country}
            </Text>
          </View>

          {userData?.data?.farm?.title && (
            <View style={styles.farmInfo}>
              <Text style={styles.farmTitle}>{userData?.data?.farm.title}</Text>
              <Text style={styles.farmExperience}>
                {userData.farm.experience} years of experience
              </Text>
            </View>
          )}
        </View>

        {/* User Posts */}
        <View style={styles.postsContainer}>
          <Text style={styles.sectionTitle}>My Posts</Text>
          {userPosts.length > 0 ? (
            userPosts.map(renderPost)
          ) : (
            <Text style={styles.noPostsText}>No posts yet</Text>
          )}
        </View>
      </ScrollView>

      {/* Post Options Modal */}
      <Modal
        visible={showOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptions(false)}
        >
          <View style={styles.optionsModal}>
            <TouchableOpacity
              style={styles.optionItem}
              onPress={handleUpdatePost}
            >
              <Icon name="create-outline" size={24} color="#558B2F" />
              <Text style={styles.optionText}>Update Post</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.optionItem, styles.deleteOption]}
              onPress={handleDeletePost}
            >
              <Icon name="trash-outline" size={24} color="#FF5252" />
              <Text style={[styles.optionText, styles.deleteText]}>
                Delete Post
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <>
          <Animated.View
            style={[
              styles.overlay,
              {
                opacity: overlayOpacity,
              }
            ]}
          >
            <TouchableOpacity
              style={styles.overlayTouch}
              activeOpacity={1}
              onPress={toggleDrawer}
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.drawer,
              {
                transform: [{ translateX }],
              },
            ]}
          >
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Menu</Text>
              <TouchableOpacity 
                onPress={toggleDrawer}
                style={styles.closeButton}
              >
                <Icon name="close-outline" size={32} color="#fff" />
              </TouchableOpacity>
            </View>
            {menuItems.map(renderDrawerItem)}
          </Animated.View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? 40 : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#fff",
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#555",
  },
  profileInfo: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "#f9f9f9",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "60%",
    marginBottom: 10,
  },
  statBox: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
  },
  statLabel: {
    fontSize: 12,
    color: "#777",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 5,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    marginLeft: 5,
    fontSize: 14,
    color: "#777",
  },
  menuList: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#555",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  farmInfo: {
    marginTop: 10,
    alignItems: "center",
  },
  farmTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2ecc71",
  },
  farmExperience: {
    fontSize: 14,
    color: "#777",
    marginTop: 2,
  },
  menuButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 45,
    right: 20,
    zIndex: 50,
    // backgroundColor: '#4CAF50',
    // padding: 8,
    // borderRadius: 8,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 98,
  },
  overlayTouch: {
    width: '100%',
    height: '100%',
  },
  drawer: {
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 25,
    position: 'absolute',
    top: 40,
    right: 0,
    width: DRAWER_WIDTH,
    height: height - 40,
    backgroundColor: '#F1F8E9',
    zIndex: 99,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    transform: [{ translateX: DRAWER_WIDTH }],
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#C8E6C9',
    backgroundColor: '#8BC34A',
    borderTopLeftRadius: 25,
  },
  drawerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#C8E6C9',
    backgroundColor: '#F1F8E9',
  },
  drawerItemText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#33691E',
    fontWeight: '500',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  postsContainer: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  postUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  postUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  postTime: {
    fontSize: 12,
    color: '#666',
  },
  postText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
    lineHeight: 20,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  optionsButton: {
    padding: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
  deleteOption: {
    borderBottomWidth: 0,
  },
  deleteText: {
    color: '#FF5252',
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  postFooter: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  postStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    color: '#666',
  },
  noPostsText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 20,
  },
  timeContainer: {
    flexDirection: 'column',
  },
  postDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  postTime: {
    fontSize: 11,
    color: '#888',
    fontStyle: 'italic',
  },
});
