import React, { useState } from "react";
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
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import api from "../services/api";
import Header from "../components/Header";

const ProductDetailsScreen = ({ route, navigation }) => {
  const { product } = route.params;
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);

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

  const handleRentNow = async () => {
    try {
      setLoading(true);
      const response = await api.post("/rentals/create", {
        productId: product._id,
        duration: 24, // Default rental duration (24 hours)
      });
      Alert.alert("Success", "Product rented successfully", [
        {
          text: "View Details",
          onPress: () =>
            navigation.navigate("RentalDetails", {
              rental: response.data.rental,
            }),
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to rent product"
      );
    } finally {
      setLoading(false);
    }
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

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>

          <Text style={styles.sectionTitle}>Seller Information</Text>
          <Text style={styles.sellerName}>{product.seller?.name}</Text>

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? 40 : 0,
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
  },
  price: {
    fontSize: 22,
    color: "#008E97",
    fontWeight: "bold",
    marginBottom: 15,
  },
  rentPrice: {
    fontSize: 18,
    color: "#4CAF50",
    marginBottom: 15,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: "#444",
    lineHeight: 24,
  },
  sellerName: {
    fontSize: 16,
    color: "#666",
  },
  stockInfo: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  stockText: {
    fontSize: 16,
    color: "#444",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  buyButton: {
    backgroundColor: "#008E97",
  },
  rentButton: {
    backgroundColor: "#4CAF50",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default ProductDetailsScreen;
