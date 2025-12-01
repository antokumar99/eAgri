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
  SafeAreaView,
  Platform,
} from "react-native";
import { MaterialIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import api from "../services/api";

const ReceivedRentals = ({ navigation }) => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");

  const statusOptions = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  useEffect(() => {
    fetchRentals();
  }, [selectedStatus]);

  const fetchRentals = async () => {
    try {
      setLoading(true);
      const params = selectedStatus !== "all" ? { status: selectedStatus } : {};
      const response = await api.get("/rentals/received", { params });
      setRentals(response.data.rentals || []);
    } catch (error) {
      console.error("Error fetching received rentals:", error);
      Alert.alert("Error", "Failed to load received rentals");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRentals();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#FFA500";
      case "active":
        return "#4CAF50";
      case "completed":
        return "#2196F3";
      case "cancelled":
        return "#F44336";
      case "overdue":
        return "#FF5722";
      default:
        return "#666";
    }
  };

  const getPaymentStatusColor = (paymentStatus) => {
    switch (paymentStatus) {
      case "paid":
        return "#4CAF50";
      case "pending":
        return "#FFA500";
      case "failed":
        return "#F44336";
      case "refunded":
        return "#2196F3";
      default:
        return "#666";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const calculateRemainingDays = (endDate, status) => {
    if (status === "active") {
      const now = new Date();
      const end = new Date(endDate);
      const diffTime = end - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    }
    return 0;
  };

  const handleRentalPress = (rental) => {
    navigation.navigate("RentalDetails", { rentalId: rental._id });
  };

  const handleUpdateStatus = async (rentalId, newStatus) => {
    try {
      await api.put(`/rentals/${rentalId}/status`, { status: newStatus });
      Alert.alert("Success", "Rental status updated successfully");
      fetchRentals(); // Refresh data
    } catch (error) {
      console.error("Error updating rental status:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to update status"
      );
    }
  };

  const showStatusUpdateDialog = (rental) => {
    const statusOptions = [
      { label: "Pending", value: "pending" },
      { label: "Active", value: "active" },
      { label: "Completed", value: "completed" },
      { label: "Cancelled", value: "cancelled" },
    ];

    Alert.alert("Update Rental Status", "Select new status:", [
      { text: "Cancel", style: "cancel" },
      ...statusOptions.map((option) => ({
        text: option.label,
        onPress: () => handleUpdateStatus(rental._id, option.value),
      })),
    ]);
  };

  const renderRentalCard = (rental) => {
    const remainingDays = calculateRemainingDays(rental.endDate, rental.status);

    return (
      <TouchableOpacity
        key={rental._id}
        style={styles.rentalCard}
        onPress={() => handleRentalPress(rental)}
      >
        <View style={styles.rentalHeader}>
          <View style={styles.productInfo}>
            <Image
              source={{ uri: rental.product.image }}
              style={styles.productImage}
            />
            <View style={styles.productDetails}>
              <Text style={styles.productName}>{rental.product.name}</Text>
              <Text style={styles.productCategory}>
                {rental.product.category}
              </Text>
              <Text style={styles.rentalPrice}>৳{rental.totalPrice}</Text>
            </View>
          </View>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(rental.status) },
              ]}
            >
              <Text style={styles.statusText}>
                {rental.status.toUpperCase()}
              </Text>
            </View>
            <View
              style={[
                styles.paymentBadge,
                {
                  backgroundColor: getPaymentStatusColor(rental.paymentStatus),
                },
              ]}
            >
              <Text style={styles.paymentText}>
                {rental.paymentStatus.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.rentalDetails}>
          <View style={styles.detailRow}>
            <MaterialIcons name="person" size={16} color="#666" />
            <Text style={styles.detailText}>Renter: {rental.user.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialIcons name="event" size={16} color="#666" />
            <Text style={styles.detailText}>
              {formatDate(rental.startDate)} - {formatDate(rental.endDate)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialIcons name="access-time" size={16} color="#666" />
            <Text style={styles.detailText}>
              {rental.duration.value} {rental.duration.unit}(s)
            </Text>
          </View>
          {rental.status === "active" && (
            <View style={styles.detailRow}>
              <MaterialIcons name="timer" size={16} color="#FFA500" />
              <Text
                style={[
                  styles.detailText,
                  { color: remainingDays <= 3 ? "#FF5722" : "#008E97" },
                ]}
              >
                {remainingDays} day(s) remaining
              </Text>
            </View>
          )}
        </View>

        <View style={styles.rentalActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleRentalPress(rental)}
          >
            <MaterialIcons name="visibility" size={16} color="#008E97" />
            <Text style={styles.actionText}>View Details</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.updateButton}
            onPress={() => showStatusUpdateDialog(rental)}
          >
            <MaterialIcons name="edit" size={16} color="#FF9800" />
            <Text style={styles.updateText}>Update Status</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#008E97" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Received Rentals</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#008E97" />
          <Text style={styles.loadingText}>Loading received rentals...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#008E97" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Received Rentals</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Status Filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {statusOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.filterButton,
                selectedStatus === option.value && styles.selectedFilter,
              ]}
              onPress={() => setSelectedStatus(option.value)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedStatus === option.value && styles.selectedFilterText,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {rentals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="inventory" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Received Rentals</Text>
            <Text style={styles.emptyText}>
              {selectedStatus === "all"
                ? "You haven't received any rental requests yet."
                : `No ${selectedStatus} received rentals found.`}
            </Text>
          </View>
        ) : (
          <View style={styles.rentalsContainer}>
            {rentals.map(renderRentalCard)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: Platform.OS === "android" ? 40 : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    color: "#008E97",
  },
  headerSpacer: {
    width: 34,
  },
  filterContainer: {
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  selectedFilter: {
    backgroundColor: "#008E97",
    borderColor: "#008E97",
  },
  filterText: {
    fontSize: 14,
    color: "#666",
  },
  selectedFilterText: {
    color: "#fff",
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 20,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#666",
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  rentalsContainer: {
    gap: 15,
  },
  rentalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  rentalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  productInfo: {
    flexDirection: "row",
    flex: 1,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  rentalPrice: {
    fontSize: 16,
    color: "#008E97",
    fontWeight: "bold",
  },
  statusContainer: {
    alignItems: "flex-end",
    gap: 5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  paymentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  rentalDetails: {
    gap: 8,
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  rentalActions: {
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 15,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  actionText: {
    fontSize: 14,
    color: "#008E97",
    fontWeight: "bold",
    marginLeft: 5,
  },
  updateButton: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  updateText: {
    fontSize: 14,
    color: "#FF9800",
    fontWeight: "bold",
    marginLeft: 5,
  },
});

export default ReceivedRentals;
