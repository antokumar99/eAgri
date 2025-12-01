import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Modal,
  TextInput,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";
import Header from "../components/Header";

const ProductDetailsScreen = ({ route, navigation }) => {
  const { product } = route.params;
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    checkUserReview();
  }, []);

  const checkUserReview = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUser(user);

        // Check if user has already reviewed this product
        const hasReviewed = product.ratings?.some(
          (rating) => rating.user?._id === user._id || rating.user === user._id
        );
        setUserHasReviewed(hasReviewed);
      }
    } catch (error) {
      console.error("Error checking user review:", error);
    }
  };

  const handleAddToCart = async () => {
    try {
      setLoading(true);
      const response = await api.post("/cart/add", {
        productId: product._id,
        quantity,
        isRental: product.productType === "rent",
      });
      Alert.alert("Success", "Product added to cart", [
        {
          text: "Continue Shopping",
          style: "cancel",
        },
        {
          text: "Go to Cart",
          onPress: () => navigation.navigate("Cart"),
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to add to cart"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleWriteReview = () => {
    if (!currentUser) {
      Alert.alert("Error", "Please login to write a review");
      return;
    }
    if (userHasReviewed) {
      Alert.alert("Already Reviewed", "You have already reviewed this product");
      return;
    }
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      Alert.alert("Error", "Please select a rating");
      return;
    }
    if (!reviewText.trim()) {
      Alert.alert("Error", "Please write a review");
      return;
    }

    try {
      setSubmittingReview(true);
      const response = await api.post(`/products/${product._id}/review`, {
        rating: reviewRating,
        review: reviewText.trim(),
      });

      Alert.alert("Success", "Review submitted successfully");
      setShowReviewModal(false);
      setReviewRating(0);
      setReviewText("");
      setUserHasReviewed(true);

      // Refresh the product data to show updated rating
      // You might want to implement a refresh mechanism here
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to submit review"
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleViewReviews = () => {
    navigation.navigate("Reviews", {
      productId: product._id,
      productName: product.name,
    });
  };

  const [showRentalModal, setShowRentalModal] = useState(false);
  const [rentalDuration, setRentalDuration] = useState(1);
  const [rentalUnit, setRentalUnit] = useState("day");
  const [startDate, setStartDate] = useState(new Date());

  const handleRentNow = () => {
    setShowRentalModal(true);
  };

  const handleCreateRental = async () => {
    try {
      setLoading(true);
      const response = await api.post("/rentals/create", {
        productId: product._id,
        durationValue: rentalDuration,
        durationUnit: rentalUnit,
        startDate: startDate.toISOString(),
        paymentMethod: "online",
      });
      setShowRentalModal(false);
      Alert.alert("Success", "Rental created successfully", [
        {
          text: "View Details",
          onPress: () =>
            navigation.navigate("RentalDetails", {
              rentalId: response.data.rental._id,
            }),
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to create rental"
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateRentalPrice = () => {
    let totalPrice = 0;
    switch (rentalUnit) {
      case "day":
        totalPrice = product.rentPrice * rentalDuration;
        break;
      case "week":
        totalPrice = product.rentPrice * rentalDuration * 7;
        break;
      case "month":
        totalPrice = product.rentPrice * rentalDuration * 30;
        break;
    }
    return totalPrice;
  };

  const renderRatingStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <MaterialIcons
        key={index}
        name={index < rating ? "star" : "star-border"}
        size={20}
        color="#FFD700"
      />
    ));
  };

  const renderReviewStars = (rating, onPress) => {
    return [...Array(5)].map((_, index) => (
      <TouchableOpacity key={index} onPress={() => onPress(index + 1)}>
        <MaterialIcons
          name={index < rating ? "star" : "star-border"}
          size={30}
          color="#FFD700"
        />
      </TouchableOpacity>
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Product Details" showBack />
      <ScrollView>
        <Image source={{ uri: product.image }} style={styles.image} />
        <View style={styles.detailsContainer}>
          <Text style={styles.name}>{product.name}</Text>
          {product.productType === "both" ? (
            <View>
              <Text style={styles.price}>Buy: ৳{product.price}</Text>
              <Text style={styles.rentPrice}>
                Rent: ৳{product.rentPrice}/day
              </Text>
            </View>
          ) : (
            <Text style={styles.price}>
              {product.productType === "rent"
                ? `৳${product.rentPrice}/day`
                : `৳${product.price}`}
            </Text>
          )}

          <View style={styles.ratingContainer}>
            <View style={styles.stars}>
              {renderRatingStars(Math.round(product.averageRating || 0))}
            </View>
            <Text style={styles.ratingText}>
              {product.averageRating?.toFixed(1) || "No ratings"} (
              {product.ratings?.length || 0} reviews)
            </Text>
          </View>

          {/* Review Buttons */}
          <View style={styles.reviewButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.reviewButton,
                userHasReviewed && styles.reviewButtonDisabled,
              ]}
              onPress={handleWriteReview}
            >
              <MaterialIcons
                name={userHasReviewed ? "check-circle" : "rate-review"}
                size={20}
                color={userHasReviewed ? "#666" : "#4CAF50"}
              />
              <Text
                style={[
                  styles.reviewButtonText,
                  userHasReviewed && styles.reviewButtonTextDisabled,
                ]}
              >
                {userHasReviewed ? "Already Reviewed" : "Write Review"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reviewButton}
              onPress={handleViewReviews}
            >
              <MaterialIcons name="list" size={20} color="#2196F3" />
              <Text style={styles.reviewButtonText}>View All Reviews</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>

          <Text style={styles.sectionTitle}>Seller Information</Text>
          <Text style={styles.sellerName}>{product.seller?.name}</Text>
          <Text style={styles.sellerName}>{product.seller?.email}</Text>

          <View style={styles.stockInfo}>
            <Text style={styles.stockText}>
              Stock Available: {product.stock} units
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            {(product.productType === "buy" ||
              product.productType === "both") && (
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.buyButton,
                  loading && styles.disabledButton,
                ]}
                onPress={handleAddToCart}
                disabled={loading || product.stock < 1}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialIcons
                      name="shopping-cart"
                      size={24}
                      color="#fff"
                    />
                    <Text style={styles.buttonText}>
                      {product.stock < 1 ? "Out of Stock" : "Add to Cart"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {(product.productType === "rent" ||
              product.productType === "both") && (
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.rentButton,
                  loading && styles.disabledButton,
                ]}
                onPress={handleRentNow}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="access-time" size={24} color="#fff" />
                    <Text style={styles.buttonText}>Rent Now</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Write a Review</Text>
              <TouchableOpacity
                onPress={() => setShowReviewModal(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.reviewLabel}>Your Rating:</Text>
              <View style={styles.starsContainer}>
                {renderReviewStars(reviewRating, setReviewRating)}
              </View>
              <Text style={styles.reviewLabel}>Your Review:</Text>
              <TextInput
                style={styles.reviewInput}
                value={reviewText}
                onChangeText={setReviewText}
                placeholder="Share your experience with this product..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowReviewModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  submittingReview && styles.disabledButton,
                ]}
                onPress={handleSubmitReview}
                disabled={submittingReview}
              >
                {submittingReview ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Submit Review</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rental Modal */}
      <Modal
        visible={showRentalModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRentalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rent {product.name}</Text>
              <TouchableOpacity
                onPress={() => setShowRentalModal(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.rentalOption}>
                <Text style={styles.rentalLabel}>Duration:</Text>
                <View style={styles.durationContainer}>
                  <TextInput
                    style={styles.durationInput}
                    value={rentalDuration.toString()}
                    onChangeText={(text) =>
                      setRentalDuration(parseInt(text) || 1)
                    }
                    keyboardType="numeric"
                    placeholder="1"
                  />
                  <View style={styles.unitContainer}>
                    {["day", "week", "month"].map((unit) => (
                      <TouchableOpacity
                        key={unit}
                        style={[
                          styles.unitButton,
                          rentalUnit === unit && styles.selectedUnit,
                        ]}
                        onPress={() => setRentalUnit(unit)}
                      >
                        <Text
                          style={[
                            styles.unitText,
                            rentalUnit === unit && styles.selectedUnitText,
                          ]}
                        >
                          {unit.charAt(0).toUpperCase() + unit.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.priceCalculation}>
                <Text style={styles.priceLabel}>Total Price:</Text>
                <Text style={styles.priceValue}>৳{calculateRentalPrice()}</Text>
              </View>

              <View style={styles.rentalInfo}>
                <Text style={styles.infoText}>• Rental starts from today</Text>
                <Text style={styles.infoText}>
                  • Payment will be processed immediately
                </Text>
                <Text style={styles.infoText}>
                  • You can extend the rental later
                </Text>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowRentalModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, loading && styles.disabledButton]}
                onPress={handleCreateRental}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm Rental</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  image: {
    width: "100%",
    height: 300,
    resizeMode: "cover",
  },
  detailsContainer: {
    padding: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  price: {
    fontSize: 20,
    fontWeight: "600",
    color: "#4CAF50",
    marginBottom: 5,
  },
  rentPrice: {
    fontSize: 18,
    fontWeight: "500",
    color: "#FF9800",
    marginBottom: 10,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  stars: {
    flexDirection: "row",
    marginRight: 10,
  },
  ratingText: {
    fontSize: 16,
    color: "#666",
  },
  reviewButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  reviewButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 0.48,
    justifyContent: "center",
  },
  reviewButtonText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: "500",
  },
  reviewButtonDisabled: {
    opacity: 0.6,
    backgroundColor: "#e0e0e0",
  },
  reviewButtonTextDisabled: {
    color: "#666",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 10,
    color: "#333",
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "#666",
    marginBottom: 20,
  },
  sellerName: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
  stockInfo: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  stockText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 0.48,
  },
  buyButton: {
    backgroundColor: "#4CAF50",
  },
  rentButton: {
    backgroundColor: "#FF9800",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    marginBottom: 20,
  },
  rentalOption: {
    marginBottom: 20,
  },
  rentalLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  durationInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    width: 80,
    marginRight: 15,
  },
  unitContainer: {
    flexDirection: "row",
  },
  unitButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  selectedUnit: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  unitText: {
    fontSize: 14,
    color: "#666",
  },
  selectedUnitText: {
    color: "#fff",
    fontWeight: "600",
  },
  priceCalculation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  rentalInfo: {
    backgroundColor: "#f0f8ff",
    padding: 15,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    flex: 0.48,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 0.48,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Review modal styles
  reviewLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  starsContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
});

export default ProductDetailsScreen;
