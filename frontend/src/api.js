// src/api.js
import axios from "axios";

// 🌍 Base URL (API root)
const baseURL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8000');

// 🌐 Axios instance for all API requests
const API = axios.create({
  baseURL: `${baseURL}/api`,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ----------------------------------------------------
// 🛡 GET CSRF COOKIE - Optional for token-based auth
// ----------------------------------------------------
export const getCsrfCookie = async () => {
  try {
    await axios.get(`${baseURL}/sanctum/csrf-cookie`, {
      withCredentials: true,
    });
  } catch (err) {
    console.error("❌ Failed to load CSRF cookie:", err);
  }
};

// ----------------------------------------------------
// 👥 Chat Users
// ----------------------------------------------------
export const getChatUsers = () => API.get("/chat-users");

// ----------------------------------------------------
// 🔐 Load token from localStorage on app initialization
// ✅ FIX: Set token in API headers on app start
// ----------------------------------------------------
const token = localStorage.getItem("token");
if (token) {
  API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  console.log("✅ Token loaded from localStorage");
}

// ----------------------------------------------------
// 🔐 Attach Token to Every Request (Interceptor)
// ✅ FIX: Only use localStorage for consistency
// ----------------------------------------------------
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ----------------------------------------------------
// ⚠ Handle 401 (Token Expired / Invalid)
// ✅ FIX: Clear everything and redirect to login
// ----------------------------------------------------
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log("❌ 401 Unauthorized - Clearing session");
      
      // Clear all auth data
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      delete API.defaults.headers.common['Authorization'];
      
      // Redirect to login (prevent infinite loop)
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ----------------------------------------------------
// 🔧 Helper function to set token manually
// ✅ FIX: Export this for Login/Register to use
// ----------------------------------------------------
export const setAuthToken = (token) => {
  if (token) {
    API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem("token", token);
    console.log("✅ Auth token set in API headers");
  } else {
    delete API.defaults.headers.common['Authorization'];
    localStorage.removeItem("token");
    console.log("🗑️ Auth token removed from API headers");
  }
};

export default API;