import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import Icon from "react-native-vector-icons/Ionicons";

export default function AddressEditScreen() {
  const navigation = useNavigation();
  const [address, setAddress] = useState({
    houseNo: '',
    street: '',
    city: '',
    country: '',
    postalCode: '',
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadAddress();
  }, []);

  const loadAddress = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.replace('Login');
        return;
      }

      const response = await api.get('/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAddress(response.data.data.address);
    } catch (error) {
      console.error('Error fetching address:', error);
      Alert.alert('Error', 'Failed to load address data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await api.put('/profile/address', { address }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert('Success', 'Address updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating address:', error);
      Alert.alert('Error', 'Failed to update address');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2ecc71" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={25} color="#555" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Address</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>House Number</Text>
        <TextInput
          style={styles.input}
          value={address.houseNo}
          onChangeText={(text) => setAddress({ ...address, houseNo: text })}
          placeholder="Enter House Number"
        />

        <Text style={styles.label}>Street</Text>
        <TextInput
          style={styles.input}
          value={address.street}
          onChangeText={(text) => setAddress({ ...address, street: text })}
          placeholder="Enter Street"
        />

        <Text style={styles.label}>City *</Text>
        <TextInput
          style={styles.input}
          value={address.city}
          onChangeText={(text) => setAddress({ ...address, city: text })}
          placeholder="Enter City"
        />

        <Text style={styles.label}>Country *</Text>
        <TextInput
          style={styles.input}
          value={address.country}
          onChangeText={(text) => setAddress({ ...address, country: text })}
          placeholder="Enter Country"
        />

        <Text style={styles.label}>Postal Code</Text>
        <TextInput
          style={styles.input}
          value={address.postalCode}
          onChangeText={(text) => setAddress({ ...address, postalCode: text })}
          placeholder="Enter Postal Code"
        />

        <TouchableOpacity style={styles.updateButton} onPress={handleUpdate} disabled={updating}>
          {updating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.updateButtonText}>Update Address</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#555',
  },
  form: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginTop: 5,
    fontSize: 16,
  },
  updateButton: {
    backgroundColor: '#2ecc71',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 30,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 