import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { clearQueryCache } from "../utils/queryCache";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://127.0.0.1:5000",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Check token validity
const isTokenValid = (token) => {
  try {
    const decoded = jwtDecode(token);
    return decoded.exp > Date.now() / 1000;
  } catch {
    return false;
  }
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("jwt_token");
    if (token && isTokenValid(token)) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error("Request setup error:", error);
    return Promise.reject(error);
  },
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error("Network error:", error);
      return Promise.reject(
        new Error("Network error occurred. Please check your connection."),
      );
    }

    // Handle specific HTTP errors
    switch (error.response.status) {
      case 400: {
        console.error("Bad request:", error.response.data);
        const d = error.response.data || {};
        const message =
          d.error ||
          (Array.isArray(d.errors) ? d.errors.join(" ") : d.errors) ||
          d.details ||
          "Invalid request";
        return Promise.reject(new Error(message));
      }

      case 401:
        localStorage.removeItem("jwt_token");
        localStorage.removeItem("user");
        clearQueryCache();
        return Promise.reject(
          new Error("Session expired. Please login again."),
        );

      case 403:
        console.error("Permission denied:", error.response.data);
        return Promise.reject(
          new Error(
            error.response.data?.error ||
              "You do not have permission to perform this action.",
          ),
        );

      case 404:
        console.error("Resource not found:", error.response.data);
        return Promise.reject(
          new Error(
            error.response.data.message ||
              "The requested resource was not found.",
          ),
        );

      case 422:
        console.error("Validation error:", error.response.data);
        return Promise.reject(
          new Error(error.response.data.error || "Validation failed"),
        );

      case 429:
        console.error("Too many requests:", error.response.data);
        return Promise.reject(
          new Error("Too many requests. Please try again later."),
        );

      case 500:
        console.error("Server error:", error.response.data);
        return Promise.reject(
          new Error(
            "An internal server error occurred. Please try again later.",
          ),
        );

      default:
        console.error("API Error:", error.response.data);
        return Promise.reject(
          new Error("An unexpected error occurred. Please try again."),
        );
    }
  },
);

export default api;
