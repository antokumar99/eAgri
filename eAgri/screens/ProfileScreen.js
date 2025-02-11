import React, { useState, useEffect } from "react";
import{
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  Alert
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from "../components/Header";
import api from '../services/api';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderCount, setOrderCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);

  const menuItems = [
    { id: 1, label: "Shipping Address", icon: "location-outline", onPress: () => navigation.navigate('ShippingAddress') },
    { id: 2, label: "Payment Settings", icon: "card-outline", onPress: () => navigation.navigate('PaymentSettings') },
    { id: 3, label: "Order History", icon: "document-text-outline", onPress: () => navigation.navigate('OrderHistory') },
    { id: 4, label: "Settings", icon: "settings-outline", onPress: () => navigation.navigate('Settings') },
    { id: 5, label: "Privacy Policy", icon: "shield-checkmark-outline", onPress: () => navigation.navigate('PrivacyPolicy') },
    { id: 6, label: "Logout", icon: "log-out-outline", onPress:async()=> {
        try {
          await AsyncStorage.removeItem('token');
          console.log('Logged out');
          navigation.replace('Login');
        } catch (error) {
          console.error('Error logging out:', error);
          Alert.alert('Error', 'Failed to logout');
        }
      }
    },
  ];

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.replace('Login');
        return;
      }

      const response = await api.get('/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      
      setUserData(response.data);
      console.log(userData);
      
      // Fetch order count
      // const ordersResponse = await api.get('/api/orders/count', {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      // setOrderCount(ordersResponse.data.count);

      // Fetch favorites count
      // const favoritesResponse = await api.get('/api/favorites/count', {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      // setFavoriteCount(favoritesResponse.data.count);

    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      console.log('Logged out');
      navigation.replace('Login');
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const renderMenuItem = ({ item }) => (
    <TouchableOpacity style={styles.menuItem} onPress={item.onPress}>
      <View style={styles.menuItemLeft}>
        <Icon name={item.icon} size={20} color="#555" />
        <Text style={styles.menuItemText}>{item.label}</Text>
      </View>
      <Icon name="chevron-forward-outline" size={20} color="#555" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2ecc71" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="My Profile" />
      
      {/* Profile Info */}
      <View style={styles.profileInfo}>
        {userData?.photo ? (
          <Image 
            source={{ uri: userData.photo }} 
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatar}>
            <Image source={require('../assets/avatar.png')} style={{ width: 60, height: 60 }} />
            {/* <Icon name="person-outline" size={40} color="#555" /> */}
          </View>
        )}
        
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{favoriteCount}</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{orderCount}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
        </View>
        
        <Text style={styles.profileName}>{userData?.data?.name}</Text>
        <View style={styles.locationContainer}>
          <Icon name="location-outline" size={16} color="#555" />
          <Text style={styles.locationText}>
            {userData?.data?.address?.city}, {userData?.data?.address?.country}
          </Text>
        </View>

        {userData?.data?.farm?.title && (
          <View style={styles.farmInfo}>
            <Text style={styles.farmTitle}>{userData?.data?.farm.title}</Text>
            <Text style={styles.farmExperience}>
              {userData.farm.experience} years of experience
            </Text>
          </View>
        )}
      </View>

      {/* Menu List */}
      <FlatList
        data={menuItems}
        renderItem={renderMenuItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.menuList}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? 40 : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#fff",
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#555",
  },
  profileInfo: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "#f9f9f9",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "60%",
    marginBottom: 10,
  },
  statBox: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
  },
  statLabel: {
    fontSize: 12,
    color: "#777",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 5,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    marginLeft: 5,
    fontSize: 14,
    color: "#777",
  },
  menuList: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#555",
  },
  loadingContainer: {
    flex: 1,
   justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  farmInfo: {
    marginTop: 10,
    alignItems: 'center',
  },
  farmTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2ecc71',
  },
  farmExperience: {
    fontSize: 14,
    color: '#777',
    marginTop: 2,
  },
});
