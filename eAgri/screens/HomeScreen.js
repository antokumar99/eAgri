import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  SafeAreaView,
  Animated,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { MaterialIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import ServiceCard from "../components/ServiceCard";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

function HomeScreen({ navigation }) {
  const [weather, setWeather] = useState(null);
  const [userName, setUserName] = useState("Farmer");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Animate content on mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Fetch user data
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        setUserName(user.username || user.name || "Farmer");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      navigation.replace("Login");
    } catch (error) {
      console.log(error);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>Good Morning!</Text>
          <Text style={styles.userName}>{userName}</Text>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <FontAwesome5 name="user-circle" size={30} color="#4CAF50" />
        </TouchableOpacity>
      </View>
      <Text style={styles.headerSubtitle}>Ready to grow your farm today?</Text>
    </View>
  );

  const renderWeatherCard = () => (
    <TouchableOpacity
      style={styles.weatherCard}
      onPress={() => navigation.navigate("Weather", { city: "Dhaka" })}
    >
      <View style={styles.weatherContent}>
        <View style={styles.weatherInfo}>
          <Text style={styles.weatherTitle}>Today's Weather</Text>
          <Text style={styles.weatherTemp}>28°C</Text>
          <Text style={styles.weatherDesc}>Sunny</Text>
        </View>
        <View style={styles.weatherIcon}>
          <Ionicons name="sunny" size={40} color="#FFD700" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderQuickStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <MaterialIcons name="trending-up" size={24} color="#4CAF50" />
        <Text style={styles.statNumber}>12</Text>
        <Text style={styles.statLabel}>Active Crops</Text>
      </View>
      <View style={styles.statCard}>
        <MaterialIcons name="water-drop" size={24} color="#2196F3" />
        <Text style={styles.statNumber}>85%</Text>
        <Text style={styles.statLabel}>Soil Moisture</Text>
      </View>
      <View style={styles.statCard}>
        <MaterialIcons name="wb-sunny" size={24} color="#FF9800" />
        <Text style={styles.statNumber}>6.2</Text>
        <Text style={styles.statLabel}>pH Level</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {renderHeader()}
          {renderWeatherCard()}
          {renderQuickStats()}

          <View style={styles.servicesSection}>
            <Text style={styles.sectionTitle}>Services</Text>
            <View style={styles.services}>
              <View style={styles.serviceRow}>
                <ServiceCard
                  iconName="post-add"
                  title="Add Post"
                  screenName="CreatePost"
                  color="#4CAF50"
                />
                <ServiceCard
                  iconName="key"
                  title="Rent"
                  screenName="RentScreen"
                  color="#FF9800"
                />
              </View>
              <View style={styles.serviceRow}>
                <ServiceCard
                  iconName="attach-money"
                  title="Marketplace"
                  screenName="BuyScreen"
                  color="#2196F3"
                />
                <ServiceCard
                  iconName="shopping-cart"
                  title="Sell"
                  screenName="SellScreen"
                  color="#9C27B0"
                />
              </View>
              <View style={styles.serviceRow}>
                <ServiceCard
                  iconName="school"
                  title="Research"
                  screenName="ResearchScreen"
                  color="#607D8B"
                />
                <ServiceCard
                  iconName="trending-up"
                  title="Trending"
                  screenName="TrendingScreen"
                  color="#E91E63"
                />
              </View>
            </View>
          </View>

          <View style={styles.tipsSection}>
            <Text style={styles.sectionTitle}>Today's Tips</Text>
            <View style={styles.tipCard}>
              <MaterialIcons name="lightbulb" size={24} color="#FFD700" />
              <Text style={styles.tipText}>
                Water your crops early in the morning to reduce evaporation and
                fungal growth.
              </Text>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    marginTop: 0,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    marginBottom: 75,
  },
  header: {
    padding: 20,
    backgroundColor: "#4CAF50",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  profileButton: {
    padding: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 5,
  },
  weatherCard: {
    margin: 20,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  weatherContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  weatherInfo: {
    flex: 1,
  },
  weatherTitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
  weatherTemp: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 5,
  },
  weatherDesc: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  weatherIcon: {
    alignItems: "center",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 2,
    textAlign: "center",
  },
  servicesSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 15,
  },
  services: {
    marginBottom: 10,
  },
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  tipsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  tipCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: "#2c3e50",
    lineHeight: 20,
    marginLeft: 15,
  },
});

export default HomeScreen;
