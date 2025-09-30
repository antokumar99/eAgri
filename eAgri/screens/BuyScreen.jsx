import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
  SafeAreaView,
  Alert,
  Linking,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as Location from 'expo-location';
import api from "../services/api";
import Header from "../components/Header";
import AsyncStorage from '@react-native-async-storage/async-storage';

const BuyScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [userLocation, setUserLocation] = useState(null);
  const [selectedDistance, setSelectedDistance] = useState(30);
  const RADIUS_KM = 30;

  const categories = [
    "all",
    "Seeds",
    "Fertilizers",
    "Pesticides",
    "Tools",
    "Machinery",
  ];

  const distanceOptions = [5, 15, 30, 60, 80, 100, 200, "All"];

  const getUserLocation = () => {
    // Check if we have a recent location (less than 5 minutes old)
    if (global.userLocation && 
        (new Date().getTime() - global.userLocation.timestamp) < 300000) {
      return {
        latitude: global.userLocation.latitude,
        longitude: global.userLocation.longitude
      };
    }
    return null;
  };

  useEffect(() => {
    const cachedLocation = getUserLocation();
    if (cachedLocation) {
      setUserLocation(cachedLocation);
      fetchProducts(cachedLocation);
    } else {
      checkLocationPermission();
    }
  }, [selectedCategory]);

  const checkLocationPermission = async () => {
    try {
      // First check if location services are enabled
      const providerStatus = await Location.hasServicesEnabledAsync();
      
      if (!providerStatus) {
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services to see nearby products.',
          [
            {
              text: 'Cancel',
              onPress: () => {
                setLoading(false);
                fetchProducts(); // Show all products if user cancels
              },
              style: 'cancel',
            },
            {
              text: 'Open Settings',
              onPress: () => {
                Platform.OS === 'ios' 
                  ? Linking.openURL('app-settings:')
                  : Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
              },
            },
          ]
        );
        return;
      }

      // Then check app permissions
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      
      if (existingStatus !== 'granted') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'This app needs access to location to show nearby products.',
            [
              {
                text: 'Show All Products',
                onPress: () => {
                  setLoading(false);
                  fetchProducts(); // Show all products if permission denied
                },
              },
              {
                text: 'Open Settings',
                onPress: () => Linking.openSettings(),
              },
            ]
          );
          return;
        }
      }

      // Get current location with better options and longer timeout
      setLoading(true);
      const location = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low, // Lower accuracy for faster response
          enableHighAccuracy: false, // Disable high accuracy for faster response
          maximumAge: 60000, // Accept locations up to 1 minute old
          timeout: 15000, // Increase timeout to 15 seconds
          distanceInterval: 100, // Only update if moved 100 meters
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Location request timed out')), 16000)
        )
      ]).catch(async (error) => {
        // If high accuracy fails, try getting last known location
        if (error.message.includes('timed out')) {
          const lastLocation = await Location.getLastKnownPositionAsync();
          if (lastLocation) {
            return lastLocation;
          }
          throw error;
        }
        throw error;
      });

      if (!location) {
        throw new Error('Could not get location');
      }

      setUserLocation(location.coords);
      console.log('User location:', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: new Date().toISOString()
      });
      
      // Store location in memory
      global.userLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: new Date().getTime(),
      };

      fetchProducts(location.coords);
    } catch (error) {
      console.error('Error getting location:', error);
      
      // Show specific error message based on the error
      let errorMessage = 'Failed to get your location. ';
      if (error.message.includes('timed out')) {
        errorMessage += 'Taking too long to get location. Would you like to:';
        Alert.alert(
          'Location Error',
          errorMessage,
          [
            {
              text: 'Show All Products',
              onPress: () => {
                setLoading(false);
                fetchProducts();
              },
            },
            {
              text: 'Try Again',
              onPress: () => {
                // Try again with even lower accuracy
                Location.getCurrentPositionAsync({
                  accuracy: Location.Accuracy.Lowest,
                  enableHighAccuracy: false,
                  maximumAge: 300000, // Accept locations up to 5 minutes old
                }).then(location => {
                  setUserLocation(location.coords);
                  global.userLocation = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    timestamp: new Date().getTime(),
                  };
                  fetchProducts(location.coords);
                }).catch(() => {
                  setLoading(false);
                  fetchProducts();
                });
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Location Error',
          errorMessage + 'Showing all available products.',
          [
            {
              text: 'OK',
              onPress: () => {
                setLoading(false);
                fetchProducts();
              },
            }
          ]
        );
      }
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const toRad = (value) => value * Math.PI / 180;

  const fetchProducts = async (location = null) => {
    try {
      const response = await api.get("/products", {
        params: {
          type: ["buy", "both"],
          category: selectedCategory !== "all" ? selectedCategory : undefined,
        },
      });

      let filteredProducts = response.data.products;

      // First filter by category
      if (selectedCategory !== "all") {
        filteredProducts = filteredProducts.filter(
          product => product.category === selectedCategory
        );
      }

      // Then filter by distance if location is available
      if (location) {
        filteredProducts = filteredProducts.filter(product => {
          if (!product.location?.coordinates) return false;
          
          const distance = calculateDistance(
            location.latitude,
            location.longitude,
            product.location.coordinates[1],
            product.location.coordinates[0]
          );
          
          product.distance = distance;
          return selectedDistance === "All" ? true : distance <= selectedDistance;
        });

        console.log('Filtered products with distances:', 
          filteredProducts.map(p => ({
            name: p.name,
            distance: p.distance,
            coordinates: p.location.coordinates
          }))
        );
        
        filteredProducts.sort((a, b) => a.distance - b.distance);
      }

      setProducts(filteredProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      Alert.alert('Error', 'Failed to fetch products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    checkLocationPermission();
  };

  const renderProduct = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate("ProductDetails", { product: item })}
    >
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productCategory}>{item.category}</Text>
        <Text style={styles.productPrice}>৳{item.price}</Text>
        {item.distance && (
          <Text style={styles.distance}>
            {item.distance.toFixed(1)} km away
          </Text>
        )}
        <View style={styles.ratingContainer}>
          <MaterialIcons name="star" size={16} color="#FFD700" />
          <Text style={styles.ratingText}>
            {item.averageRating?.toFixed(1) || "New"} ({item.ratings?.length || 0})
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const additionalStyles = {
    distance: {
      fontSize: 14,
      color: '#666',
      fontStyle: 'italic',
      marginBottom: 4,
    },
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Buy Products" />
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={24} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedCategory === item && styles.selectedCategory,
              ]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === item && styles.selectedCategoryText,
                ]}
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {userLocation && (
        <View style={styles.distanceContainer}>
          <Text style={styles.distanceLabel}>Filter by Distance:</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.distanceScroll}
          >
            {distanceOptions.map((distance) => (
              <TouchableOpacity
                key={distance}
                style={[
                  styles.distanceButton,
                  selectedDistance === distance && styles.selectedDistance,
                ]}
                onPress={() => {
                  setSelectedDistance(distance);
                  const cachedLocation = getUserLocation();
                  if (cachedLocation) {
                    fetchProducts(cachedLocation);
                  } else {
                    checkLocationPermission();
                  }
                }}
              >
                <Text
                  style={[
                    styles.distanceText,
                    selectedDistance === distance && styles.selectedDistanceText,
                  ]}
                >
                  {distance === "All" ? "All Distances" : `${distance} km`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#008E97" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.productList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {userLocation 
                ? `No products found within ${selectedDistance} km`
                : 'No products found'}
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: Platform.OS === "android" ? 40 : 0,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  categoriesContainer: {
    paddingVertical: 10,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: "#fff",
    elevation: 2,
  },
  selectedCategory: {
    backgroundColor: "#008E97",
  },
  categoryText: {
    color: "#666",
    fontSize: 14,
  },
  selectedCategoryText: {
    color: "#fff",
  },
  productList: {
    padding: 10,
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    overflow: "hidden",
  },
  productImage: {
    width: 140,
    height: 140,
    resizeMode: "cover",
  },
  productInfo: {
    flex: 1,
    padding: 10,
    marginLeft : 30
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  productCategory: {
    color: "#666",
    fontSize: 14,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    color: "#008E97",
    fontWeight: "bold",
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    marginLeft: 4,
    color: "#666",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginTop: 20,
  },
  distanceContainer: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
  },
  distanceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  distanceScroll: {
    flexDirection: 'row',
  },
  distanceButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 25,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#eee',
    minWidth: 80,
    alignItems: 'center',
  },
  selectedDistance: {
    backgroundColor: '#008E97',
    borderColor: '#008E97',
  },
  distanceText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedDistanceText: {
    color: '#fff',
  },
});

export default BuyScreen;
