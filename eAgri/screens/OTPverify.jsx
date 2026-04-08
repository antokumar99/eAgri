import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MaterialIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import api from "../services/api";

const { width } = Dimensions.get("window");

const OTPverify = ({ route, navigation }) => {
  const {
    orderId,
    transactionId,
    orderDetails,
    paymentStatus,
    paymentUrl,
    redirectUrl,
  } = route.params || {};

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [currentStatus, setCurrentStatus] = useState(
    paymentStatus || "processing"
  );
  const [showOTPInput, setShowOTPInput] = useState(false);

  useEffect(() => {
    // Handle different payment statuses
    if (paymentStatus === "success") {
      handlePaymentSuccess();
    } else if (paymentStatus === "success_with_risk") {
      handlePaymentSuccessWithRisk();
    } else if (paymentStatus === "failed") {
      handlePaymentFailure();
    } else if (paymentStatus === "cancelled") {
      handlePaymentCancellation();
    } else {
      // Show OTP input for validation
      setShowOTPInput(true);
    }

    // Start resend timer
    startResendTimer();
  }, [paymentStatus]);

  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handlePaymentSuccess = async () => {
    try {
      setLoading(true);

      // Update order status on backend
      await api.post("/payment/success", { orderId });

      // Navigate to success screen
      navigation.replace("PaymentSuccess", {
        orderId,
        transactionId: transactionId || `SSL_${orderId}_${Date.now()}`,
        orderDetails,
      });
    } catch (error) {
      console.error("Error handling payment success:", error);
      // Still navigate to success screen even if backend update fails
      navigation.replace("PaymentSuccess", {
        orderId,
        transactionId: transactionId || `SSL_${orderId}_${Date.now()}`,
        orderDetails,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccessWithRisk = async () => {
    try {
      setLoading(true);

      // Update order status on backend
      await api.post("/payment/success-with-risk", { orderId });

      Alert.alert(
        "Payment Successful with Risk",
        "Your payment was successful but flagged for review. Additional verification may be required.",
        [
          {
            text: "Continue",
            onPress: () => {
              navigation.replace("PaymentSuccess", {
                orderId,
                transactionId: transactionId || `SSL_${orderId}_${Date.now()}`,
                orderDetails,
              });
            },
          },
          {
            text: "Contact Support",
            onPress: () => {
              Alert.alert("Contact Support", "Email: support@eagri.com");
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error handling payment success with risk:", error);
      Alert.alert(
        "Payment Successful with Risk",
        "Additional verification may be required."
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentFailure = async () => {
    try {
      setLoading(true);

      // Update order status on backend
      await api.post("/payment/fail", { orderId });

      Alert.alert(
        "Payment Failed",
        "Your payment was not completed. Please try again or contact support if the issue persists.",
        [
          {
            text: "Try Again",
            onPress: () => {
              navigation.navigate("PaymentWebView", {
                paymentUrl,
                orderId,
                orderDetails,
              });
            },
          },
          {
            text: "Contact Support",
            onPress: () => {
              // Open email or support chat
              Alert.alert("Contact Support", "Email: support@eagri.com");
            },
          },
          {
            text: "Go Back",
            onPress: () => navigation.goBack(),
            style: "cancel",
          },
        ]
      );
    } catch (error) {
      console.error("Error handling payment failure:", error);
      Alert.alert("Payment Failed", "Please try again or contact support.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentCancellation = async () => {
    try {
      setLoading(true);

      // Update order status on backend
      await api.post("/payment/cancel", { orderId });

      Alert.alert(
        "Payment Cancelled",
        "Your payment has been cancelled. You can try again anytime.",
        [
          {
            text: "Try Again",
            onPress: () => {
              navigation.navigate("PaymentWebView", {
                paymentUrl,
                orderId,
                orderDetails,
              });
            },
          },
          {
            text: "Go Back",
            onPress: () => navigation.goBack(),
            style: "cancel",
          },
        ]
      );
    } catch (error) {
      console.error("Error handling payment cancellation:", error);
      Alert.alert("Payment Cancelled", "You can try again anytime.");
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerification = async () => {
    if (!otp || otp.length < 4) {
      Alert.alert("Invalid OTP", "Please enter a valid 4-digit OTP.");
      return;
    }

    try {
      setLoading(true);

      // Verify OTP with backend
      const response = await api.post("/payment/verify-otp", {
        orderId,
        otp,
      });

      if (response.data.success) {
        // OTP verified successfully
        handlePaymentSuccess();
      } else {
        Alert.alert("Invalid OTP", "Please enter the correct OTP code.");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      Alert.alert(
        "Verification Failed",
        "Please try again or contact support."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setLoading(true);

      // Resend OTP
      await api.post("/payment/resend-otp", { orderId });

      Alert.alert(
        "OTP Resent",
        "A new OTP has been sent to your registered mobile number."
      );
      startResendTimer();
    } catch (error) {
      console.error("Error resending OTP:", error);
      Alert.alert("Error", "Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPayment = () => {
    navigation.navigate("PaymentWebView", {
      paymentUrl,
      orderId,
      orderDetails,
    });
  };

  const renderPaymentStatus = () => {
    const statusConfig = {
      success: {
        color: "#4CAF50",
        text: "Payment Successful",
        icon: "check-circle",
        message: "Your payment has been processed successfully!",
      },
      success_with_risk: {
        color: "#ff5722",
        text: "Payment Successful with Risk",
        icon: "warning",
        message:
          "Your payment was successful but flagged for review. Additional verification may be required.",
      },
      failed: {
        color: "#f44336",
        text: "Payment Failed",
        icon: "error",
        message: "Your payment was not completed. Please try again.",
      },
      cancelled: {
        color: "#ff9800",
        text: "Payment Cancelled",
        icon: "cancel",
        message: "Your payment has been cancelled. You can try again anytime.",
      },
      processing: {
        color: "#2196F3",
        text: "Processing Payment",
        icon: "hourglass-empty",
        message: "Please wait while we process your payment...",
      },
    };

    const config = statusConfig[currentStatus];
    if (!config) return null;

    return (
      <View style={styles.statusContainer}>
        <MaterialIcons name={config.icon} size={60} color={config.color} />
        <Text style={[styles.statusTitle, { color: config.color }]}>
          {config.text}
        </Text>
        <Text style={styles.statusMessage}>{config.message}</Text>
      </View>
    );
  };

  const renderOTPInput = () => {
    if (!showOTPInput) return null;

    return (
      <View style={styles.otpContainer}>
        <View style={styles.otpHeader}>
          <MaterialIcons name="security" size={24} color="#008E97" />
          <Text style={styles.otpTitle}>Verify Payment</Text>
        </View>

        <Text style={styles.otpSubtitle}>
          Enter the 4-digit OTP sent to your mobile number
        </Text>

        <View style={styles.otpInputContainer}>
          <TextInput
            style={styles.otpInput}
            value={otp}
            onChangeText={setOtp}
            placeholder="Enter OTP"
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry={false}
          />
        </View>

        <TouchableOpacity
          style={styles.verifyButton}
          onPress={handleOTPVerification}
          disabled={loading || !otp || otp.length < 4}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <MaterialIcons name="verified" size={20} color="#fff" />
              <Text style={styles.verifyButtonText}>Verify OTP</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the OTP?</Text>
          <TouchableOpacity
            onPress={handleResendOTP}
            disabled={resendTimer > 0 || loading}
            style={styles.resendButton}
          >
            <Text
              style={[
                styles.resendButtonText,
                resendTimer > 0 && styles.resendButtonDisabled,
              ]}
            >
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderActionButtons = () => {
    if (currentStatus === "processing" && !showOTPInput) {
      return (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleBackToPayment}
          >
            <MaterialIcons name="payment" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Back to Payment</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (currentStatus === "failed" || currentStatus === "cancelled") {
      return (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleBackToPayment}
          >
            <MaterialIcons name="refresh" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={20} color="#008E97" />
            <Text style={styles.secondaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  if (loading && !showOTPInput) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#008E97" />
        <Text style={styles.loadingText}>Processing...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Verification</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
          <Text style={styles.securityText}>
            Your payment is secured with SSL encryption
          </Text>
        </View>

        {/* Status Display */}
        {renderPaymentStatus()}

        {/* OTP Input */}
        {renderOTPInput()}

        {/* Action Buttons */}
        {renderActionButtons()}

        {/* Order Info */}
        {orderDetails && (
          <View style={styles.orderInfo}>
            <Text style={styles.orderInfoTitle}>Order Details</Text>
            <Text style={styles.orderInfoText}>Order ID: {orderId}</Text>
            {transactionId && (
              <Text style={styles.orderInfoText}>
                Transaction ID: {transactionId}
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: "#008E97",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 4,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  headerSpacer: {
    width: 40,
  },
  securityNotice: {
    backgroundColor: "#f8f9fa",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  securityText: {
    fontSize: 12,
    color: "#6c757d",
    marginLeft: 6,
  },
  statusContainer: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  statusMessage: {
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center",
    lineHeight: 22,
  },
  otpContainer: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  otpHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  otpTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2c3e50",
    marginLeft: 8,
  },
  otpSubtitle: {
    fontSize: 14,
    color: "#6c757d",
    textAlign: "center",
    marginBottom: 24,
  },
  otpInputContainer: {
    marginBottom: 24,
  },
  otpInput: {
    borderWidth: 2,
    borderColor: "#e9ecef",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    textAlign: "center",
    letterSpacing: 8,
    backgroundColor: "#fff",
  },
  verifyButton: {
    backgroundColor: "#008E97",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  resendContainer: {
    alignItems: "center",
  },
  resendText: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 8,
  },
  resendButton: {
    paddingVertical: 8,
  },
  resendButtonText: {
    fontSize: 14,
    color: "#008E97",
    fontWeight: "600",
  },
  resendButtonDisabled: {
    color: "#adb5bd",
  },
  actionButtons: {
    paddingHorizontal: 16,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#008E97",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#008E97",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButtonText: {
    color: "#008E97",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  orderInfo: {
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
  orderInfoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 12,
  },
  orderInfoText: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 4,
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
    color: "#2c3e50",
    fontWeight: "500",
  },
});

export default OTPverify;
