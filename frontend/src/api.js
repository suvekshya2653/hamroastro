// src/api.js
import axios from "axios";

// 🌍 Base URL (API root)
const baseURL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// 🌐 Axios instance for all API requests
const API = axios.create({
  baseURL: `${baseURL}/api`,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ----------------------------------------------------
// 🛡 GET CSRF COOKIE - Only needed for cookie-based auth
// For token-based auth with Sanctum, this is optional
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
// 👥 Chat Users (DO NOT TOUCH — You Said Keep It Same)
// ----------------------------------------------------
export const getChatUsers = () => API.get("/chat-users");

// ----------------------------------------------------
// 🔐 Attach Token to Every Request
// NOTE: Changed to sessionStorage so each tab has its own token
// ----------------------------------------------------
API.interceptors.request.use(
  (config) => {
    // Try sessionStorage first, fallback to localStorage
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ----------------------------------------------------
// ⚠ Handle 401 (Token Expired / Invalid)
// ----------------------------------------------------
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Optionally redirect to login
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;