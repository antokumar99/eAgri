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
} from "react-native";
import React from "react";
import { MaterialIcons } from "@expo/vector-icons"; // For icons
import { useState, useEffect } from "react";
import ServiceCard from "../components/ServiceCard";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

function HomeScreen({ navigation }) {
  const [weather, setWeather] = useState(null);

  // Fetch current weather data
  // const fetchWeather = async () => {
  //   try {
  //     const response = await axios.get(
  //       `https://api.openweathermap.org/data/2.5/weather?q=Dhaka&units=metric&appid=YOUR_API_KEY`
  //     );
  //     setWeather(response.data);
  //   } catch (error) {
  //     console.error("Error fetching weather data:", error);
  //   }
  // };

  // useEffect(() => {
  //   fetchWeather(); // Fetch weather when the component mounts
  // }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("userToken");
      navigation.replace("Login");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollviewcontainer}>
        {/* Header */}
        {/* <View style={styles.header}>
          <View style={styles.statusBar}>
            <Text style={styles.time}>10:37 PM</Text>
            <Text style={styles.network}>4.0KB/s</Text>
            <MaterialIcons name="wifi" size={16} color="black" />
          </View>
          <Text style={styles.pageTitle}>হোম</Text>
        </View> */}

        <TouchableOpacity
          style={styles.weatherCard}
          onPress={() => navigation.navigate("Weather", { city: "Dhaka" })} // Navigate to the Weather screen
        >
          <Text style={styles.weatherTitle}>Today's Weather</Text>
          {/* {weather ? (
              <View>
                <Text style={styles.weatherTemp}>
                  {weather.main.temp}°C - {weather.weather[0].description}
                </Text>
              </View>
            ) : (
              <Text style={styles.weatherLoading}>Loading...</Text>
            )} */}
        </TouchableOpacity>

        {/* Services Section */}
        {/* <View style={styles.services}>
          <View style={styles.serviceRow}>
            <ServiceCard iconName="person-outline" title="কৃষি পরামর্শ" />
            <ServiceCard iconName="key" title="ভাড়া" />
          </View>
          <View style={styles.serviceRow}>
            <ServiceCard iconName="attach-money" title="ক্রয়" />
            <ServiceCard iconName="shopping-cart" title="বিক্রয়" />
          </View>
          <View style={styles.serviceRow}>
            <ServiceCard iconName="school" title="প্রশিক্ষণ" />
            <ServiceCard iconName="trending-up" title="বিনিয়োগ" />
          </View>
        </View> */}
        <View style={styles.services}>
          <View style={styles.serviceRow}>
            <ServiceCard
              iconName="post-add"
              title="Add Post"
              screenName="CreatePost"
            />
            {/* <ServiceCard iconName="person-outline" title="কৃষি পরামর্শ" screenName="AdviceScreen" /> */}
            <ServiceCard iconName="key" title="Rent" screenName="RentScreen" />
          </View>
          <View style={styles.serviceRow}>
            <ServiceCard
              iconName="attach-money"
              title="Marketplace"
              screenName="BuyScreen"
            />
            <ServiceCard
              iconName="shopping-cart"
              title="Sell"
              screenName="SellScreen"
            />
          </View>
          <View style={styles.serviceRow}>
            <ServiceCard
              iconName="school"
              title="Research"
              screenName="ResearchScreen"
            />
            <ServiceCard
              iconName="trending-up"
              title="Community"
              screenName="CommunityScreen"
            />
          </View>
        </View>

        {/* Bottom Navigation */}
      </ScrollView>
      {/* <View style={styles.navBar}>
        <NavItem iconName="home" title="হোম" active />
        <NavItem iconName="group" title="সেবাসমূহ" />
        <NavItem iconName="chat" title="কৃষি পরামর্শ" />
        <NavItem iconName="play-circle-outline" title="ভিডিও" />
    </View> */}
    </SafeAreaView>
  );
}

// const ServiceCard = ({ iconName, title }) => (
//   <TouchableOpacity style={styles.card}>
//     <MaterialIcons name={iconName} size={32} color="#4CAF50" />
//     <Text style={styles.cardText}>{title}</Text>
//   </TouchableOpacity>
// );

// const NavItem = ({ iconName, title, active }) => (
//   <View style={active ? styles.navItemActive : styles.navItem}>
//     <MaterialIcons name={iconName} size={24} color={active ? "#4CAF50" : "#000"} />
//     <Text style={active ? styles.navTextActive : styles.navText}>{title}</Text>
//   </View>
// );

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    marginTop: 0,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  scrollviewcontainer: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    marginBottom: 75,
  },
  checkImage: { backgroundColor: " #00b1ff ", marginLeft: 5 },
  header: { padding: 10, backgroundColor: "#f2f2f2", alignItems: "center" },
  statusBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  time: { fontSize: 12 },
  network: { fontSize: 12 },
  pageTitle: { fontSize: 20, fontWeight: "bold", marginVertical: 5 },
  highlight: {
    flexDirection: "row",
    margin: 10,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  image: { width: 150, height: 250, borderRadius: 10 },
  highlightText: { flex: 1, marginLeft: 10 },
  title: { fontSize: 16, fontWeight: "bold" },
  description: { fontSize: 14, color: "#555" },
  button: {
    marginTop: 5,
    backgroundColor: "#4CAF50",
    padding: 5,
    borderRadius: 5,
  },
  buttonText: { color: "#fff", textAlign: "center" },
  services: { margin: 10 },
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 5,
  },
  card: {
    flex: 1,
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    margin: 5,
  },
  cardText: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#ddd",
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  navItem: { alignItems: "center" },
  navItemActive: { alignItems: "center" },
  navText: { fontSize: 12, color: "#000" },
  navTextActive: { fontSize: 12, color: "#4CAF50", fontWeight: "bold" },
  weatherCard: {
    margin: 10,
    padding: 20,
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    alignItems: "center",
  },
  weatherTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  weatherTemp: { color: "#fff", fontSize: 16, marginTop: 10 },
  weatherLoading: { color: "#fff", fontSize: 14, marginTop: 10 },
});

export default HomeScreen;
