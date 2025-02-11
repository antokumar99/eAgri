// import React from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TextInput,
//   TouchableOpacity,
//   Image,
//   FlatList,
//   SafeAreaView,
// } from "react-native";
// import { useNavigation } from "@react-navigation/native";

// export default function App() {
//   const navigation = useNavigation();
//   const featuredProducts = [
//     { id: 1, title: "Rice Seeds", price: "৳150/kg" },
//     { id: 2, title: "Lime", price: "৳30/pcs" },
//     { id: 3, title: "Tractor", price: "৳5000/hour" },
//     { id: 4, title: "Peas Seeds", price: "৳120/kg" },
//   ];

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* Header Section */}
//       <View style={styles.header}>
//         <View style={styles.headerLeft}>
//           <TouchableOpacity>
//             <Text style={styles.menuIcon}>☰</Text>
//           </TouchableOpacity>
//           <View>
//             <Text style={styles.greeting}>Hi Karim!</Text>
//             <Text style={styles.subGreeting}>Enjoy our services!</Text>
//           </View>
//         </View>
//         <View style={styles.headerRight}>
//           <TouchableOpacity style={styles.bellIconContainer}>
//             <Text style={styles.bellIcon}>🔔</Text>
//             <View style={styles.notificationBadge}>
//               <Text style={styles.badgeText}>3</Text>
//             </View>
//           </TouchableOpacity>
//         </View>
//       </View>

//       {/* Search Bar */}
//       <View style={styles.searchBar}>
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Search here..."
//           placeholderTextColor="#888"
//         />
//         <TouchableOpacity style={styles.filterButton}>
//           <Text style={styles.filterIcon}>⚙</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Free Consultation Section */}
//       <View style={styles.consultationCard}>
//         <View>
//           <Text style={styles.consultationTitle}>Free Consultation</Text>
//           <Text style={styles.consultationSubtitle}>
//             Get free support from our customer service
//           </Text>
//           <TouchableOpacity style={styles.callNowButton}>
//             <Text style={styles.callNowButtonText}>Call Now</Text>
//           </TouchableOpacity>
//         </View>
//         <View style={styles.consultationImage} />
//       </View>

//       {/* Featured Products Section */}
//       <View style={styles.featuredProductsHeader}>
//         <Text style={styles.featuredTitle}>Featured Products</Text>
//         <TouchableOpacity>
//           <Text style={styles.seeAllText}>See All</Text>
//         </TouchableOpacity>
//       </View>
//       <FlatList
//         data={featuredProducts}
//         numColumns={2}
//         keyExtractor={(item) => item.id.toString()}
//         columnWrapperStyle={styles.productRow}
//         renderItem={({ item }) => (
//           <View style={styles.productCard}>
//             <View style={styles.productImage} />
//             <View style={styles.productDetails}>
//               <Text style={styles.productTitle}>{item.title}</Text>
//               <Text style={styles.productPrice}>{item.price}</Text>
//             </View>
//             <View style={styles.productActions}>
//               <TouchableOpacity>
//                 <Text style={styles.bookmarkIcon}>🔖</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={styles.addButton}>
//                 <Text style={styles.addButtonText}>+</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         )}
//       />

