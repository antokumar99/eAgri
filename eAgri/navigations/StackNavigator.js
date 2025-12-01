import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "../screens/HomeScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import WelcomeScreen from "../screens/WelcomeScreen";
import LoginScreen from "../screens/LoginScreen";
import { useState } from "react";
import { useEffect } from "react";
import RegisterScreen from "../screens/RegisterScreen";
import RentScreen from "../screens/RentScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { AntDesign, Entypo, Fontisto, FontAwesome5 } from "@expo/vector-icons";
import ProfileScreen from "../screens/ProfileScreen";
import CommunityScreen from "../screens/CommunityScreen";
import WeatherScreen from "../screens/WeatherScreen";
import { Ionicons } from "@expo/vector-icons";
import CreatePostScreen from "../screens/CreatePostScreen";
import PostDetailsScreen from "../screens/PostDetailsScreen";
import AddPostScreen from "../screens/AddPostScreen";
import BuyScreen from "../screens/BuyScreen";
import ProductDetailsScreen from "../screens/ProductDetailsScreen";
import ResearchScreen from "../screens/ResearchScreen";
import ForumScreen from "../screens/ForumScreen";
import AddressEditScreen from "../screens/AddressEditScreen";
import PaymentWebView from "../screens/PaymentWebView";
import SellScreen from "../screens/SellScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import AdminLogin from "../screens/AdminLogin";
import AdminRegister from "../screens/AdminRegister";
import AdminDashboard from "../screens/AdminDashboard";
import CartScreen from "../screens/CartScreen";
import CheckoutScreen from "../screens/CheckoutScreen";
import AddProductScreen from "../screens/AddProductScreen";
import EditProductScreen from "../screens/EditProductScreen";
import UpdatePostScreen from "../screens/UpdatePostScreen";
import CommentScreen from "../screens/CommentScreen";
import TrendingScreen from "../screens/TrendingScreen";
import PeopleProfileScreen from "../screens/PeopleProfileScreen";
import ChatScreen from "../screens/ChatScreen";
import MessagesScreen from "../screens/MessagesScreen";
import OTPverify from "../screens/OTPverify";
import PaymentSuccessScreen from "../screens/PaymentSuccessScreen";
import MyOrders from "../screens/MyOrders";
import ReceivedOrders from "../screens/ReceivedOrders";
import MyRentals from "../screens/MyRentals";
import ReceivedRentals from "../screens/ReceivedRentals";
import RentalDetailsScreen from "../screens/RentalDetailsScreen";
import ReviewsScreen from "../screens/ReviewsScreen";

const StackNavigator = () => {
  const Stack = createStackNavigator();
  const [initialRoute, setInitialRoute] = useState("Welcome");
  const Tab = createBottomTabNavigator();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAppState = async () => {
      try {
        const isFirstLaunch = await AsyncStorage.getItem("isFirstLaunch");
        const userToken = await AsyncStorage.getItem("token");

        console.log("Navigation Debug - isFirstLaunch:", isFirstLaunch);
        console.log(
          "Navigation Debug - userToken:",
          userToken ? "EXISTS" : "NOT FOUND"
        );

        if (isFirstLaunch === null) {
          // First time launching the app
          await AsyncStorage.setItem("isFirstLaunch", "false");
          console.log("Navigation Debug - First time user, going to Welcome");
          setInitialRoute("Welcome"); // Start with Welcome screen
        } else if (userToken) {
          // User is logged in, go directly to Home (skip Welcome and Onboarding)
          console.log("Navigation Debug - User is logged in, going to Main");
          setInitialRoute("Main");
        } else {
          // User has used the app before but not logged in
          console.log(
            "Navigation Debug - Returning user not logged in, going to Welcome"
          );
          setInitialRoute("Welcome"); // Start with Welcome screen
        }
      } catch (error) {
        console.error("Error checking app state:", error);
        setInitialRoute("Welcome");
      } finally {
        setLoading(false);
      }
    };

    checkAppState();
  }, []);

  function BottomTabs() {
    return (
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: "#fff",
            borderTopWidth: 1,
            borderTopColor: "#e0e0e0",
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          },
          tabBarActiveTintColor: "#4CAF50",
          tabBarInactiveTintColor: "#666",
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: "Home",
            headerShown: false,
            tabBarIcon: ({ focused, color }) => (
              <Entypo name="home" size={24} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Community"
          component={CommunityScreen}
          options={{
            tabBarLabel: "Community",
            headerShown: false,
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name="newspaper" size={24} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Weather"
          component={WeatherScreen}
          options={{
            tabBarLabel: "Weather",
            headerShown: false,
            tabBarIcon: ({ focused, color }) => (
              <AntDesign name="cloud" size={24} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Messages"
          component={MessagesScreen}
          options={{
            tabBarLabel: "Messages",
            headerShown: false,
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name="chatbubbles" size={24} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarLabel: "Profile",
            headerShown: false,
            tabBarIcon: ({ focused, color }) => (
              <FontAwesome5 name="user-alt" size={24} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={initialRoute}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
        <Stack.Screen name="Main" component={BottomTabs} />
        <Stack.Screen name="CreatePost" component={CreatePostScreen} />
        <Stack.Screen name="PostDetails" component={PostDetailsScreen} />
        <Stack.Screen name="AddPostScreen" component={AddPostScreen} />
        <Stack.Screen name="BuyScreen" component={BuyScreen} />
        <Stack.Screen name="RentScreen" component={RentScreen} />
        <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
        <Stack.Screen name="ResearchScreen" component={ResearchScreen} />
        <Stack.Screen name="CommunityScreen" component={CommunityScreen} />
        <Stack.Screen name="PaymentWebView" component={PaymentWebView} />
        <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
        <Stack.Screen name="VerifyOTP" component={OTPverify} />
        <Stack.Screen name="AdminLogin" component={AdminLogin} />
        <Stack.Screen name="AdminRegister" component={AdminRegister} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="UpdatePostScreen" component={UpdatePostScreen} />
        <Stack.Screen
          name="AddressEditScreen"
          component={AddressEditScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="SellScreen" component={SellScreen} />
        <Stack.Screen name="Cart" component={CartScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="AddProduct" component={AddProductScreen} />
        <Stack.Screen name="EditProduct" component={EditProductScreen} />
        <Stack.Screen name="CommentScreen" component={CommentScreen} />
        <Stack.Screen name="TrendingScreen" component={TrendingScreen} />
        <Stack.Screen
          name="PeopleProfileScreen"
          component={PeopleProfileScreen}
        />
        <Stack.Screen name="MessagesScreen" component={MessagesScreen} />
        <Stack.Screen name="ChatScreen" component={ChatScreen} />
        <Stack.Screen name="MyOrders" component={MyOrders} />
        <Stack.Screen name="ReceivedOrders" component={ReceivedOrders} />
        <Stack.Screen name="MyRentals" component={MyRentals} />
        <Stack.Screen name="ReceivedRentals" component={ReceivedRentals} />
        <Stack.Screen name="RentalDetails" component={RentalDetailsScreen} />
        <Stack.Screen name="Reviews" component={ReviewsScreen} />
        <Stack.Screen name="Settings" component={ProfileScreen} />
        <Stack.Screen name="OrderDetails" component={MyOrders} />
        <Stack.Screen name="OrderTracking" component={MyOrders} />
        <Stack.Screen name="Weather" component={WeatherScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default StackNavigator;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#4CAF50",
  },
});
