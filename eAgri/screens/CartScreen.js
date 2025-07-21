import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  SafeAreaView,
} from "react-native";
import api from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import Header from "../components/Header";

const CartScreen = ({ navigation }) => {
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      const response = await api.get("/cart");
      const { cart, cartStats } = response.data;

      setCartItems(cart.items);
      setTotal(cart.total);
      console.log("Cart Statistics:", cartStats);
    } catch (error) {
      console.error("Error fetching cart items:", error);
      Alert.alert("Error", "Failed to load cart items");
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    try {
      if (newQuantity < 1) return;

      const response = await api.put(`/cart/item/${itemId}`, {
        quantity: newQuantity,
      });

      if (response.data.success) {
        const { cart, cartStats } = response.data;
        setCartItems(cart.items);
        setTotal(cart.total);
        console.log("Cart Statistics:", cartStats);
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to update quantity"
      );
    }
  };

  const removeItem = async (itemId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      await api.delete(`/cart/item/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCartItems();
    } catch (error) {
      console.error("Error removing item:", error);
      Alert.alert("Error", "Failed to remove item");
    }
  };

  const proceedToCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert("Cart Empty", "Please add items to cart before checkout");
      return;
    }
    navigation.navigate("Checkout", { total });
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image source={{ uri: item.product.image }} style={styles.productImage} />
      <View style={styles.itemDetails}>
        <Text style={styles.productName}>{item.product.name}</Text>
        <Text style={styles.productPrice}>
          ৳{item.isRental ? item.product.rentPrice : item.product.price}
        </Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            onPress={() => updateQuantity(item._id, item.quantity - 1)}
            disabled={item.quantity <= 1}
            style={[
              styles.quantityButton,
              item.quantity <= 1 && styles.disabledButton,
            ]}
          >
            <MaterialIcons
              name="remove-circle-outline"
              size={24}
              color={item.quantity <= 1 ? "#ccc" : "#008E97"}
            />
          </TouchableOpacity>
          <Text style={styles.quantity}>{item.quantity}</Text>
          <TouchableOpacity
            onPress={() => updateQuantity(item._id, item.quantity + 1)}
            disabled={item.quantity >= item.product.stock}
            style={[
              styles.quantityButton,
              item.quantity >= item.product.stock && styles.disabledButton,
            ]}
          >
            <MaterialIcons
              name="add-circle-outline"
              size={24}
              color={item.quantity >= item.product.stock ? "#ccc" : "#008E97"}
            />
          </TouchableOpacity>
        </View>
        {item.product.stock < 5 && (
          <Text style={styles.stockWarning}>
            Only {item.product.stock} left in stock
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeItem(item._id)}
      >
        <MaterialIcons name="delete-outline" size={24} color="#FF0000" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Cart" />
      <FlatList
        data={cartItems}
        renderItem={renderCartItem}
        keyExtractor={(item) => item._id}
        ListEmptyComponent={
          <Text style={styles.emptyCart}>Your cart is empty</Text>
        }
      />
      <View style={styles.totalContainer}>
        <Text style={styles.totalText}>Total: ৳{total}</Text>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={proceedToCheckout}
        >
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    paddingTop: Platform.OS === "android" ? 40 : 0,
  },
  cartItem: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "#fff",
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 15,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  productPrice: {
    fontSize: 14,
    color: "#008E97",
    marginVertical: 5,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantity: {
    marginHorizontal: 15,
    fontSize: 16,
  },
  removeButton: {
    padding: 5,
  },
  totalContainer: {
    padding: 20,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  checkoutButton: {
    backgroundColor: "#008E97",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  checkoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyCart: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginTop: 50,
  },
  quantityButton: {
    padding: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  stockWarning: {
    color: "#ff6b6b",
    fontSize: 12,
    marginTop: 4,
  },
});

export default CartScreen;