//       {/* Bottom Navigation */}
//       {/* <View style={styles.bottomNavigation}>
//         <TouchableOpacity>
//           <Text style={styles.navIcon}>🏠</Text>
//           <Text style={styles.navText}>Home</Text>
//         </TouchableOpacity>
//         <TouchableOpacity onPress={() => navigation.navigate("Service")}>
//           <Text style={styles.navIcon}>🔧</Text>
//           <Text style={styles.navText}>Service</Text>
//         </TouchableOpacity>
//         <TouchableOpacity>
//           <Text style={styles.navIcon}>🛒</Text>
//           <Text style={styles.navText}>Cart</Text>
//         </TouchableOpacity>
//         <TouchableOpacity>
//           <Text style={styles.navIcon}>👤</Text>
//           <Text style={styles.navText}>Profile</Text>
//         </TouchableOpacity>
//       </View> */}
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#F5F5F5",
//     paddingHorizontal: 10,
//   },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginVertical: 10,
//   },
//   headerLeft: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   menuIcon: {
//     fontSize: 24,
//     marginRight: 10,
//     marginLeft: 5,
//   },
//   greeting: {
//     fontSize: 18,
//     fontWeight: "bold",
//   },
//   subGreeting: {
//     fontSize: 14,
//     color: "#888",
//   },
//   headerRight: {
//     position: "relative",
//     marginRight: 10,
//   },
//   bellIconContainer: {
//     position: "relative",
//   },
//   bellIcon: {
//     fontSize: 24,
//   },
//   notificationBadge: {
//     position: "absolute",
//     top: -5,
//     right: -5,
//     backgroundColor: "#FF0000",
//     borderRadius: 10,
//     width: 20,
//     height: 20,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   badgeText: {
//     color: "#FFF",
//     fontSize: 12,
//   },
//   searchBar: {
//     flexDirection: "row",
//     marginVertical: 10,
//     height: 50,
//     backgroundColor: "#FFF",
//     borderRadius: 25,
//     paddingHorizontal: 20,
//     alignItems: "center",
//     elevation: 3,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 16,
//   },
//   filterButton: {
//     marginLeft: 10,
//   },
//   filterIcon: {
//     fontSize: 20,
//   },
//   consultationCard: {
//     flexDirection: "row",
//     backgroundColor: "#FFF",
//     width: "80%",
//     borderRadius: 10,
//     padding: 15,
//     elevation: 3,
//     marginVertical: 10,
//   },
//   consultationTitle: {
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   consultationSubtitle: {
//     fontSize: 14,
//     color: "#888",
//     marginVertical: 5,
//   },
//   callNowButton: {
//     marginTop: 10,
//     backgroundColor: "#4CAF50",
//     borderRadius: 5,
//     paddingHorizontal: 15,
//     paddingVertical: 10,
//   },
//   callNowButtonText: {
//     color: "#FFF",
//     fontWeight: "bold",
//   },
//   consultationImage: {
//     width: 80,
//     height: 80,
//     backgroundColor: "#E0E0E0",
//     borderRadius: 10,
//     marginLeft: 5,
//   },
//   featuredProductsHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginLeft: 5,
//     marginRight: 5,
//     marginVertical: 10,
//   },
//   featuredTitle: {
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   seeAllText: {
//     fontSize: 14,
//     color: "#4CAF50",
//   },
//   productRow: {
//     justifyContent: "space-between",
//   },
//   productCard: {
//     width: "48%",
//     backgroundColor: "#FFF",
//     borderRadius: 10,
//     padding: 10,
//     elevation: 3,
//     marginBottom: 10,
//   },
//   productImage: {
//     width: "100%",
//     height: 100,
//     backgroundColor: "#E0E0E0",
//     borderRadius: 10,
//   },
//   productDetails: {
//     marginVertical: 10,
//   },
//   productTitle: {
//     fontSize: 14,
//     fontWeight: "bold",
//   },
//   productPrice: {
//     fontSize: 12,
//     color: "#4CAF50",
//   },
//   productActions: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   bookmarkIcon: {
//     fontSize: 20,
//     color: "#888",
//   },
//   addButton: {
//     backgroundColor: "#4CAF50",
//     borderRadius: 5,
//     paddingHorizontal: 10,
//     paddingVertical: 5,
//   },
//   addButtonText: {
//     color: "#FFF",
//     fontWeight: "bold",
//     fontSize: 16,
//   },
//   bottomNavigation: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//     backgroundColor: "#FFF",
//     borderTopWidth: 1,
//     marginBottom: -10,
//     borderTopColor: "#E0E0E0",
//     borderRadius: 25,
//   },
//   navIcon: {
//     fontSize: 25,
//     textAlign: "center",
//   },
//   navText: {
//     fontSize: 12,
//     textAlign: "center",
//     color: "#888",
//   },
// });

import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, StatusBar, Platform, SafeAreaView } from "react-native";
import React from 'react'
import { MaterialIcons } from "@expo/vector-icons"; // For icons
import { useState, useEffect } from "react";
import ServiceCard from "../components/ServiceCard";
import { useNavigation } from "@react-navigation/native";

function HomeScreen() {

  const [weather, setWeather] = useState(null);
  const navigation = useNavigation();

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
          onPress={() =>
            navigation.navigate("Weather", { city: "Dhaka" })
          } // Navigate to the Weather screen
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
            <ServiceCard iconName="post-add" title="Add Post" screenName="CreatePost" />
            {/* <ServiceCard iconName="person-outline" title="কৃষি পরামর্শ" screenName="AdviceScreen" /> */}
            <ServiceCard iconName="key" title="ভাড়া" screenName="RentScreen" />
          </View>
          <View style={styles.serviceRow}>
            <ServiceCard iconName="attach-money" title="ক্রয়" screenName="BuyScreen" />
            <ServiceCard iconName="shopping-cart" title="বিক্রয়" screenName="SellScreen" />
          </View>
          <View style={styles.serviceRow}>
            <ServiceCard iconName="school" title="Research" screenName="ResearchScreen" />
            <ServiceCard iconName="trending-up" title="Forum" screenName="ForumScreen" />
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
};

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
  container: { flex: 1, backgroundColor: "#f8f8f8", marginTop: 0, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0, },
  scrollviewcontainer: { flex: 1, backgroundColor: "#f8f8f8", marginBottom: 75 },
  checkImage: { backgroundColor: " #00b1ff ", marginLeft: 5 },
  header: { padding: 10, backgroundColor: "#f2f2f2", alignItems: "center" },
  statusBar: { flexDirection: "row", justifyContent: "space-between", width: "100%" },
  time: { fontSize: 12 },
  network: { fontSize: 12 },
  pageTitle: { fontSize: 20, fontWeight: "bold", marginVertical: 5 },
  highlight: { flexDirection: "row", margin: 10, padding: 10, backgroundColor: "#fff", borderRadius: 10 },
  image: { width: 150, height: 250, borderRadius: 10 },
  highlightText: { flex: 1, marginLeft: 10 },
  title: { fontSize: 16, fontWeight: "bold" },
  description: { fontSize: 14, color: "#555" },
  button: { marginTop: 5, backgroundColor: "#4CAF50", padding: 5, borderRadius: 5 },
  buttonText: { color: "#fff", textAlign: "center" },
  services: { margin: 10 },
  serviceRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 5 },
  card: { flex: 1, alignItems: "center", padding: 10, backgroundColor: "#fff", borderRadius: 10, margin: 5 },
  cardText: { marginTop: 5, fontSize: 14, fontWeight: "bold", textAlign: "center" },
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