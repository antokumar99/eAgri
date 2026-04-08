import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  BackHandler,
} from "react-native";
import { MaterialIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import api from "../services/api";

const { width } = Dimensions.get("window");

const PaymentSuccessScreen = ({ route, navigation }) => {
  const { orderId, transactionId, orderDetails } = route.params || {};

  // Prevent going back with hardware back button or swipe gesture
  useEffect(() => {
    const backAction = () => {
      // Show alert asking user to choose marketplace or cart
      Alert.alert("Navigation", "Where would you like to go?", [
        {
          text: "Marketplace",
          onPress: () => navigation.replace("BuyScreen"),
        },
        {
          text: "Cart",
          onPress: () => navigation.replace("Cart"),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]);
      return true; // Prevent default back action
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    // Configure navigation options to disable swipe gesture
    navigation.setOptions({
      gestureEnabled: false, // Disable swipe gesture
      headerLeft: null, // Remove back button
    });

    return () => backHandler.remove();
  }, [navigation]);

  const handleTrackOrder = () => {
    // Navigate to order tracking screen
    navigation.navigate("OrderTracking", { orderId });
  };

  const handleViewOrders = () => {
    // Navigate to orders list
    navigation.navigate("MyOrders");
  };

  const handleContinueShopping = () => {
    // Navigate to marketplace (BuyScreen)
    navigation.navigate("BuyScreen");
  };

  const handleGoToHome = () => {
    // Navigate to home screen
    navigation.navigate("Main");
  };

  // const handleDownloadReceipt = async () => {
  //   try {
  //     // Generate and download receipt
  //     const response = await api.get(`/orders/${orderId}/receipt`);
  //     // Handle receipt download
  //     Alert.alert(
  //       "Receipt Downloaded",
  //       "Your receipt has been saved to your device."
  //     );
  //   } catch (error) {
  //     Alert.alert("Error", "Failed to download receipt. Please try again.");
  //   }
  // };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Payment Success</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Success Header */}
      <View style={styles.successHeader}>
        <View style={styles.successIconContainer}>
          <MaterialIcons name="check-circle" size={80} color="#4CAF50" />
        </View>
        <Text style={styles.successTitle}>Payment Successful!</Text>
        <Text style={styles.successSubtitle}>
          Your order has been placed successfully
        </Text>
      </View>

      {/* Order Details Card */}
      <View style={styles.orderCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="receipt-outline" size={24} color="#008E97" />
          <Text style={styles.cardTitle}>Order Details</Text>
        </View>

        <View style={styles.orderInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Order ID:</Text>
            <Text style={styles.infoValue}>{orderId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Transaction ID:</Text>
            <Text style={styles.infoValue}>{transactionId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payment Method:</Text>
            <Text style={styles.infoValue}>Online Payment</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>Processing</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Estimated Delivery */}
      <View style={styles.deliveryCard}>
        <View style={styles.cardHeader}>
          <FontAwesome5 name="truck" size={20} color="#008E97" />
          <Text style={styles.cardTitle}>Estimated Delivery</Text>
        </View>
        <Text style={styles.deliveryText}>3-5 business days</Text>
        <Text style={styles.deliveryNote}>
          You'll receive updates via email and SMS
        </Text>
      </View>

      {/* Quick Navigation Buttons */}
      <View style={styles.quickNavContainer}>
        <Text style={styles.quickNavTitle}>Where would you like to go?</Text>
        <View style={styles.quickNavButtons}>
          <TouchableOpacity
            style={[styles.quickNavButton, styles.marketplaceButton]}
            onPress={handleGoToHome}
          >
            <MaterialIcons name="home" size={20} color="#fff" />
            <Text style={styles.quickNavButtonText}>Home</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleTrackOrder}
        >
          <MaterialIcons name="location-on" size={20} color="#fff" />
          <Text style={styles.buttonText}>Track Order</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleViewOrders}
        >
          <MaterialIcons name="list" size={20} color="#008E97" />
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            View All Orders
          </Text>
        </TouchableOpacity>

        {/* <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleDownloadReceipt}
        >
          <MaterialIcons name="download" size={20} color="#008E97" />
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            Download Receipt
          </Text>
        </TouchableOpacity> */}

        <TouchableOpacity
          style={[styles.button, styles.continueButton]}
          onPress={handleContinueShopping}
        >
          <MaterialIcons name="shopping-cart" size={20} color="#fff" />
          <Text style={styles.buttonText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>

      {/* Support Info */}
      <View style={styles.supportCard}>
        <Text style={styles.supportTitle}>Need Help?</Text>
        <Text style={styles.supportText}>
          Contact our customer support team
        </Text>
        <TouchableOpacity style={styles.supportButton}>
          <MaterialIcons name="support-agent" size={20} color="#008E97" />
          <Text style={styles.supportButtonText}>Contact Support</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
  },
  headerSpacer: {
    width: 40,
  },
  successHeader: {
    backgroundColor: "#fff",
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center",
  },
  orderCard: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginLeft: 8,
  },
  orderInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 14,
    color: "#6c757d",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#2c3e50",
    fontWeight: "600",
  },
  statusContainer: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    color: "#1976d2",
    fontSize: 12,
    fontWeight: "600",
  },
  deliveryCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deliveryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 4,
  },
  deliveryNote: {
    fontSize: 14,
    color: "#6c757d",
  },
  quickNavContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickNavTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 12,
    textAlign: "center",
  },
  quickNavButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  quickNavButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: "center",
  },
  marketplaceButton: {
    backgroundColor: "#008E97",
  },
  cartButton: {
    backgroundColor: "#ffc107",
  },
  quickNavButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  actionButtons: {
    paddingHorizontal: 16,
    gap: 12,
  },
  button: {
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
  primaryButton: {
    backgroundColor: "#008E97",
  },
  secondaryButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#008E97",
  },
  continueButton: {
    backgroundColor: "#28a745",
    marginTop: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: "#008E97",
  },
  supportCard: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 8,
  },
  supportText: {
    fontSize: 14,
    color: "#6c757d",
    textAlign: "center",
    marginBottom: 16,
  },
  supportButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#008E97",
  },
  supportButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#008E97",
    marginLeft: 8,
  },
});

export default PaymentSuccessScreen;
