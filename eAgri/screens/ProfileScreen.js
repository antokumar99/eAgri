import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Platform
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { AntDesign } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import Header from "../components/Header";

export default function ProfileScreen() {
    const navigation = useNavigation();
  const menuItems = [
    { id: 1, label: "Shipping Address", icon: "location-outline" },
    { id: 2, label: "Payment Settings", icon: "card-outline" },
    { id: 3, label: "Order History", icon: "document-text-outline" },
    { id: 4, label: "Settings", icon: "settings-outline" },
    { id: 5, label: "Privacy Policy", icon: "shield-checkmark-outline" },
    { id: 6, label: "Logout", icon: "log-out-outline" },
  ];

  const renderMenuItem = ({ item }) => (
    <TouchableOpacity style={styles.menuItem}>
      <View style={styles.menuItemLeft}>
        <Icon name={item.icon} size={20} color="#555" />
        <Text style={styles.menuItemText}>{item.label}</Text>
      </View>
      <Icon name="chevron-forward-outline" size={20} color="#555" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="back" size={24} color="#555" />
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity>
          <Icon name="create-outline" size={24} color="#555" />
        </TouchableOpacity>
      </View> */}
      <Header title="My Profile" />
      {/* Profile Info */}
      <View style={styles.profileInfo}>
        <View style={styles.avatar} />
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>138</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>56</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
        </View>
        <Text style={styles.profileName}>Karim Hossain</Text>
        <View style={styles.locationContainer}>
          <Icon name="location-outline" size={16} color="#555" />
          <Text style={styles.locationText}>Satkhira</Text>
        </View>
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
    backgroundColor: "#ddd",
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
});
