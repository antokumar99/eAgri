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
  ScrollView,
  RefreshControl,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from 'expo-linear-gradient';
import Header from "../components/Header";
import api from "../services/api";
import ChatScreen from "./ChatScreen";

const { width } = Dimensions.get('window');

export default function PeopleProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, userName } = route.params;
  
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userPosts, setUserPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchUserData();
    fetchUserPosts();
  }, [userId]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    Promise.all([
      fetchUserData(),
      fetchUserPosts()
    ])
    .finally(() => {
      setRefreshing(false);
    });
  }, [userId]);

  const fetchUserData = async () => {
    try {
      const response = await api.get(`/users/${userId}`);
      if (response.data.success) {
        setUserData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      Alert.alert("Error", "Failed to load user profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const response = await api.get(`/posts/user/${userId}`);
      if (response.data.success) {
        const posts = response.data.data.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setUserPosts(posts);
      }
    } catch (error) {
      console.error("Error fetching user posts:", error);
    }
  };

  const handleMessageUser = () => {
    // Navigate to chat screen with this user
    navigation.navigate('ChatScreen', { 
      userId: userId,
      userName: userData?.name || userName
    });
  };

  const handleCommentUpdate = () => {
    fetchUserPosts(); // Refresh posts after comment updates
  };

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
      hour12: true
    };
    const timeStr = date.toLocaleTimeString("en-US", timeOptions);
    
    return { dateStr, timeStr };
  };

  const renderPost = (post) => {
    const { dateStr, timeStr } = formatDate(post.createdAt);

    return (
      <View key={post._id} style={styles.postCard}>
        <LinearGradient
          colors={['#ffffff', '#f8f9fa']}
          style={styles.gradientBackground}
        >
          <View style={styles.postHeader}>
            <View style={styles.postUserInfo}>
              <View style={styles.userAvatar}>
                <Text style={styles.avatarText}>
                  {userData?.name?.charAt(0).toUpperCase() || 'A'}
                </Text>
              </View>
              <View>
                <Text style={styles.postUsername}>{userData?.name}</Text>
                <View style={styles.timeContainer}>
                  <Text style={styles.postDate}>{dateStr}</Text>
                  <Text style={styles.postTime}>{timeStr}</Text>
                </View>
              </View>
            </View>
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
                  postOwnerId: userId,
                  onCommentUpdate: handleCommentUpdate
                })}
              >
                <Text style={styles.statsText}>
                  {post.commentsCount || 0} comments
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
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
      <LinearGradient
        colors={['#134E5E', '#71B280']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{userData?.name || userName}</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

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
          <View style={styles.userAvatar}>
            {userData?.photo ? (
              <Image source={{ uri: userData.photo }} style={styles.avatar} />
            ) : (
              <Text style={styles.avatarText}>
                {userData?.name?.charAt(0).toUpperCase() || 'A'}
              </Text>
            )}
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{userPosts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {userPosts.reduce((total, post) => total + (post.likes?.length || 0), 0)}
              </Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
          </View>

          <Text style={styles.profileName}>{userData?.name}</Text>
          
          {userData?.address && (
            <View style={styles.locationContainer}>
              <Icon name="location-outline" size={16} color="#555" />
              <Text style={styles.locationText}>
                {userData.address.city && userData.address.country 
                  ? `${userData.address.city}, ${userData.address.country}`
                  : userData.address.city || userData.address.country || 'Location not specified'
                }
              </Text>
            </View>
          )}

          {userData?.farm?.title && (
            <View style={styles.farmInfo}>
              <Text style={styles.farmTitle}>{userData.farm.title}</Text>
              {userData.farm.experience && (
                <Text style={styles.farmExperience}>
                  {userData.farm.experience} years of experience
                </Text>
              )}
            </View>
          )}

          {/* Message Button */}
          <TouchableOpacity
            style={styles.messageButton}
            onPress={handleMessageUser}
          >
            <LinearGradient
              colors={['#2AAF62', '#1E8449']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <MaterialIcons name="message" size={20} color="#FFFFFF" />
              <Text style={styles.messageButtonText}>Message</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* User Posts */}
        <View style={styles.postsContainer}>
          <Text style={styles.sectionTitle}>Posts by {userData?.name}</Text>
          {userPosts.length > 0 ? (
            userPosts.map(renderPost)
          ) : (
            <Text style={styles.noPostsText}>No posts yet</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  profileInfo: {
    alignItems: "center",
    paddingVertical: 30,
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#2D6A4F",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  userAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#48c574",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "bold",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "60%",
    marginBottom: 15,
  },
  statBox: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2D6A4F",
  },
  statLabel: {
    fontSize: 14,
    color: "#74A588",
    marginTop: 2,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2D6A4F",
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  locationText: {
    marginLeft: 5,
    fontSize: 16,
    color: "#74A588",
  },
  farmInfo: {
    alignItems: "center",
    marginBottom: 20,
  },
  farmTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2ecc71",
    textAlign: 'center',
  },
  farmExperience: {
    fontSize: 14,
    color: "#74A588",
    marginTop: 2,
  },
  messageButton: {
    marginTop: 10,
    borderRadius: 25,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  messageButtonText: {
    color: "#FFFFFF",
    marginLeft: 8,
    fontWeight: "600",
    fontSize: 16,
  },
  postsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D6A4F',
    marginBottom: 16,
  },
  postCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: "#2D6A4F",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  gradientBackground: {
    padding: 16,
  },
  postHeader: {
    marginBottom: 12,
  },
  postUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D6A4F',
  },
  postText: {
    fontSize: 15,
    color: "#06090F",
    lineHeight: 22,
    marginBottom: 12,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F7F9F7',
  },
  postFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E8F5E9',
    paddingTop: 12,
  },
  postStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    color: '#74A588',
    fontWeight: '500',
  },
  timeContainer: {
    marginTop: 2,
  },
  postDate: {
    fontSize: 12,
    color: '#74A588',
    marginBottom: 1,
  },
  postTime: {
    fontSize: 11,
    color: '#99B5A3',
    fontStyle: 'italic',
  },
  noPostsText: {
    textAlign: 'center',
    color: '#74A588',
    fontSize: 16,
    marginTop: 40,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7F9F7",
  },
});