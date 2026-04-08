import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { MaterialIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import api from "../services/api";

const ReceivedOrders = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get("/orders/received");
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error("Error fetching received orders:", error);
      Alert.alert("Error", "Failed to load received orders");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "#ff9800";
      case "Processing":
        return "#2196f3";
      case "Shipped":
        return "#9c27b0";
      case "Delivered":
        return "#4caf50";
      case "Cancelled":
        return "#f44336";
      default:
        return "#757575";
    }
  };

  const getPaymentStatusColor = (paymentStatus) => {
    switch (paymentStatus) {
      case "Paid":
        return "#4caf50";
      case "Pending":
        return "#ff9800";
      case "Failed":
        return "#f44336";
      case "Cancelled":
        return "#f44336";
      case "Refunded":
        return "#9c27b0";
      default:
        return "#757575";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleOrderPress = (order) => {
    navigation.navigate("OrderDetails", { orderId: order._id });
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      Alert.alert("Success", "Order status updated successfully");
      fetchOrders(); // Refresh the orders list
    } catch (error) {
      console.error("Error updating order status:", error);
      Alert.alert("Error", "Failed to update order status");
    }
  };

  const showStatusUpdateDialog = (order) => {
    const statusOptions = [
      { label: "Processing", value: "Processing" },
      { label: "Shipped", value: "Shipped" },
      { label: "Delivered", value: "Delivered" },
    ];

    Alert.alert("Update Order Status", "Select new status for this order:", [
      ...statusOptions.map((option) => ({
        text: option.label,
        onPress: () => handleUpdateStatus(order._id, option.value),
      })),
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const renderOrderCard = (order) => (
    <TouchableOpacity
      key={order._id}
      style={styles.orderCard}
      onPress={() => handleOrderPress(order)}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>Order #{order._id.slice(-8)}</Text>
          <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
          <Text style={styles.customerName}>Customer: {order.user.name}</Text>
        </View>
        <View style={styles.orderStatus}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(order.status) },
            ]}
          >
            <Text style={styles.statusText}>{order.status}</Text>
          </View>
        </View>
      </View>

      <View style={styles.orderItems}>
        {order.products
          .filter((item) => item.product.seller._id === order.user._id)
          .slice(0, 2)
          .map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <Image
                source={{ uri: item.product.image }}
                style={styles.productImage}
                defaultSource={require("../assets/rice.jpg")}
              />
              <View style={styles.itemDetails}>
                <Text style={styles.productName} numberOfLines={2}>
                  {item.product.name}
                </Text>
                <Text style={styles.itemQuantity}>
                  Qty: {item.quantity} × ৳{item.price}
                </Text>
              </View>
            </View>
          ))}
        {order.products.filter(
          (item) => item.product.seller._id === order.user._id
        ).length > 2 && (
          <Text style={styles.moreItems}>
            +
            {order.products.filter(
              (item) => item.product.seller._id === order.user._id
            ).length - 2}{" "}
            more items
          </Text>
        )}
      </View>

      <View style={styles.orderFooter}>
        <View style={styles.paymentInfo}>
          <Text style={styles.totalAmount}>
            ৳
            {order.products
              .filter((item) => item.product.seller._id === order.user._id)
              .reduce((sum, item) => sum + item.quantity * item.price, 0)
              .toFixed(2)}
          </Text>
          <View
            style={[
              styles.paymentStatusBadge,
              { backgroundColor: getPaymentStatusColor(order.paymentStatus) },
            ]}
          >
            <Text style={styles.paymentStatusText}>{order.paymentStatus}</Text>
          </View>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.updateButton}
            onPress={() => showStatusUpdateDialog(order)}
          >
            <MaterialIcons name="edit" size={16} color="#008E97" />
            <Text style={styles.updateButtonText}>Update</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#008E97" />
        <Text style={styles.loadingText}>Loading received orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#008E97" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Received Orders</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="inbox" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>No Received Orders</Text>
            <Text style={styles.emptyText}>
              You haven't received any orders yet. When customers buy your
              products, they will appear here!
            </Text>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => navigation.navigate("SellScreen")}
            >
              <Text style={styles.shopButtonText}>Add Products</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.ordersContainer}>
            {orders.map(renderOrderCard)}
          </View>
        )}
      </ScrollView>
    </View>
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
  backButton: {
    padding: 8,
    borderRadius: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#2c3e50",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  shopButton: {
    backgroundColor: "#008E97",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  shopButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  ordersContainer: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
  },
  orderDate: {
    fontSize: 14,
    color: "#6c757d",
    marginTop: 2,
  },
  customerName: {
    fontSize: 14,
    color: "#008E97",
    marginTop: 2,
    fontWeight: "500",
  },
  orderStatus: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  orderItems: {
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2c3e50",
    marginBottom: 2,
  },
  itemQuantity: {
    fontSize: 12,
    color: "#6c757d",
  },
  moreItems: {
    fontSize: 12,
    color: "#008E97",
    fontStyle: "italic",
    marginTop: 4,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  paymentInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginRight: 12,
  },
  paymentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  paymentStatusText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  updateButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#008E97",
  },
  updateButtonText: {
    fontSize: 12,
    color: "#008E97",
    fontWeight: "600",
    marginLeft: 4,
  },
});

export default ReceivedOrders;
