import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { MaterialIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import api from "../services/api";

const { width } = Dimensions.get("window");

const CheckoutScreen = ({ route, navigation }) => {
  const { total, cartItems } = route.params;
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("online");
  const [address, setAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
  });

  const paymentMethods = [
    {
      id: "online",
      title: "Online Payment",
      subtitle: "Credit/Debit Card, Mobile Banking",
      icon: "credit-card",
      color: "#008E97",
    },
    {
      id: "cod",
      title: "Cash on Delivery",
      subtitle: "Pay when you receive your order",
      icon: "money",
      color: "#28a745",
    },
  ];

  // Load user profile and auto-fill address
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get("/profile");
      const user = response.data.data;

      // Auto-fill address from user profile
      if (user.address) {
        setAddress({
          street: user.address.street || "",
          city: user.address.city || "",
          state: user.address.country || "", // Using country as state
          zipCode: user.address.postalCode || "",
          phone: user.phone || "",
        });
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      Alert.alert("Error", "Failed to load user profile");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    for (let key in address) {
      if (!address[key]) {
        Alert.alert("Error", "Please fill in all address fields");
        return false;
      }
    }
    return true;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;

    try {
      setProcessing(true);

      if (selectedPaymentMethod === "cod") {
        // Handle Cash on Delivery
        await handleCashOnDelivery();
      } else {
        // Handle Online Payment
        await handleOnlinePayment();
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      Alert.alert("Error", "Failed to process payment. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleOnlinePayment = async () => {
    try {
      // Create order with payment request
      const response = await api.post("/payment", {
        address,
        total: total + 50, // Including delivery fee
        cartItems,
        paymentMethod: "Online Payment",
      });

      console.log("Payment response:", response.data);

      if (response.data.success) {
        console.log("Go to web");
        // Navigate to payment gateway
        navigation.navigate("PaymentWebView", {
          paymentUrl: response.data.paymentUrl,
          orderId: response.data.orderId,
          orderDetails: {
            total: total + 50,
            items: cartItems,
            address,
          },
        });
      } else {
        Alert.alert(
          "Error",
          response.data.message || "Failed to create payment"
        );
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      Alert.alert("Error", "Failed to process payment. Please try again.");
    }
  };

  const handleCashOnDelivery = async () => {
    try {
      // Create order for Cash on Delivery
      const response = await api.post("/orders/create", {
        address,
        total: total + 50,
        cartItems,
        paymentMethod: "Cash on Delivery",
      });

      if (response.data.success) {
        Alert.alert(
          "Order Placed Successfully!",
          "Your order has been placed. You will pay when you receive your items.",
          [
            {
              text: "View Order",
              onPress: () => {
                navigation.navigate("PaymentSuccess", {
                  orderId: response.data.orderId,
                  transactionId: `COD_${response.data.orderId}`,
                  orderDetails: {
                    total: total + 50,
                    items: cartItems,
                    address,
                  },
                });
              },
            },
            {
              text: "Continue Shopping",
              onPress: () => navigation.navigate("Main"),
            },
          ]
        );
      } else {
        Alert.alert("Error", "Failed to place order. Please try again.");
      }
    } catch (error) {
      console.error("Error creating COD order:", error);
      Alert.alert("Error", "Failed to place order. Please try again.");
    }
  };

  const renderPaymentMethod = (method) => (
    <TouchableOpacity
      key={method.id}
      style={[
        styles.paymentMethodCard,
        selectedPaymentMethod === method.id && styles.selectedPaymentMethod,
      ]}
      onPress={() => setSelectedPaymentMethod(method.id)}
    >
      <View style={styles.paymentMethodHeader}>
        <View style={[styles.paymentIcon, { backgroundColor: method.color }]}>
          <MaterialIcons name={method.icon} size={24} color="#fff" />
        </View>
        <View style={styles.paymentMethodInfo}>
          <Text style={styles.paymentMethodTitle}>{method.title}</Text>
          <Text style={styles.paymentMethodSubtitle}>{method.subtitle}</Text>
        </View>
        <View style={styles.radioButton}>
          {selectedPaymentMethod === method.id && (
            <View
              style={[styles.radioInner, { backgroundColor: method.color }]}
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#008E97" />
        <Text style={styles.loadingText}>Loading your information...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Delivery Address Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="location-on" size={20} color="#008E97" />
            <Text style={styles.sectionTitle}>Delivery Address</Text>
          </View>
          <Text style={styles.addressNote}>
            Your address has been pre-filled from your profile. You can edit it
            if needed.
          </Text>

          <View style={styles.inputGroup}>
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
        </View>

        {/* Payment Method Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="payment" size={20} color="#008E97" />
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>

          <View style={styles.paymentMethods}>
            {paymentMethods.map(renderPaymentMethod)}
          </View>
        </View>

        {/* Order Summary Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="receipt" size={20} color="#008E97" />
            <Text style={styles.sectionTitle}>Order Summary</Text>
          </View>

          <View style={styles.orderSummary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>৳{total}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>৳50</Text>
            </View>
            {selectedPaymentMethod === "cod" && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>COD Fee</Text>
                <Text style={styles.summaryValue}>৳30</Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                ৳{total + 50 + (selectedPaymentMethod === "cod" ? 30 : 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
          <Text style={styles.securityText}>
            Your payment information is secure and encrypted
          </Text>
        </View>

        {/* Payment Button */}
        <View style={styles.paymentButtonContainer}>
          <TouchableOpacity
            style={[
              styles.paymentButton,
              processing && styles.paymentButtonDisabled,
            ]}
            onPress={handlePayment}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialIcons name="payment" size={20} color="#fff" />
                <Text style={styles.paymentButtonText}>
                  {selectedPaymentMethod === "cod"
                    ? "Place Order"
                    : "Proceed to Payment"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.paymentNote}>
            By proceeding, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6c757d",
  },
  header: {
    backgroundColor: "#008E97",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginLeft: 8,
  },
  addressNote: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 16,
    fontStyle: "italic",
  },
  inputGroup: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  paymentMethods: {
    gap: 12,
  },
  paymentMethodCard: {
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#fff",
  },
  selectedPaymentMethod: {
    borderColor: "#008E97",
    backgroundColor: "#f0f9ff",
  },
  paymentMethodHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  paymentMethodInfo: {
    flex: 1,
    marginLeft: 12,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
  },
  paymentMethodSubtitle: {
    fontSize: 14,
    color: "#6c757d",
    marginTop: 2,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#e9ecef",
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  orderSummary: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 16,
    color: "#6c757d",
  },
  summaryValue: {
    fontSize: 16,
    color: "#2c3e50",
    fontWeight: "500",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#008E97",
  },
  securityNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
  },
  securityText: {
    fontSize: 12,
    color: "#6c757d",
    marginLeft: 6,
  },
  paymentButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  paymentButton: {
    backgroundColor: "#008E97",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentButtonDisabled: {
    backgroundColor: "#ccc",
  },
  paymentButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  paymentNote: {
    fontSize: 12,
    color: "#6c757d",
    textAlign: "center",
    marginTop: 12,
  },
});

export default CheckoutScreen;
