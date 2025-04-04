import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import api from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function EditProfileScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { userData } = route.params;

  const [name, setName] = useState(userData?.data?.name || "");
  const [email, setEmail] = useState(userData?.data?.email || "");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState(userData?.data?.phone || "");
  const [address, setAddress] = useState({
    houseNo: userData?.data?.address?.houseNo || "",
    street: userData?.data?.street || "",
    city: userData?.data?.address?.city || "",
    country: userData?.data?.address?.country || "",
    postalCode: userData?.data?.address?.postalCode || "",
  });
  const [photo, setPhoto] = useState(userData?.data?.photo || "");
  const [farm, setFarm] = useState({
    title: userData?.data?.farm?.title || "",
    details: userData?.data?.farm?.details || "",
    experience: userData?.data?.farm?.experience || "",
  });

  const handleUpdate = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await api.put(
        "/profile",
        {
          name,
          email,
          password: password || undefined,
          phone,
          address,
          photo,
          farm,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Alert.alert("Success", "Profile updated successfully!");
      navigation.goBack();
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Static Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerText}>Edit Your Profile</Text>
        </View>
      </SafeAreaView>

      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Enter a new password"
          secureTextEntry
        />

        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Photo URL</Text>
        <TextInput
          style={styles.input}
          value={photo}
          onChangeText={setPhoto}
          placeholder="Enter photo URL"
        />

        <Text style={styles.label}>Address</Text>
        <TextInput
          style={styles.input}
          value={address.houseNo}
          onChangeText={(text) => setAddress({ ...address, houseNo: text })}
          placeholder="House No"
        />
        <TextInput
          style={styles.input}
          value={address.street}
          onChangeText={(text) => setAddress({ ...address, street: text })}
          placeholder="Street"
        />
        <TextInput
          style={styles.input}
          value={address.city}
          onChangeText={(text) => setAddress({ ...address, city: text })}
          placeholder="City"
        />
        <TextInput
          style={styles.input}
          value={address.country}
          onChangeText={(text) => setAddress({ ...address, country: text })}
          placeholder="Country"
        />
        <TextInput
          style={styles.input}
          value={address.postalCode}
          onChangeText={(text) => setAddress({ ...address, postalCode: text })}
          placeholder="Postal Code"
        />

        <Text style={styles.label}>Farm Title</Text>
        <TextInput
          style={styles.input}
          value={farm.title}
          onChangeText={(text) => setFarm({ ...farm, title: text })}
          placeholder="Farm Title"
        />

        <Text style={styles.label}>Farm Details</Text>
        <TextInput
          style={styles.input}
          value={farm.details}
          onChangeText={(text) => setFarm({ ...farm, details: text })}
          placeholder="Farm Details"
        />

        <Text style={styles.label}>Years of Experience</Text>
        <TextInput
          style={styles.input}
          value={farm.experience.toString()}
          onChangeText={(text) =>
            setFarm({ ...farm, experience: parseInt(text) || 0 })
          }
          placeholder="Years of Experience"
          keyboardType="numeric"
        />

        <TouchableOpacity style={styles.button} onPress={handleUpdate}>
          <Text style={styles.buttonText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  safeArea: {
    backgroundColor: "#4caf50",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: "#4caf50",
    elevation: 4,
  },
  backButton: {
    marginRight: 10,
  },
  backButtonText: {
    fontSize: 24,
    color: "#fff",
  },
  headerText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  scrollContainer: {
    padding: 20,
    flexGrow: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#4caf50",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
