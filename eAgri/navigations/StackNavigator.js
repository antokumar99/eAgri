import { StyleSheet, Text, View, ActivityIndicator  } from "react-native";
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
import AddressEditScreen from '../screens/AddressEditScreen';
import PaymentWebView from '../screens/PaymentWebView';
import SellScreen from '../screens/SellScreen';
import AddToSellScreen from '../screens/AddToSellScreen';

import AdminLogin from '../screens/AdminLogin';
import AdminRegister from '../screens/AdminRegister';
import AdminDashboard from '../screens/AdminDashboard';


const StackNavigator = () => {
  const Stack = createStackNavigator();
  const [initialRoute, setInitialRoute] = useState("Welcome");
  const Tab = createBottomTabNavigator();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAppState = async () => {
      try {
        const isFirstLaunch = await AsyncStorage.getItem("isFirstLaunch");
        const isLoggedIn = await AsyncStorage.getItem("token");

        if (isFirstLaunch === null) {
          await AsyncStorage.setItem("isFirstLaunch", "false");
          setInitialRoute("Onboarding");
        } else if (isLoggedIn) {
          setInitialRoute("Main"); // Navigate to BottomTabs
        } else {
          setInitialRoute("Login");
        }
      } catch (error) {
        console.error("Error checking app state:", error);
      } finally {
        setLoading(false); // Done loading
      }
    };

    checkAppState();
  }, []);

  function BottomTabs() {
    return (
      <Tab.Navigator>
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: "Home",
            tabBarLabelStyle: { color: "#008E97" },
            headerShown: false,
            tabBarIcon: ({ focused }) =>
              focused ? (
                <Entypo name="home" size={24} color="#008E97" />
              ) : (
                <AntDesign name="home" size={24} color="black" />
              ),
          }}
        />
        <Tab.Screen
          name="Service"
          component={RentScreen}
          options={{
            tabBarLabel: "Service",
            tabBarLabelStyle: { color: "#008E97" },
            headerShown: false,
            tabBarIcon: ({ focused }) =>
              focused ? (
                <Fontisto name="player-settings" size={24} color="#008E97" />
              ) : (
                <AntDesign name="setting" size={24} color="black" />
              ),
          }}
        />
        <Tab.Screen
          name="Community"
          component={CommunityScreen}
          options={{
            tabBarLabel: "Community",
            tabBarLabelStyle: { color: "#008E97" },
            headerShown: false,
            tabBarIcon: ({ focused }) =>
              focused ? (
                <Ionicons name="newspaper" size={24} color="#008E97" />
              ) : (
                <Ionicons name="newspaper-outline" size={24} color="black" />
              ),
          }}
        />
        <Tab.Screen
          name="Weather"
          component={WeatherScreen}
          options={{
            tabBarLabel: "Weather",
            tabBarLabelStyle: { color: "#008E97" },
            headerShown: false,
            tabBarIcon: ({ focused }) =>
              focused ? (
                <AntDesign name="cloud" size={24} color="#008E97" />
              ) : (
                <AntDesign name="cloudo" size={24} color="black" />
              ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarLabel: "Profile",
            tabBarLabelStyle: { color: "#008E97" },
            headerShown: false,
            tabBarIcon: ({ focused }) =>
              focused ? (
                <FontAwesome5 name="user-alt" size={24} color="#008E97" />
              ) : (
                <FontAwesome5 name="user" size={24} color="black" />
              ),
          }}
        />
      </Tab.Navigator>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#008E97" />
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
        <Stack.Screen name="ProductDetailsScreen" component={ProductDetailsScreen} />
        <Stack.Screen name="ResearchScreen" component={ResearchScreen} />
        <Stack.Screen name="ForumScreen" component={ForumScreen} />
        <Stack.Screen name="PaymentWebView" component={PaymentWebView} />
        {/* <Stack.Screen name="PaymentSuccess" component={PaymentSuccess} /> */}
        <Stack.Screen name="AdminLogin" component={AdminLogin} />
        <Stack.Screen name="AdminRegister" component={AdminRegister} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen 
          name="AddressEditScreen" 
          component={AddressEditScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen name="SellScreen" component={SellScreen} />
        <Stack.Screen name="AddToSellScreen" component={AddToSellScreen} />
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
});
