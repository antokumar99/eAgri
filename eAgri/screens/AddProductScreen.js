import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import api from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import * as Location from 'expo-location';

const AddProductScreen = ({ navigation }) => {
  const [product, setProduct] = useState({
    name: "",
    description: "",
    price: "",
    rentPrice: "",
    category: "Seeds",
    stock: "",
    image: null,
    productType: "buy",
  });

  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);

  const categories = [
    "Seeds",
    "Fertilizers",
    "Pesticides",
    "Tools",
    "Machinery",
    "Others",
  ];

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setProduct({ ...product, image: result.assets[0].uri });
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const validateForm = () => {
    if (!product.name || !product.description || !product.stock) {
      Alert.alert("Error", "Please fill in all required fields");
      return false;
    }

    if (
      (product.productType === "buy" || product.productType === "both") &&
      !product.price
    ) {
      Alert.alert("Error", "Please enter a price for buyable products");
      return false;
    }

    if (
      (product.productType === "rent" || product.productType === "both") &&
      !product.rentPrice
    ) {
      Alert.alert("Error", "Please enter a rent price for rentable products");
      return false;
    }

    if (!product.image) {
      Alert.alert("Error", "Please add an image");
      return false;
    }

    return true;
  };

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Needed',
          'Location permission is needed to show your product to nearby customers.'
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      console.log('Product location:', location.coords);
      setLocation(location.coords);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get location. Your product will be visible to all users.');
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const formData = new FormData();

      // Append basic product data
      formData.append("name", product.name);
      formData.append("description", product.description);
      formData.append("category", product.category);
      formData.append("stock", product.stock);
      formData.append("productType", product.productType);

      // Append prices based on product type
      if (product.productType === "buy" || product.productType === "both") {
        formData.append("price", product.price);
      }
      if (product.productType === "rent" || product.productType === "both") {
        formData.append("rentPrice", product.rentPrice);
      }

      // Handle image upload
      if (product.image) {
        const uri =
          Platform.OS === "ios"
            ? product.image.replace("file://", "")
            : product.image;

        const filename = uri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        formData.append("image", {
          uri,
          type,
          name: filename,
        });
      }

      // Add location data if available
      if (location) {
        formData.append('location', JSON.stringify({
          type: 'Point',
          coordinates: [location.longitude, location.latitude] // MongoDB expects [longitude, latitude]
        }));
      }

      const response = await api.post("/addproducts", formData, {
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      Alert.alert("Success", "Product added successfully");
      navigation.goBack();
    } catch (error) {
      console.error("Error adding product:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "Failed to add product. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Product Name</Text>
        <TextInput
          style={styles.input}
          value={product.name}
          onChangeText={(text) => setProduct({ ...product, name: text })}
          placeholder="Enter product name"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={product.description}
          onChangeText={(text) => setProduct({ ...product, description: text })}
          placeholder="Enter product description"
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Price (৳)</Text>
        <TextInput
          style={styles.input}
          value={product.price}
          onChangeText={(text) => setProduct({ ...product, price: text })}
          placeholder="Enter price"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Product Type</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={product.productType}
            onValueChange={(value) =>
              setProduct({ ...product, productType: value })
            }
          >
            <Picker.Item label="For Sale" value="buy" />
            <Picker.Item label="For Rent" value="rent" />
            <Picker.Item label="Both" value="both" />
          </Picker>
        </View>

        {(product.productType === "rent" || product.productType === "both") && (
          <>
            <Text style={styles.label}>Rent Price (per day)</Text>
            <TextInput
              style={styles.input}
              value={product.rentPrice}
              onChangeText={(text) =>
                setProduct({ ...product, rentPrice: text })
              }
              keyboardType="numeric"
              placeholder="Enter rent price"
            />
          </>
        )}

        <Text style={styles.label}>Category</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={product.category}
            onValueChange={(value) =>
              setProduct({ ...product, category: value })
            }
          >
            {categories.map((category) => (
              <Picker.Item key={category} label={category} value={category} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Stock Quantity</Text>
        <TextInput
          style={styles.input}
          value={product.stock}
          onChangeText={(text) => setProduct({ ...product, stock: text })}
          placeholder="Enter stock quantity"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Product Image</Text>
        <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
          <MaterialIcons name="add-photo-alternate" size={24} color="#008E97" />
          <Text style={styles.imageButtonText}>Add Image</Text>
        </TouchableOpacity>

        {product.image && (
          <View style={styles.imageWrapper}>
            <Image source={{ uri: product.image }} style={styles.image} />
            <TouchableOpacity
              style={styles.removeImage}
              onPress={() => setProduct({ ...product, image: null })}
            >
              <MaterialIcons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? "Adding Product..." : "Add Product"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: "#f8f8f8",
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  imageButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#008E97",
    marginBottom: 15,
  },
  imageButtonText: {
    marginLeft: 10,
    color: "#008E97",
    fontSize: 16,
  },
  imageContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 15,
  },
  imageWrapper: {
    position: "relative",
    margin: 5,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImage: {
    position: "absolute",
    right: -10,
    top: -10,
    backgroundColor: "red",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButton: {
    backgroundColor: "#008E97",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default AddProductScreen;
