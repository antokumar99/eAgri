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

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // A multipart body must carry "; boundary=..." in its Content-Type, and
      // only the HTTP layer knows the boundary it generated. Setting the header
      // by hand — which every upload call site used to do — suppressed that,
      // and multer rejected the request with "Multipart: Boundary not found".
      // Deleting the header lets React Native fill it in properly.
      //
      // This is why creating or editing a post or product failed while
      // everything else worked: those are the only multipart requests.
      const isFormData =
        typeof FormData !== 'undefined' && config.data instanceof FormData;

      if (isFormData) {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
        if (config.headers.common) delete config.headers.common['Content-Type'];
        if (config.headers.post) delete config.headers.post['Content-Type'];
        if (config.headers.put) delete config.headers.put['Content-Type'];
      }

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

/**
 * Multipart upload helper.
 *
 * Content-Type is deliberately NOT set here. The request interceptor strips it
 * for FormData bodies so React Native can supply the boundary; hardcoding
 * "multipart/form-data" is what broke every upload. The auth header is added by
 * the interceptor too, so it is not repeated.
 */
const formDataConfig = (config = {}) => ({
  timeout: UPLOAD_TIMEOUT, // Uploads carry image payloads
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
  ...config,
});

api.postFormData = async (url, formData, config = {}) => {
  try {
    // A network error was previously swallowed and reported to the caller as
    // `{ success: true, message: 'Post created successfully' }`. Users were
    // told their post had been published when nothing had reached the server.
    return await api.post(url, formData, formDataConfig(config));
  } catch (error) {
    console.error('Error in postFormData:', error.message);
    throw error;
  }
};

api.putFormData = async (url, formData, config = {}) => {
  try {
    return await api.put(url, formData, formDataConfig(config));
  } catch (error) {
    console.error('Error in putFormData:', error.message);
    throw error;
  }
};

export default api;
