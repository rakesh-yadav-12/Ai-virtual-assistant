// src/context/UserContext.jsx
import React, { createContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

export const userDataContext = createContext();

// IMPORTANT: Make sure this URL matches your actual backend
const serverUrl = "https://ai-virtual-assistant-20b.onrender.com"; // Change this to match your backend

// Configure axios
axios.defaults.withCredentials = true;
axios.defaults.baseURL = serverUrl;

function UserContextProvider({ children }) {
  const [userData, setUserData] = useState(() => {
    // Try to load from localStorage on initial load
    const saved = localStorage.getItem('userData');
    return saved ? JSON.parse(saved) : null;
  });
  const [loadingUser, setLoadingUser] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Check authentication status - SILENTLY without throwing errors
  const checkAuth = useCallback(async (silent = true) => {
    try {
      if (!silent) setLoadingUser(true);
      
      console.log('🔍 Checking authentication...');
      
      const response = await axios.get("/api/user/current", {
        withCredentials: true,
        timeout: 10000
      });
      
      if (response.data && response.data._id) {
        console.log('✅ User authenticated:', response.data.email);
        setUserData(response.data);
        setIsAuthenticated(true);
        localStorage.setItem('userData', JSON.stringify(response.data));
        return { success: true, user: response.data };
      }
    } catch (error) {
      if (!silent) {
        console.log("🔒 Not authenticated:", {
          status: error.response?.status,
          message: error.message
        });
      }
      
      // 401 is EXPECTED when not logged in - don't treat as error
      if (error.response?.status === 401) {
        // Clear any stale data
        setUserData(null);
        setIsAuthenticated(false);
        localStorage.removeItem('userData');
        return { success: false, error: "Not authenticated" };
      }
      
      // For other errors, show them
      if (!silent) {
        console.error("Auth check error:", error);
      }
    } finally {
      if (!silent) setLoadingUser(false);
      setAuthChecked(true);
    }
    return { success: false, error: "Auth check failed" };
  }, []);

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      console.log('🔐 Attempting login...');
      
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
        
        // Verify the login worked
        await checkAuth(true);
        
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
  }, [checkAuth]);

  // Signup function
  const signup = useCallback(async (name, email, password) => {
    try {
      console.log('📝 Attempting signup...');
      
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
        
        // Verify the signup worked
        await checkAuth(true);
        
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
  }, [checkAuth]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      console.log('🚪 Logging out...');
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
      console.log('✅ Logged out successfully');
    }
  }, []);

  // Initialize - check auth on mount (silently)
  useEffect(() => {
    const initAuth = async () => {
      // First, check if we have localStorage data
      const savedUser = localStorage.getItem('userData');
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          // Verify the token is still valid
          const result = await checkAuth(true);
          if (!result.success) {
            // Token expired, clear localStorage
            localStorage.removeItem('userData');
          }
        } catch (error) {
          console.log('Error checking saved auth:', error);
          localStorage.removeItem('userData');
        }
      } else {
        // No saved user, just do a silent check
        await checkAuth(true);
      }
      setLoadingUser(false);
    };
    
    initAuth();
  }, [checkAuth]);

  const value = {
    serverUrl,
    userData,
    setUserData,
    loadingUser,
    isAuthenticated,
    authChecked,
    checkAuth,
    login,
    signup,
    logout
  };

  return (
    <userDataContext.Provider value={value}>
      {children}
    </userDataContext.Provider>
  );
}

export default UserContextProvider;
