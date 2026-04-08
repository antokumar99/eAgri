import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';

const TrendingScreen = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrendingPosts = async () => {
    try {
      const response = await api.get("/posts");
      if (response.data.success) {
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

        const trendingPosts = response.data.data
          .filter(post => new Date(post.createdAt) >= tenDaysAgo)
          .map(post => ({
            ...post,
            engagementScore: (post.likes?.length || 0) + (post.commentsCount || 0)
          }))
          .sort((a, b) => b.engagementScore - a.engagementScore);

        setPosts(trendingPosts);
      }
    } catch (error) {
      console.error("Error fetching trending posts:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrendingPosts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrendingPosts();
  };

  const handleLike = async (postId) => {
    try {
      const response = await api.post(`/posts/${postId}/like`);
      if (response.data.success) {
        fetchTrendingPosts();
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const renderTrendingPost = ({ item, index }) => (
    <View style={styles.postCard}>
      <LinearGradient
        colors={['#ffffff', '#f8f9fa']}
        style={styles.gradientBackground}
      >
        <View style={styles.rankingBadge}>
          <Text style={styles.rankingText}>#{index + 1}</Text>
        </View>

        <TouchableOpacity 
          onPress={() => navigation.navigate('CommentScreen', { 
            postId: item._id,
            postOwnerId: item.userId._id
          })}
        >
          <View style={styles.postHeader}>
            <View style={styles.userInfoContainer}>
              <View style={styles.userAvatar}>
                <Text style={styles.avatarText}>
                  {item.userId?.name?.charAt(0).toUpperCase() || 'A'}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.userId?.name || "Anonymous"}</Text>
                <View style={styles.engagementInfo}>
                  <MaterialIcons name="trending-up" size={16} color="#558B2F" />
                  <Text style={styles.engagementText}>
                    {item.engagementScore} engagements
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <Text style={styles.postContent}>{item.text}</Text>

          {item.imageUrl && (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.postImage}
              resizeMode="cover"
            />
          )}
        </TouchableOpacity>

        <View style={styles.statsContainer}>
          <TouchableOpacity 
            style={styles.stat}
            onPress={() => handleLike(item._id)}
          >
            <MaterialIcons name="favorite" size={20} color="#D32F2F" />
            <Text style={styles.statText}>{item.likes?.length || 0}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.stat}
            onPress={() => navigation.navigate('CommentScreen', { 
              postId: item._id,
              postOwnerId: item.userId._id
            })}
          >
            <MaterialIcons name="chat-bubble" size={20} color="#2E7D32" />
            <Text style={styles.statText}>{item.commentsCount || 0}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#723CEB" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#2E7D32', '#66BB6A']}
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
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Trending Posts</Text>
            <Text style={styles.headerSubtitle}>Last 10 days • Top engagement</Text>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={posts}
        renderItem={renderTrendingPost}
        keyExtractor={item => item._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#723CEB"]}
            tintColor="#723CEB"
          />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="trending-up" size={50} color="#2E7D32" />
            <Text style={styles.emptyText}>No trending posts yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7F5",
  },
  headerGradient: {
    paddingTop: Platform.OS === "android" ? 40 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  headerTextContainer: {
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  postCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gradientBackground: {
    padding: 16,
  },
  rankingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FFA000',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  rankingText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#558B2F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1B5E20",
  },
  engagementInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  engagementText: {
    fontSize: 12,
    color: "#558B2F",
    marginLeft: 4,
  },
  postContent: {
    fontSize: 15,
    color: "#33691E",
    lineHeight: 22,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(46, 125, 50, 0.1)',
    paddingTop: 12,
    marginTop: 8,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    backgroundColor: 'rgba(46, 125, 50, 0.08)',
    padding: 8,
    borderRadius: 20,
  },
  statText: {
    marginLeft: 4,
    color: "#2E7D32",
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: 'rgba(46, 125, 50, 0.05)',
    borderRadius: 16,
    margin: 16,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#2E7D32",
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default TrendingScreen;