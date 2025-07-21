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
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import api from "../services/api";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const EditProductScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const categories = [
    "Seeds",
    "Fertilizers",
    "Pesticides",
    "Tools",
    "Machinery",
    "Others",
  ];

  useEffect(() => {
    fetchProduct();
  }, []);

  const fetchProduct = async () => {
    try {
      console.log("Fetching product with ID:", productId);
      const response = await api.get(`/products/${productId}`);

      if (response.data.success && response.data.product) {
        const productData = response.data.product;
        console.log("Fetched product data:", productData);

        setProduct({
          name: productData.name || "",
          description: productData.description || "",
          price: productData.price?.toString() || "",
          rentPrice: productData.rentPrice?.toString() || "",
          category: productData.category || "Seeds",
          stock: productData.stock?.toString() || "",
          image: productData.image || null,
          productType: productData.productType || "buy",
        });
      } else {
        throw new Error("Product data not found");
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      Alert.alert(
        "Error",
        "Failed to fetch product details. Please try again later."
      );
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

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
    if (
      !product.name ||
      !product.description ||
      !product.stock ||
      !product.category
    ) {
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

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

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

      // Handle image upload if changed
      if (product.image && !product.image.startsWith("http")) {
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

      const response = await api.put(`/products/${productId}`, formData, {
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        Alert.alert("Success", "Product updated successfully");
        navigation.goBack();
      } else {
        throw new Error(response.data.message || "Failed to update product");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          error.message ||
          "Failed to update product"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#008E97" />
      </View>
    );
  }

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

        {(product.productType === "buy" || product.productType === "both") && (
          <>
            <Text style={styles.label}>Price (৳)</Text>
            <TextInput
              style={styles.input}
              value={product.price}
              onChangeText={(text) => setProduct({ ...product, price: text })}
              placeholder="Enter price"
              keyboardType="numeric"
            />
          </>
        )}

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
        {product.image && (
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: product.image }}
              style={styles.image}
              resizeMode="cover"
            />
            <TouchableOpacity style={styles.changeImage} onPress={pickImage}>
              <MaterialIcons name="edit" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {!product.image && (
          <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
            <MaterialIcons
              name="add-photo-alternate"
              size={24}
              color="#008E97"
            />
            <Text style={styles.imageButtonText}>Add Image</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.submitButton, saving && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={saving}
        >
          <Text style={styles.submitButtonText}>
            {saving ? "Updating..." : "Update Product"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
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
  },
  imageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#008E97",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  imageButtonText: {
    color: "#008E97",
    fontSize: 16,
    marginLeft: 10,
  },
  imageWrapper: {
    position: "relative",
    width: "100%",
    height: 200,
    marginBottom: 15,
    borderRadius: 8,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  changeImage: {
    position: "absolute",
    right: 10,
    bottom: 10,
    backgroundColor: "#008E97",
    borderRadius: 20,
    padding: 8,
  },
  submitButton: {
    backgroundColor: "#008E97",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default EditProductScreen;
