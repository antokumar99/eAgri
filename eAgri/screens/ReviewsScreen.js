import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Header from "../components/Header";
import api from "../services/api";

const ReviewsScreen = ({ route, navigation }) => {
  const { productId, productName } = route.params;
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/products/${productId}`);
      if (response.data.success) {
        const product = response.data.product;
        setReviews(product.ratings || []);
        setAverageRating(product.averageRating || 0);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const renderRatingStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <MaterialIcons
        key={index}
        name={index < rating ? "star" : "star-border"}
        size={16}
        color="#FFD700"
      />
    ));
  };

  const renderReviewItem = ({ item }) => (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <MaterialIcons name="person" size={20} color="#666" />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {item.user?.name || "Anonymous User"}
            </Text>
            <Text style={styles.reviewDate}>
              {new Date(item.createdAt || Date.now()).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <View style={styles.ratingStars}>{renderRatingStars(item.rating)}</View>
      </View>
      <Text style={styles.reviewText}>{item.review}</Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="rate-review" size={64} color="#ccc" />
      <Text style={styles.emptyStateText}>No reviews yet</Text>
      <Text style={styles.emptyStateSubtext}>
        Be the first to review this product!
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Reviews" showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Reviews" showBack />

      {/* Average Rating Header */}
      <View style={styles.averageRatingContainer}>
        <Text style={styles.productName}>{productName}</Text>
        <View style={styles.ratingInfo}>
          <View style={styles.averageStars}>
            {renderRatingStars(Math.round(averageRating))}
          </View>
          <Text style={styles.averageRatingText}>
            {averageRating.toFixed(1)} out of 5
          </Text>
        </View>
        <Text style={styles.totalReviews}>
          {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
        </Text>
      </View>

      <FlatList
        data={reviews}
        renderItem={renderReviewItem}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.reviewsList}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  averageRatingContainer: {
    padding: 20,
    backgroundColor: "#f9f9f9",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  productName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  ratingInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  averageStars: {
    flexDirection: "row",
    marginRight: 10,
  },
  averageRatingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  totalReviews: {
    fontSize: 14,
    color: "#666",
  },
  reviewsList: {
    padding: 20,
  },
  reviewItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  reviewDate: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  ratingStars: {
    flexDirection: "row",
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#444",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 15,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 5,
  },
});

export default ReviewsScreen;
