import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function WelcomeScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Check if user is logged in and navigate accordingly
    const checkLoginStatus = async () => {
      try {
        const userToken = await AsyncStorage.getItem("token");

        console.log(
          "WelcomeScreen Debug - userToken:",
          userToken ? "EXISTS" : "NOT FOUND"
        );

        // Navigate after 3 seconds
        const timer = setTimeout(() => {
          if (userToken) {
            // User is logged in, go directly to Home
            console.log("WelcomeScreen Debug - Navigating to Main (logged in)");
            navigation.replace("Main");
          } else {
            // User is not logged in, go to Onboarding
            console.log(
              "WelcomeScreen Debug - Navigating to Onboarding (not logged in)"
            );
            navigation.replace("Onboarding");
          }
        }, 3000);

        return () => clearTimeout(timer);
      } catch (error) {
        console.error("Error checking login status:", error);
        // Default to Onboarding if there's an error
        const timer = setTimeout(() => {
          navigation.replace("Onboarding");
        }, 3000);
        return () => clearTimeout(timer);
      }
    };

    checkLoginStatus();
  }, [navigation, fadeAnim, scaleAnim]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.logoContainer}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🌾</Text>
          </View>
          <Text style={styles.appName}>eAgri</Text>
          <Text style={styles.tagline}>Smart Farming Solutions</Text>
        </View>

        <View style={styles.bottomSection}>
          <Text style={styles.loadingText}>Loading...</Text>
          <View style={styles.dotsContainer}>
            <View style={[styles.dot, styles.activeDot]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#4CAF50",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 60,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  icon: {
    fontSize: 60,
  },
  appName: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  tagline: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  bottomSection: {
    alignItems: "center",
  },
  loadingText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    marginBottom: 15,
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#fff",
  },
});
