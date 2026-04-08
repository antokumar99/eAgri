import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from "react-native";
import { MaterialIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import api from "../services/api";

const RentalDetailsScreen = ({ route, navigation }) => {
  const { rentalId } = route.params;
  const [rental, setRental] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRentalDetails();
  }, []);

  const fetchRentalDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/rentals/${rentalId}`);
      setRental(response.data.rental);
    } catch (error) {
      console.error("Error fetching rental details:", error);
      Alert.alert("Error", "Failed to load rental details");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      setActionLoading(true);
      await api.put(`/rentals/${rentalId}/status`, { status: newStatus });
      Alert.alert("Success", "Rental status updated successfully");
      fetchRentalDetails(); // Refresh data
    } catch (error) {
      console.error("Error updating rental status:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to update status"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtendRental = () => {
    Alert.prompt(
      "Extend Rental",
      "Enter additional duration:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Extend",
          onPress: async (additionalDuration) => {
            if (!additionalDuration || isNaN(additionalDuration)) {
              Alert.alert("Error", "Please enter a valid number");
              return;
            }
            try {
              setActionLoading(true);
              await api.put(`/rentals/${rentalId}/extend`, {
                additionalDuration: parseInt(additionalDuration),
                durationUnit: rental.duration.unit,
              });
              Alert.alert("Success", "Rental extended successfully");
              fetchRentalDetails();
            } catch (error) {
              console.error("Error extending rental:", error);
              Alert.alert(
                "Error",
                error.response?.data?.message || "Failed to extend rental"
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
      "plain-text"
    );
  };

  const handleCancelRental = () => {
    Alert.alert(
      "Cancel Rental",
      "Are you sure you want to cancel this rental?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              setActionLoading(true);
              await api.put(`/rentals/${rentalId}/cancel`);
              Alert.alert("Success", "Rental cancelled successfully");
              navigation.goBack();
            } catch (error) {
              console.error("Error cancelling rental:", error);
              Alert.alert(
                "Error",
                error.response?.data?.message || "Failed to cancel rental"
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCompleteRental = () => {
    Alert.alert(
      "Complete Rental",
      "Are you sure you want to mark this rental as completed?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              setActionLoading(true);
              await api.put(`/rentals/${rentalId}/complete`);
              Alert.alert("Success", "Rental completed successfully");
              fetchRentalDetails();
            } catch (error) {
              console.error("Error completing rental:", error);
              Alert.alert(
                "Error",
                error.response?.data?.message || "Failed to complete rental"
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
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
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateRemainingDays = () => {
    if (rental.status === "active") {
      const now = new Date();
      const end = new Date(rental.endDate);
      const diffTime = end - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    }
    return 0;
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
          <Text style={styles.headerTitle}>Rental Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#008E97" />
          <Text style={styles.loadingText}>Loading rental details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!rental) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#008E97" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rental Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Rental not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const remainingDays = calculateRemainingDays();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#008E97" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rental Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* Product Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Information</Text>
          <View style={styles.productCard}>
            <Image
              source={{ uri: rental.product.image }}
              style={styles.productImage}
            />
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{rental.product.name}</Text>
              <Text style={styles.productCategory}>
                {rental.product.category}
              </Text>
              <Text style={styles.productPrice}>
                ৳{rental.product.rentPrice}/day
              </Text>
            </View>
          </View>
        </View>

        {/* Rental Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rental Status</Text>
          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Status:</Text>
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
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Payment:</Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: getPaymentStatusColor(
                      rental.paymentStatus
                    ),
                  },
                ]}
              >
                <Text style={styles.statusText}>
                  {rental.paymentStatus.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Rental Period */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rental Period</Text>
          <View style={styles.periodContainer}>
            <View style={styles.periodItem}>
              <MaterialIcons name="event" size={20} color="#008E97" />
              <View style={styles.periodText}>
                <Text style={styles.periodLabel}>Start Date</Text>
                <Text style={styles.periodValue}>
                  {formatDate(rental.startDate)}
                </Text>
              </View>
            </View>
            <View style={styles.periodItem}>
              <MaterialIcons name="event-available" size={20} color="#008E97" />
              <View style={styles.periodText}>
                <Text style={styles.periodLabel}>End Date</Text>
                <Text style={styles.periodValue}>
                  {formatDate(rental.endDate)}
                </Text>
              </View>
            </View>
            <View style={styles.periodItem}>
              <MaterialIcons name="access-time" size={20} color="#008E97" />
              <View style={styles.periodText}>
                <Text style={styles.periodLabel}>Duration</Text>
                <Text style={styles.periodValue}>
                  {rental.duration.value} {rental.duration.unit}(s)
                </Text>
              </View>
            </View>
            {rental.status === "active" && (
              <View style={styles.periodItem}>
                <MaterialIcons name="timer" size={20} color="#FFA500" />
                <View style={styles.periodText}>
                  <Text style={styles.periodLabel}>Remaining</Text>
                  <Text
                    style={[
                      styles.periodValue,
                      { color: remainingDays <= 3 ? "#FF5722" : "#008E97" },
                    ]}
                  >
                    {remainingDays} day(s)
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Payment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          <View style={styles.paymentContainer}>
            <View style={styles.paymentItem}>
              <Text style={styles.paymentLabel}>Total Amount:</Text>
              <Text style={styles.paymentValue}>৳{rental.totalPrice}</Text>
            </View>
            <View style={styles.paymentItem}>
              <Text style={styles.paymentLabel}>Payment Method:</Text>
              <Text style={styles.paymentValue}>{rental.paymentMethod}</Text>
            </View>
            {rental.transactionId && (
              <View style={styles.paymentItem}>
                <Text style={styles.paymentLabel}>Transaction ID:</Text>
                <Text style={styles.paymentValue}>{rental.transactionId}</Text>
              </View>
            )}
            {rental.lateFees > 0 && (
              <View style={styles.paymentItem}>
                <Text style={styles.paymentLabel}>Late Fees:</Text>
                <Text style={[styles.paymentValue, { color: "#FF5722" }]}>
                  ৳{rental.lateFees}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* User Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Information</Text>
          <View style={styles.userContainer}>
            <View style={styles.userItem}>
              <Text style={styles.userLabel}>Renter:</Text>
              <Text style={styles.userValue}>{rental.user.name}</Text>
            </View>
            <View style={styles.userItem}>
              <Text style={styles.userLabel}>Seller:</Text>
              <Text style={styles.userValue}>{rental.seller.name}</Text>
              <Text style={styles.userLabel}>Contact:</Text>
              <Text style={styles.userValue}>{rental.seller.contact}</Text>
            </View>
          </View>
        </View>

        {/* Shipping Address */}
        {rental.shippingAddress &&
          Object.keys(rental.shippingAddress).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Shipping Address</Text>
              <View style={styles.addressContainer}>
                <Text style={styles.addressText}>
                  {rental.shippingAddress.street}, {rental.shippingAddress.city}
                </Text>
                <Text style={styles.addressText}>
                  {rental.shippingAddress.state},{" "}
                  {rental.shippingAddress.zipCode}
                </Text>
                <Text style={styles.addressText}>
                  {rental.shippingAddress.country}
                </Text>
              </View>
            </View>
          )}

        {/* Notes */}
        {rental.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{rental.notes}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.actionContainer}>
            {rental.status === "pending" && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.activateButton]}
                  onPress={() => handleUpdateStatus("active")}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <MaterialIcons name="play-arrow" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>
                        Activate Rental
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={handleCancelRental}
                  disabled={actionLoading}
                >
                  <MaterialIcons name="cancel" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Cancel Rental</Text>
                </TouchableOpacity>
              </>
            )}

            {rental.status === "active" && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.extendButton]}
                  onPress={handleExtendRental}
                  disabled={actionLoading}
                >
                  <MaterialIcons name="add" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Extend Rental</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.completeButton]}
                  onPress={handleCompleteRental}
                  disabled={actionLoading}
                >
                  <MaterialIcons name="check" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Complete Rental</Text>
                </TouchableOpacity>
              </>
            )}

            {rental.status === "completed" && (
              <View style={styles.completedContainer}>
                <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
                <Text style={styles.completedText}>
                  Rental completed on {formatDate(rental.returnedAt)}
                </Text>
              </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#666",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#008E97",
  },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  productCategory: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 16,
    color: "#008E97",
    fontWeight: "bold",
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusLabel: {
    fontSize: 16,
    marginRight: 10,
    color: "#666",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  periodContainer: {
    gap: 15,
  },
  periodItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  periodText: {
    marginLeft: 10,
    flex: 1,
  },
  periodLabel: {
    fontSize: 14,
    color: "#666",
  },
  periodValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#008E97",
  },
  paymentContainer: {
    gap: 10,
  },
  paymentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentLabel: {
    fontSize: 16,
    color: "#666",
  },
  paymentValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#008E97",
  },
  userContainer: {
    gap: 10,
  },
  userItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userLabel: {
    fontSize: 16,
    color: "#666",
  },
  userValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#008E97",
  },
  addressContainer: {
    gap: 5,
  },
  addressText: {
    fontSize: 16,
    color: "#666",
  },
  notesText: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
  },
  actionContainer: {
    gap: 10,
  },
  actionButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  activateButton: {
    backgroundColor: "#4CAF50",
  },
  extendButton: {
    backgroundColor: "#FF9800",
  },
  completeButton: {
    backgroundColor: "#2196F3",
  },
  cancelButton: {
    backgroundColor: "#F44336",
  },
  completedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  completedText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "bold",
  },
});

export default RentalDetailsScreen;
