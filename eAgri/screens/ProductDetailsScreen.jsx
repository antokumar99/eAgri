import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  SafeAreaView
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/Header';
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const ProductDetailsScreen = ({ route }) => {
  const { product } = route.params;
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  // const handleBuyNow = async () => {
  //   setLoading(true);
  //   try {
  //     // Generate a unique transaction ID
  //     const transactionId = 'EAG' + Date.now() + Math.floor(Math.random() * 1000);
      
  //     // Prepare payment data
  //     const paymentData = {
  //       total_amount: parseFloat(product.price),
  //       currency: 'BDT',
  //       tran_id: transactionId,
  //       success_url: 'http://yourbackend.com/api/payment/success',
  //       fail_url: 'http://yourbackend.com/api/payment/fail',
  //       cancel_url: 'http://yourbackend.com/api/payment/cancel',
  //       ipn_url: 'http://yourbackend.com/api/payment/ipn',
  //       shipping_method: 'NO',
  //       product_name: product.name,
  //       product_category: product.category,
  //       product_profile: 'general',
  //       cus_name: 'Customer Name', // Replace with actual user data
  //       cus_email: 'customer@example.com', // Replace with actual user data
  //       cus_phone: '01XXXXXXXXX', // Replace with actual user data
  //       cus_add1: 'Dhaka',
  //       cus_city: 'Dhaka',
  //       cus_country: 'Bangladesh',
  //       shipping_method: 'NO',
  //       num_of_item: 1,
  //       product_id: product.id,
  //     };

  //     // Make API call to your backend to initialize payment
  //     const response = await api.post('/payment/init', paymentData);

  //     if (response.data.status === 'SUCCESS') {
  //       // Store transaction ID in AsyncStorage for later verification
  //       await AsyncStorage.setItem('current_transaction', transactionId);
        
  //       if (Platform.OS === 'web') {
  //         // For web platform, redirect to payment URL
  //         window.location.href = response.data.GatewayPageURL;
  //       } else {
  //         // For mobile platforms, navigate to WebView
  //         navigation.navigate('PaymentWebView', {
  //           paymentUrl: response.data.GatewayPageURL,
  //           transactionId: transactionId,
  //         });
  //       }
  //     } else {
  //       Alert.alert('Error', 'Payment initialization failed. Please try again.');
  //     }
  //   } catch (error) {
  //     console.error('Payment initialization error:', error);
  //     Alert.alert(
  //       'Error',
  //       'Unable to process payment at this time. Please try again later.'
  //     );
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const handleBuyNow = async () => {
    setLoading(true);
    try {
      // Get user data from AsyncStorage
      const userData = await AsyncStorage.getItem('userData');
      const user = userData ? JSON.parse(userData) : null;
      
      if (!user) {
        Alert.alert('Please login to continue');
        navigation.navigate('Login');
        return;
      }
  
      const transactionId = `EAG${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      const paymentData = {
        total_amount: product.price.replace(/[^\d.]/g, ''), // Remove currency symbol
        currency: 'BDT',
        tran_id: transactionId,
        success_url: `${api.defaults.baseURL}/payment/success`,
        fail_url: `${api.defaults.baseURL}/payment/fail`,
        cancel_url: `${api.defaults.baseURL}/payment/cancel`,
        ipn_url: `${api.defaults.baseURL}/payment/ipn`,
        shipping_method: 'NO',
        product_name: product.name,
        product_category: product.type,
        product_profile: 'physical-goods',
        cus_name: user.name,
        cus_email: user.email,
        cus_phone: user.phone,
        cus_add1: user.address || 'N/A',
        cus_city: user.city || 'N/A',
        cus_country: 'Bangladesh',
        num_of_item: 1,
        product_id: product.id
      };
  
      const response = await api.post('/payment/init', paymentData);
      
      if (response.data?.status === 'SUCCESS') {
        await AsyncStorage.setItem('current_transaction', JSON.stringify({
          id: transactionId,
          productId: product.id,
          amount: paymentData.total_amount
        }));
        
        if (Platform.OS === 'web') {
          window.location.href = response.data.GatewayPageURL;
        } else {
          navigation.navigate('PaymentWebView', {
            paymentUrl: response.data.GatewayPageURL,
            transactionId
          });
        }
      } else {
        throw new Error(response.data?.message || 'Payment initialization failed');
      }
    } catch (error) {
      Alert.alert(
        'Payment Error',
        error?.response?.data?.message || error.message || 'Payment initialization failed'
      );
    } finally {
      setLoading(false);
    }
  };
  const handleContactSeller = () => {
    const phoneNumber = 'tel:01777777777'; // Specify the phone number in 'tel:' format
    Linking.openURL(phoneNumber)
      .catch(err => Alert.alert('Error', 'Unable to make a call. Please try again.'));
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Product Details" />
      <ScrollView>
        <Image source={product.image} style={styles.productImage} />
        
        <View style={styles.contentContainer}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.price}>{product.price}</Text>
          
          <View style={styles.sellerInfo}>
            <Icon name="person-circle-outline" size={24} color="#666" />
            <View style={styles.sellerDetails}>
              <Text style={styles.sellerName}>{product.seller}</Text>
              <Text style={styles.location}>{product.location}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Product Details</Text>
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{product.type}</Text>
            </View>
            {/* Add more details as needed */}
          </View>

          <View style={styles.divider} />

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.contactButton]}
              onPress={handleContactSeller}
            >
              <Icon name="call-outline" size={20} color="#00b1ff" />
              <Text style={styles.contactButtonText}>Contact Seller</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buyButton]}
              onPress={handleBuyNow}
              disabled={loading}
            >
              <Icon name="cart-outline" size={20} color="#fff" />
              <Text style={styles.buyButtonText}>
                {loading ? 'Processing...' : 'Buy Now'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === "android" ? 40 : 0,
  },
  productImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  contentContainer: {
    padding: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  price: {
    fontSize: 22,
    color: '#00b1ff',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sellerDetails: {
    marginLeft: 12,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '500',
  },
  location: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  detailsContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  contactButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#00b1ff',
  },
  buyButton: {
    backgroundColor: '#00b1ff',
  },
  contactButtonText: {
    marginLeft: 8,
    color: '#00b1ff',
    fontSize: 16,
    fontWeight: '500',
  },
  buyButtonText: {
    marginLeft: 8,
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ProductDetailsScreen;