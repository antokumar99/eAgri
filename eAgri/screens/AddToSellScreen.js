import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  SafeAreaView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import api from '../services/api';

const AddToSellScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    unit: 'kg',
    category: 'Crops'
  });

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setImages([...images, ...result.assets.map(asset => asset.uri)]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // First upload images
      const imageUrls = await Promise.all(
        images.map(async (image) => {
          const formData = new FormData();
          formData.append('image', {
            uri: image,
            type: 'image/jpeg',
            name: 'product.jpg',
          });

          const response = await api.post('/api/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          return response.data.url;
        })
      );

      // Then create product
      await api.post('/api/products', {
        ...productData,
        images: imageUrls,
        price: parseFloat(productData.price),
        quantity: parseInt(productData.quantity),
      });

      Alert.alert('Success', 'Product added successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error adding product:', error);
      Alert.alert('Error', 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!images.length) {
      Alert.alert('Error', 'Please add at least one image');
      return false;
    }
    if (!productData.name || !productData.price || !productData.quantity) {
      Alert.alert('Error', 'Please fill all required fields');
      return false;
    }
    return true;
  };

  return (
    <SafeAreaView style={styles.safeareaviewcontainer}>
        <ScrollView style={styles.container}>

        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add New Product</Text>
            <View style={{ width: 24 }} />
        </View>

        <View style={styles.imageSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {images.map((uri, index) => (
                <View key={index} style={styles.imageContainer}>
                <Image source={{ uri }} style={styles.image} />
                <TouchableOpacity
                    style={styles.removeImage}
                    onPress={() => setImages(images.filter((_, i) => i !== index))}
                >
                    <MaterialIcons name="close" size={20} color="white" />
                </TouchableOpacity>
                </View>
            ))}
            <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                <MaterialIcons name="add-photo-alternate" size={32} color="#666" />
                <Text style={styles.addImageText}>Add Images</Text>
            </TouchableOpacity>
            </ScrollView>
        </View>

        <View style={styles.form}>
            <TextInput
            style={styles.input}
            placeholder="Product Name"
            value={productData.name}
            onChangeText={(text) => setProductData({ ...productData, name: text })}
            />

            <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description"
            multiline
            numberOfLines={4}
            value={productData.description}
            onChangeText={(text) => setProductData({ ...productData, description: text })}
            />

            <View style={styles.row}>
            <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Price"
                keyboardType="numeric"
                value={productData.price}
                onChangeText={(text) => setProductData({ ...productData, price: text })}
            />
            <View style={styles.spacer} />
            <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Quantity"
                keyboardType="numeric"
                value={productData.quantity}
                onChangeText={(text) => setProductData({ ...productData, quantity: text })}
            />
            </View>

            <View style={styles.pickerContainer}>
            <Picker
                selectedValue={productData.unit}
                style={styles.picker}
                onValueChange={(value) => setProductData({ ...productData, unit: value })}
            >
                <Picker.Item label="Kilograms (kg)" value="kg" />
                <Picker.Item label="Pieces" value="pieces" />
                <Picker.Item label="Liters" value="liters" />
                <Picker.Item label="Grams" value="grams" />
            </Picker>
            </View>

            <View style={styles.pickerContainer}>
            <Picker
                selectedValue={productData.category}
                style={styles.picker}
                onValueChange={(value) => setProductData({ ...productData, category: value })}
            >
                <Picker.Item label="Crops" value="Crops" />
                <Picker.Item label="Seeds" value="Seeds" />
                <Picker.Item label="Fertilizers" value="Fertilizers" />
                <Picker.Item label="Tools" value="Tools" />
                <Picker.Item label="Machinery" value="Machinery" />
                <Picker.Item label="Others" value="Others" />
            </Picker>
            </View>

            <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            >
            {loading ? (
                <ActivityIndicator color="white" />
            ) : (
                <Text style={styles.submitButtonText}>Add Product</Text>
            )}
            </TouchableOpacity>
        </View>
        </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    safeareaviewcontainer:{
        flex: 1,
        backgroundColor: '#f5f5f5',
        paddingTop: Platform.OS === "android" ? 40 : 0, 
    },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  imageSection: {
    padding: 18,
  },
  imageContainer: {
    marginRight: 12,
    position: 'relative',
  },
  image: {
    width: 120,
    height: 110,
    borderRadius: 8,
  },
  removeImage: {
    position: 'absolute',
    top: -3,
    right: -8,
    backgroundColor: '#ff4444',
    borderRadius: 12,
    padding: 4,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  addImageText: {
    color: '#666',
    marginTop: 4,
  },
  form: {
    padding: 16,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  spacer: {
    width: 16,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 16,
  },
  picker: {
    height: 53,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AddToSellScreen; 