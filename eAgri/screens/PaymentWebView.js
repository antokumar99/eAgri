import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  SafeAreaView,
  BackHandler,
  Linking,
} from "react-native";
import { WebView } from "react-native-webview";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import api from "../services/api";

const PaymentWebView = ({ route, navigation }) => {
  const { paymentUrl, orderId, orderDetails } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [webViewKey, setWebViewKey] = useState(0);
  const [currentUrl, setCurrentUrl] = useState("");
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("processing"); // processing, success, failed, cancelled
  const webViewRef = useRef(null);

  // Handle back button
  useEffect(() => {
    const backAction = () => {
      if (canGoBack) {
        webViewRef.current?.goBack();
        return true;
      } else {
        handlePaymentCancellation();
        return true;
      }
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [canGoBack]);

  const handleNavigationStateChange = (navState) => {
    const { url, canGoBack: canBack, canGoForward: canForward } = navState;
    setCurrentUrl(url);
    setCanGoBack(canBack);
    setCanGoForward(canForward);

    console.log("WebView URL changed:", url);

    // Check for SSLCommerz success URLs
    if (
      url.includes("payment/success") ||
      url.includes("success") ||
      url.includes("payment-success") ||
      url.includes("payment_success")
    ) {
      handlePaymentSuccess();
      return;
    }

    // Check for SSLCommerz failure URLs
    if (
      url.includes("payment/fail") ||
      url.includes("fail") ||
      url.includes("payment-failure") ||
      url.includes("payment_failure")
    ) {
      handlePaymentFailure();
      return;
    }

    // Check for SSLCommerz cancellation URLs
    if (
      url.includes("payment/cancel") ||
      url.includes("cancel") ||
      url.includes("payment-cancelled") ||
      url.includes("payment_cancelled")
    ) {
      handlePaymentCancellation();
      return;
    }

    // Check for SSLCommerz validation URLs
    if (url.includes("validation") || url.includes("verify")) {
      handlePaymentValidation();
      return;
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      setPaymentStatus("success");

      // Navigate directly to PaymentSuccess screen, bypassing OTP verification
      navigation.replace("PaymentSuccess", {
        orderId,
        transactionId: `SSL_${orderId}_${Date.now()}`,
        orderDetails,
      });
    } catch (error) {
      console.error("Error handling payment success:", error);
      // Still navigate to PaymentSuccess screen even if backend update fails
      navigation.replace("PaymentSuccess", {
        orderId,
        transactionId: `SSL_${orderId}_${Date.now()}`,
        orderDetails,
      });
    }
  };

  const handlePaymentFailure = async () => {
    try {
      setPaymentStatus("failed");

      // Navigate to marketplace with error message
      Alert.alert(
        "Payment Failed",
        "Your payment was not completed. Please try again.",
        [
          {
            text: "Go to Marketplace",
            onPress: () => navigation.replace("BuyScreen"),
          },
          {
            text: "Go to Cart",
            onPress: () => navigation.replace("Cart"),
          },
        ]
      );
    } catch (error) {
      console.error("Error handling payment failure:", error);
      // Still navigate to marketplace
      navigation.replace("BuyScreen");
    }
  };

  const handlePaymentCancellation = async () => {
    try {
      setPaymentStatus("cancelled");

      // Navigate to marketplace with cancellation message
      Alert.alert(
        "Payment Cancelled",
        "Your payment was cancelled. You can try again anytime.",
        [
          {
            text: "Go to Marketplace",
            onPress: () => navigation.replace("BuyScreen"),
          },
          {
            text: "Go to Cart",
            onPress: () => navigation.replace("Cart"),
          },
        ]
      );
    } catch (error) {
      console.error("Error handling payment cancellation:", error);
      // Still navigate to marketplace
      navigation.replace("BuyScreen");
    }
  };

  const handlePaymentValidation = () => {
    // Navigate to OTP verification for validation
    navigation.replace("VerifyOTP", {
      orderId,
      orderDetails,
      paymentStatus: "processing",
      paymentUrl,
    });
  };

  const handleError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error("WebView error:", nativeEvent);

    Alert.alert(
      "Connection Error",
      "Failed to load payment page. Please check your internet connection and try again.",
      [
        {
          text: "Retry",
          onPress: () => {
            setWebViewKey((prev) => prev + 1);
          },
        },
        {
          text: "Go Back",
          onPress: () => navigation.goBack(),
          style: "cancel",
        },
      ]
    );
  };

  const handleGoBack = () => {
    if (canGoBack) {
      webViewRef.current?.goBack();
    } else {
      handlePaymentCancellation();
    }
  };

  const handleGoForward = () => {
    if (canGoForward) {
      webViewRef.current?.goForward();
    }
  };

  const handleRefresh = () => {
    setWebViewKey((prev) => prev + 1);
  };

  const handleClose = () => {
    Alert.alert(
      "Cancel Payment",
      "Are you sure you want to cancel this payment?",
      [
        {
          text: "Continue Payment",
          style: "cancel",
        },
        {
          text: "Cancel Payment",
          onPress: () => {
            navigation.replace("VerifyOTP", {
              orderId,
              orderDetails,
              paymentStatus: "cancelled",
              paymentUrl,
            });
          },
          style: "destructive",
        },
      ]
    );
  };

  // Manual payment status buttons for testing
  const handleManualSuccess = () => {
    navigation.replace("PaymentSuccess", {
      orderId,
      transactionId: `SSL_${orderId}_${Date.now()}`,
      orderDetails,
    });
  };

  const handleManualFailed = () => {
    Alert.alert(
      "Payment Failed",
      "Your payment was not completed. Please try again.",
      [
        {
          text: "Go to Marketplace",
          onPress: () => navigation.replace("BuyScreen"),
        },
        {
          text: "Go to Cart",
          onPress: () => navigation.replace("Cart"),
        },
      ]
    );
  };

  const handleManualCancelled = () => {
    Alert.alert(
      "Payment Cancelled",
      "Your payment was cancelled. You can try again anytime.",
      [
        {
          text: "Go to Marketplace",
          onPress: () => navigation.replace("BuyScreen"),
        },
        {
          text: "Go to Cart",
          onPress: () => navigation.replace("Cart"),
        },
      ]
    );
  };

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#008E97" />
      <Text style={styles.loadingText}>Loading payment gateway...</Text>
      <Text style={styles.loadingSubtext}>
        Please wait while we secure your payment
      </Text>
    </View>
  );

  const renderPaymentStatus = () => {
    if (paymentStatus === "processing") return null;

    const statusConfig = {
      success: {
        color: "#4CAF50",
        text: "Payment Successful",
        icon: "check-circle",
      },
      failed: { color: "#f44336", text: "Payment Failed", icon: "error" },
      cancelled: {
        color: "#ff9800",
        text: "Payment Cancelled",
        icon: "cancel",
      },
    };

    const config = statusConfig[paymentStatus];
    if (!config) return null;

    return (
      <View style={[styles.statusOverlay, { backgroundColor: config.color }]}>
        <MaterialIcons name={config.icon} size={40} color="#fff" />
        <Text style={styles.statusText}>{config.text}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
          <MaterialIcons name="close" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerTitle}>
          <MaterialIcons name="payment" size={20} color="#fff" />
          <Text style={styles.headerTitleText}>Secure Payment</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleGoBack}
            style={[
              styles.headerButton,
              !canGoBack && styles.headerButtonDisabled,
            ]}
            disabled={!canGoBack}
          >
            <MaterialIcons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleGoForward}
            style={[
              styles.headerButton,
              !canGoForward && styles.headerButtonDisabled,
            ]}
            disabled={!canGoForward}
          >
            <MaterialIcons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleRefresh} style={styles.headerButton}>
            <MaterialIcons name="refresh" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Security Notice */}
      <View style={styles.securityNotice}>
        <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
        <Text style={styles.securityText}>
          Your payment is secured with SSL encryption
        </Text>
      </View>

      {/* WebView */}
      <View style={styles.webviewContainer}>
        {paymentUrl ? (
          <WebView
            ref={webViewRef}
            key={webViewKey}
            source={{ uri: paymentUrl }}
            style={styles.webview}
            onNavigationStateChange={handleNavigationStateChange}
            onError={handleError}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={renderLoading}
            scalesPageToFit={true}
            allowsBackForwardNavigationGestures={true}
            userAgent="eAgri-Payment-App/1.0"
            onShouldStartLoadWithRequest={(request) => {
              // Allow all navigation within the payment domain
              return true;
            }}
          />
        ) : (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error" size={60} color="#f44336" />
            <Text style={styles.errorTitle}>Payment URL Not Available</Text>
            <Text style={styles.errorText}>
              Unable to load payment gateway. Please try again.
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.retryButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        )}

        {renderPaymentStatus()}
      </View>

      {/* Manual Payment Status Buttons - For Testing */}
      <View style={styles.manualButtonsContainer}>
        <Text style={styles.manualButtonsTitle}>Test Payment Status:</Text>
        <View style={styles.manualButtonsRow}>
          <TouchableOpacity
            style={[styles.manualButton, styles.successButton]}
            onPress={handleManualSuccess}
          >
            <MaterialIcons name="check-circle" size={16} color="#fff" />
            <Text style={styles.manualButtonText}>Success</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.manualButton, styles.failedButton]}
            onPress={handleManualFailed}
          >
            <MaterialIcons name="error" size={16} color="#fff" />
            <Text style={styles.manualButtonText}>Failed</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.manualButton, styles.cancelledButton]}
            onPress={handleManualCancelled}
          >
            <MaterialIcons name="cancel" size={16} color="#fff" />
            <Text style={styles.manualButtonText}>Cancelled</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#008E97" />
          <Text style={styles.loadingText}>Processing payment...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#008E97",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    padding: 8,
    borderRadius: 4,
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitleText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
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
  webviewContainer: {
    flex: 1,
    position: "relative",
  },
  webview: {
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
    color: "#2c3e50",
    fontWeight: "500",
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#6c757d",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2c3e50",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#008E97",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  statusOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -50 }, { translateY: -50 }],
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  statusText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  manualButtonsContainer: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  manualButtonsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 12,
    textAlign: "center",
  },
  manualButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  manualButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 80,
    justifyContent: "center",
  },
  successButton: {
    backgroundColor: "#4CAF50",
  },
  failedButton: {
    backgroundColor: "#f44336",
  },
  cancelledButton: {
    backgroundColor: "#ff9800",
  },
  riskButton: {
    backgroundColor: "#ff5722",
  },
  manualButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
});

export default PaymentWebView;
