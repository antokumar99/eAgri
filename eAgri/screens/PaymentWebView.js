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
  const [verifying, setVerifying] = useState(false);
  const webViewRef = useRef(null);
  // Guards against the outcome being handled twice: onNavigationStateChange
  // fires repeatedly for the same URL as the page loads.
  const settledRef = useRef(false);

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

    // Only the backend's own result page ends the flow. Matching on loose
    // substrings like "success" or "cancel" used to fire on the gateway's own
    // internal pages (e.g. a "cancel" link on the card form), aborting live
    // payments and, worse, declaring unpaid orders complete.
    const match = url.match(/\/payment\/result\?[^#]*\bstatus=(success|fail|cancel)\b/);
    if (!match || settledRef.current) return;

    settledRef.current = true;
    finalizePayment(match[1]);
  };

  /**
   * The redirect only tells us where the browser landed. The order's real state
   * lives on the server, which validated the transaction with SSLCommerz, so we
   * confirm against it before showing a receipt.
   */
  const finalizePayment = async (urlStatus) => {
    setVerifying(true);

    let confirmed = urlStatus;
    let order = null;

    try {
      const { data } = await api.get(`/payment/status/${orderId}`);
      order = data;

      if (data.paymentStatus === "Paid") {
        confirmed = "success";
      } else if (data.paymentStatus === "Cancelled") {
        confirmed = "cancel";
      } else if (data.paymentStatus === "Failed") {
        confirmed = "fail";
      } else if (urlStatus === "success") {
        // Landed on success but the server has not recorded payment yet. Treat
        // it as pending rather than claiming the order is paid.
        confirmed = "pending";
      }
    } catch (error) {
      console.error("Could not verify payment status:", error);
      if (urlStatus === "success") confirmed = "pending";
    } finally {
      setVerifying(false);
    }

    if (confirmed === "success") {
      setPaymentStatus("success");

      if (order?.kind === "rental" || orderDetails?.rentalId) {
        Alert.alert("Payment Successful", "Your rental is confirmed.", [
          {
            text: "View Rental",
            onPress: () =>
              navigation.replace("RentalDetails", { rentalId: orderId }),
          },
        ]);
        return;
      }

      navigation.replace("PaymentSuccess", {
        orderId,
        transactionId: order?.transactionId,
        paymentMethod: "Online Payment",
        orderDetails: { ...orderDetails, total: order?.totalPrice },
      });
      return;
    }

    if (confirmed === "pending") {
      setPaymentStatus("processing");
      Alert.alert(
        "Payment Pending",
        "We have not received confirmation from the bank yet. Your order will update automatically once it arrives — you can check it under My Orders.",
        [{ text: "View My Orders", onPress: () => navigation.replace("MyOrders") }]
      );
      return;
    }

    setPaymentStatus(confirmed === "cancel" ? "cancelled" : "failed");
    Alert.alert(
      confirmed === "cancel" ? "Payment Cancelled" : "Payment Failed",
      confirmed === "cancel"
        ? "Your payment was cancelled. Your cart has been kept."
        : "Your payment was not completed and you have not been charged.",
      [
        {
          text: "Back to Cart",
          onPress: () => navigation.replace("Cart"),
        },
        {
          text: "Marketplace",
          onPress: () => navigation.replace("BuyScreen"),
        },
      ]
    );
  };

  const handlePaymentCancellation = () => {
    if (settledRef.current) return;
    settledRef.current = true;
    finalizePayment("cancel");
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
          onPress: handlePaymentCancellation,
          style: "destructive",
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

      {/* Loading / verification overlay */}
      {(loading || verifying) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#008E97" />
          <Text style={styles.loadingText}>
            {verifying ? "Confirming your payment..." : "Loading payment gateway..."}
          </Text>
          {verifying && (
            <Text style={styles.loadingSubtext}>
              Please don't close this screen
            </Text>
          )}
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
    // Centred with flex rather than a percentage top/left plus a fixed pixel
    // translate, which only lined up by accident at one screen size.
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
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
});

export default PaymentWebView;
