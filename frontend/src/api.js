import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export const getCsrfCookie = async () => {
  const baseURL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:8000';
  try {
    await axios.get(`${baseURL}/sanctum/csrf-cookie`, {
      withCredentials: true,
    });
  } catch (err) {
    console.error("❌ Failed to load CSRF cookie:", err);
  }
};

export const getChatUsers = () => API.get("/chat-users");

const token = localStorage.getItem("token");
if (token) {
  API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  console.log("✅ Token loaded from localStorage");
}

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

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log("❌ 401 Unauthorized - Clearing session");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      delete API.defaults.headers.common['Authorization'];
      
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

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