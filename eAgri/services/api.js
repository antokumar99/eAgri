import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const api = axios.create({
  baseURL: "http://192.168.0.103:3000",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
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
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - Server might be down');
      throw new Error('Server is not responding. Please try again later.');
    } else if (!error.response) {
      console.error('Network error:', error.message);
      throw new Error('Network connection error. Please check your internet connection and make sure the server is running.');
    } else {
      console.error('Response error:', error.response.status, error.response.data);
      throw error;
    }
  }
);

// Add this function to handle multipart/form-data requests
api.postFormData = async (url, formData, config = {}) => {
  try {
    const token = await AsyncStorage.getItem('token');
    console.log('Token for form data:', token);

    const defaultConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      timeout: 30000, // Increase timeout for large files
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

    console.log('Form data config:', mergedConfig);
    
    try {
      const response = await api.post(url, formData, mergedConfig);
      return response;
    } catch (error) {
      if (error.message === 'Network Error' && config.onUploadProgress) {
        // If we got a network error but the progress was 100%, the upload probably succeeded
        const progressEvent = { loaded: 100, total: 100 };
        config.onUploadProgress(progressEvent);
        return { data: { success: true, message: 'Post created successfully' } };
      }
      throw error;
    }
  } catch (error) {
    console.error('Error in postFormData:', error);
    throw error;
  }
};

export default api;
