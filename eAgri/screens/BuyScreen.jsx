

import React, { useState } from 'react';
import Icon from 'react-native-vector-icons/Ionicons'; 
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  StatusBar,
  Platform,
  SafeAreaView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/Header';

const CATEGORIES = [
  {
    id: 1,
    name: 'All products',
    type: 'all',
    image: require('../assets/rice.jpg'), // Use tractor.jpg here
  },
  {
    id: 2,
    name: 'Agricultural Crops',
    type: 'crops',
    image: require('../assets/rice.jpg'), // Use tractor.jpg here
  },
  {
    id: 3,
    name: 'Field Operations',
    type: 'field',
    image: require('../assets/rice.jpg'),
  },
  {
    id: 4,
    name: 'Others',
    type: 'other',
    image: require('../assets/rice.jpg'),
  },
];

// Sample products (you can replace with your fetched data)
const PRODUCTS = [
  {
    id: 101,
    name: 'm8 head light',
    seller: 'Rubel sk',
    location: 'রায়গঞ্জ',
    type: 'other',
    price: '৳৮৫০',
    image: require('../assets/rice.jpg'),
  },
  {
    id: 102,
    name: 'Lichu',
    seller: 'Md. Momjurul Islam',
    location: 'khanpur Mithapukur',
    type: 'other',
    price: '৳২০,০০০',
    image: require('../assets/rice.jpg'),
  },
  {
    id: 103,
    name: 'Wheat Seeds',
    seller: 'Farmer A',
    location: 'Rangpur',
    type: 'crops',
    price: '৳১,২০০',
    image: require('../assets/rice.jpg'),
  },
  {
    id: 104,
    name: 'extractor',
    seller: 'anto sk',
    location: 'রায়গঞ্জ',
    type: 'field',
    price: '৳৮৫০',
    image: require('../assets/rice.jpg'),
  },
  {
    id: 105,
    name: 'Mango',
    seller: 'Md. hafizur Islam',
    location: 'khanpur Mithapukur',
    type: 'crops',
    price: '৳২০,০০০',
    image: require('../assets/rice.jpg'),
  },
  {
    id: 106,
    name: 'Rice Seeds',
    seller: 'Farmer Abdur',
    location: 'Rangpur',
    type: 'crops',
    price: '৳১,২০০',
    image: require('../assets/rice.jpg'),
  },
];


const BuyScreen = () => {
  const navigation = useNavigation();

  // State to track selected category & search query
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState(PRODUCTS);

  // Filter products based on search query
  const handleSearch = () => {
    const filtered = PRODUCTS.filter((product) => {
      const matchCategory =
        selectedCategory === 'all' || product.type === selectedCategory;
      const matchSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.type.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });

    setFilteredProducts(filtered);
  };

  // Handle clearing the search input
  const handleClearSearch = () => {
    setSearchQuery('');
    setFilteredProducts(PRODUCTS); // Reset to all products
  };

  // Handle tapping a category
  const handleCategoryPress = (type) => {
    setSelectedCategory(type);
    const filtered = PRODUCTS.filter(
      (product) => type === 'all' || product.type === type
    );
    setFilteredProducts(filtered);
  };

  // Handle tapping a product
  const handleProductPress = (product) => {
    navigation.navigate('ProductDetailsScreen', { product });
  };

  // Renders each category item
  const renderCategoryItem = ({ item }) => {
    const isActive = item.type === selectedCategory;
    return (
      <TouchableOpacity
        style={[
          styles.categoryItem,
          isActive && styles.categoryItemSelected
        ]}
        onPress={() => handleCategoryPress(item.type)}
      >
        <Image source={item.image} style={styles.categoryImage} />
        <Text style={styles.categoryText}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  // Renders each product card
  const renderProductItem = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => handleProductPress(item)}
    >
      <View style={styles.imageHolder}>
        <Image source={item.image} style={styles.productImage} />
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productSeller}>{item.seller}</Text>
        <Text style={styles.productLocation}>{item.location}</Text>
        <Text style={styles.productType}>{item.type}</Text>
        <Text style={styles.productPrice}>{item.price}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title = "Buy Products" /> 
      {/* Categories Section */}
      <View style={styles.categoryContainer}>
        <FlatList
          horizontal
          data={CATEGORIES}
          renderItem={renderCategoryItem}
          keyExtractor={item => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
        />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Products"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch} // Trigger search on keyboard enter
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Icon name="search" size={20} color="green" marginRight={15} />
        </TouchableOpacity>
        {searchQuery.trim().length > 0 && (
          <TouchableOpacity onPress={handleClearSearch}>
            <Icon name="close-circle" size={20} color="gray" />
          </TouchableOpacity>
        )}
      </View>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.productListContainer}
      />
    </SafeAreaView>
  );
};

export default BuyScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === "android" ? 40 : 0, 
  },
  // ----- Categories -----
  categoryContainer: {
    marginTop: 8,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 16,
  },
  categoryItemSelected: {
    borderBottomWidth: 2,
    borderBottomColor: '#00b1ff',
  },
  categoryImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  categoryText: {
    marginTop: 4,
    fontSize: 12,
    color: '#333',
  },
  // ----- Search Bar -----
  searchContainer: {
    margin: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'green',
    borderRadius: 24,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
   
  },
  // ----- Products List -----
  productListContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    height: 140,
  },
  imageHolder:{
    justifyContent: 'center',
    marginLeft: 20,
    marginRight : 35,
  },
  productImage: {
    width: 120,
    height: 125,
    resizeMode: 'cover',
  },
  productInfo: {
    flex: 1,
    padding: 8,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  productSeller: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  productLocation: {
    fontSize: 14,
    color: '#888',
    marginBottom: 2,
  },
  productType: {
    fontSize: 14,
    color: '#444',
    marginBottom: 2,
  },
  productPrice: {
    fontSize: 16,
    color: '#00b1ff',
    marginTop: 4,
  },
});