import axios from "axios";

const api = axios.create({
  baseURL: "http://192.168.0.107:3000",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // Increased timeout to 15 seconds
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    if (__DEV__) {
      console.log('API Request:', config.method.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
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

export default api;
