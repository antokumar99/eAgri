import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CheckoutScreen = ({ route, navigation }) => {
  const { total } = route.params;
  const [address, setAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
  });

  const validateForm = () => {
    for (let key in address) {
      if (!address[key]) {
        Alert.alert("Error", "Please fill in all fields");
        return false;
      }
    }
    return true;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;

    try {
      const token = await AsyncStorage.getItem("userToken");
      const response = await axios.post(
        "YOUR_API_URL/api/orders/create",
        {
          address,
          total,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Navigate to payment gateway
      navigation.navigate("PaymentWebView", {
        paymentUrl: response.data.paymentUrl,
        orderId: response.data.orderId,
      });
    } catch (error) {
      console.error("Error creating order:", error);
      Alert.alert("Error", "Failed to process payment");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <TextInput
          style={styles.input}
          placeholder="Street Address"
          value={address.street}
          onChangeText={(text) => setAddress({ ...address, street: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="City"
          value={address.city}
          onChangeText={(text) => setAddress({ ...address, city: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="State"
          value={address.state}
          onChangeText={(text) => setAddress({ ...address, state: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="ZIP Code"
          value={address.zipCode}
          onChangeText={(text) => setAddress({ ...address, zipCode: text })}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={address.phone}
          onChangeText={(text) => setAddress({ ...address, phone: text })}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.row}>
          <Text>Subtotal</Text>
          <Text>৳{total}</Text>
        </View>
        <View style={styles.row}>
          <Text>Delivery Fee</Text>
          <Text>৳50</Text>
        </View>
        <View style={[styles.row, styles.total]}>
          <Text style={styles.totalText}>Total</Text>
          <Text style={styles.totalText}>৳{total + 50}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.paymentButton} onPress={handlePayment}>
        <Text style={styles.paymentButtonText}>Proceed to Payment</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  section: {
    backgroundColor: "#fff",
    padding: 20,
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  total: {
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingTop: 10,
    marginTop: 10,
  },
  totalText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  paymentButton: {
    backgroundColor: "#008E97",
    padding: 15,
    borderRadius: 8,
    margin: 20,
    alignItems: "center",
  },
  paymentButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default CheckoutScreen;
