import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  API_BASE_URL,
  REQUEST_TIMEOUT,
  UPLOAD_TIMEOUT,
} from "../config/apiConfig";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: REQUEST_TIMEOUT,
});

// Add request interceptor to automatically add token to all requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      //console.log('Token from storage:', token);  // to show the token
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      //console.log('Final request headers:', config.headers);  // to show the headers
      
      return config;
    } catch (error) {
      console.error('Error in request interceptor:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - Server might be down');
      throw new Error('Server is not responding. Please try again later.');
    }

    if (!error.response) {
      console.error('Network error:', error.message);
      throw new Error('Network connection error. Please check your internet connection and make sure the server is running.');
    }

    // An expired token used to leave stale credentials in storage, so every
    // subsequent screen failed with a 401 until the app was reinstalled.
    if (error.response.status === 401) {
      await AsyncStorage.multiRemove(['token', 'user']).catch(() => {});
    }

    console.error('Response error:', error.response.status, error.response.data);
    throw error;
  }
);

// Add this function to handle multipart/form-data requests
api.postFormData = async (url, formData, config = {}) => {
  try {
    const token = await AsyncStorage.getItem('token');

    const defaultConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      timeout: UPLOAD_TIMEOUT, // Uploads carry image payloads
      maxContentLength: Infinity, // Allow large content
      maxBodyLength: Infinity, // Allow large body
    };

    const mergedConfig = {
      ...defaultConfig,
      ...config,
      headers: {
        ...defaultConfig.headers,
        ...config.headers,
      },
    };

    // A network error was previously swallowed and reported to the caller as
    // `{ success: true, message: 'Post created successfully' }`. Users were
    // told their post had been published when nothing had reached the server.
    return await api.post(url, formData, mergedConfig);
  } catch (error) {
    console.error('Error in postFormData:', error.message);
    throw error;
  }
};

export default api;
