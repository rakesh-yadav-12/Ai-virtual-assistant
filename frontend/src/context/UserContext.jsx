// src/context/UserContext.jsx
import React, { createContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

export const userDataContext = createContext();

// IMPORTANT: Make sure this URL matches your actual backend
const serverUrl = "https://ai-virtual-assistant-20b.onrender.com"; // Change this to match your backend

// Configure axios globally
axios.defaults.withCredentials = true;
axios.defaults.baseURL = serverUrl;

// Add request interceptor to add cookies
axios.interceptors.request.use(
  config => {
    // Ensure cookies are sent with every request
    config.withCredentials = true;
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Clear user data on 401
      localStorage.removeItem('userData');
      console.log('Session expired or not authenticated');
    }
    return Promise.reject(error);
  }
);

function UserContextProvider({ children }) {
  const [userData, setUserData] = useState(() => {
    // Try to load from localStorage on initial load
    const saved = localStorage.getItem('userData');
    return saved ? JSON.parse(saved) : null;
  });
  const [loadingUser, setLoadingUser] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      setLoadingUser(true);
      console.log('Checking authentication...');
      
      const response = await axios.get("/api/user/current", {
        withCredentials: true,
        timeout: 10000
      });
      
      if (response.data && response.data._id) {
        console.log('✅ User authenticated:', response.data.email);
        setUserData(response.data);
        setIsAuthenticated(true);
        localStorage.setItem('userData', JSON.stringify(response.data));
        return response.data;
      }
    } catch (error) {
      console.log("❌ Not authenticated:", {
        status: error.response?.status,
        message: error.message,
        url: error.config?.url
      });
      
      // Clear any stale data
      setUserData(null);
      setIsAuthenticated(false);
      localStorage.removeItem('userData');
    } finally {
      setLoadingUser(false);
    }
    return null;
  }, []);

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      console.log('Attempting login...');
      
      const response = await axios.post(
        "/api/auth/signin",
        { email, password },
        { 
          withCredentials: true,
          timeout: 15000
        }
      );
      
      if (response.data.user) {
        console.log('✅ Login successful:', response.data.user.email);
        setUserData(response.data.user);
        setIsAuthenticated(true);
        localStorage.setItem('userData', JSON.stringify(response.data.user));
        return { success: true, data: response.data };
      }
      return { success: false, error: "No user data returned" };
    } catch (error) {
      console.error("❌ Login error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      return { 
        success: false, 
        error: error.response?.data?.message || "Login failed. Please check your credentials." 
      };
    }
  }, []);

  // Signup function
  const signup = useCallback(async (name, email, password) => {
    try {
      console.log('Attempting signup...');
      
      const response = await axios.post(
        "/api/auth/signup",
        { name, email, password },
        { 
          withCredentials: true,
          timeout: 15000
        }
      );
      
      if (response.data.user) {
        console.log('✅ Signup successful:', response.data.user.email);
        setUserData(response.data.user);
        setIsAuthenticated(true);
        localStorage.setItem('userData', JSON.stringify(response.data.user));
        return { success: true, data: response.data };
      }
      return { success: false, error: "No user data returned" };
    } catch (error) {
      console.error("❌ Signup error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      return { 
        success: false, 
        error: error.response?.data?.message || "Signup failed. Please try again." 
      };
    }
  }, []);

  // Get Gemini response
  const getGeminiResponse = useCallback(async (command) => {
    if (!command || typeof command !== "string") {
      return {
        type: "error",
        userInput: command,
        response: "Please provide a valid command",
        searchQuery: null,
        action: null,
        parameters: {},
        actionUrl: null,
        requiresAction: false,
        timestamp: new Date().toISOString()
      };
    }

    try {
      const response = await axios.post(
        "/api/user/ask",
        { command },
        { 
          withCredentials: true,
          timeout: 30000
        }
      );
      
      return response.data;
    } catch (error) {
      console.error("Assistant error:", error);
      
      if (error.response?.status === 401) {
        setUserData(null);
        setIsAuthenticated(false);
        localStorage.removeItem('userData');
      }
      
      return {
        type: "error",
        userInput: command,
        response: "I'm having trouble connecting. Please check your internet and try again.",
        searchQuery: null,
        action: null,
        parameters: {},
        actionUrl: null,
        requiresAction: false,
        timestamp: new Date().toISOString()
      };
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await axios.post("/api/auth/logout", {}, { withCredentials: true });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUserData(null);
      setIsAuthenticated(false);
      localStorage.removeItem('userData');
      localStorage.removeItem('selectedAssistantImage');
      localStorage.removeItem('customAssistantImages');
      localStorage.removeItem('selectedImageIndex');
    }
  }, []);

  // Initialize - check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value = {
    serverUrl,
    userData,
    setUserData,
    loadingUser,
    isAuthenticated,
    checkAuth,
    login,
    signup,
    getGeminiResponse,
    logout,
    updateUserImage: (imageUrl) => {
      if (userData) {
        const updatedUser = {
          ...userData,
          assistantImage: imageUrl
        };
        setUserData(updatedUser);
        localStorage.setItem('userData', JSON.stringify(updatedUser));
      }
    }
  };

  return (
    <userDataContext.Provider value={value}>
      {children}
    </userDataContext.Provider>
  );
}

export default UserContextProvider;
