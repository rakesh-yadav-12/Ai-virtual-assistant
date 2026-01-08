// src/context/UserContext.jsx
import React, { createContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

export const userDataContext = createContext();

// IMPORTANT: Make sure this URL matches your actual backend
const serverUrl = "https://ai-virtual-assistant-20b.onrender.com";

// Configure axios - SILENT MODE for 401 errors
const axiosInstance = axios.create({
  baseURL: serverUrl,
  withCredentials: true,
  timeout: 10000
});

// Add response interceptor to SILENTLY handle 401 errors
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    // SILENTLY handle 401 - don't log as error, it's expected
    if (error.response?.status === 401) {
      console.log("🔐 Not authenticated (expected)");
      return Promise.reject({ 
        ...error, 
        isAuthError: true, 
        silent: true 
      });
    }
    
    // For other errors, log them
    console.error("API Error:", error.message);
    return Promise.reject(error);
  }
);

function UserContextProvider({ children }) {
  const [userData, setUserData] = useState(() => {
    // Try to load from localStorage
    const saved = localStorage.getItem('userData');
    return saved ? JSON.parse(saved) : null;
  });
  const [loadingUser, setLoadingUser] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Check authentication status - SILENT mode
  const checkAuth = useCallback(async (silent = true) => {
    try {
      if (!silent) setLoadingUser(true);
      
      const response = await axiosInstance.get("/api/user/current");
      
      if (response.data && response.data._id) {
        console.log('✅ User authenticated:', response.data.email);
        setUserData(response.data);
        setIsAuthenticated(true);
        localStorage.setItem('userData', JSON.stringify(response.data));
        return { success: true, user: response.data };
      }
    } catch (error) {
      // Don't log 401 errors - they're expected
      if (!error.silent) {
        console.log("Auth check failed:", error.message);
      }
      
      // Clear any stale data
      setUserData(null);
      setIsAuthenticated(false);
      localStorage.removeItem('userData');
      
      return { success: false, error: "Not authenticated" };
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
      
      // Use regular axios for login (not the silent instance)
      const response = await axios.post(
        `${serverUrl}/api/auth/signin`,
        { email, password },
        { 
          withCredentials: true,
          timeout: 15000
        }
      );
      
      if (response.data.user) {
        console.log('✅ Login successful');
        setUserData(response.data.user);
        setIsAuthenticated(true);
        localStorage.setItem('userData', JSON.stringify(response.data.user));
        
        return { success: true, data: response.data };
      }
      return { success: false, error: "No user data returned" };
    } catch (error) {
      console.log("Login failed:", error.response?.data?.message || error.message);
      return { 
        success: false, 
        error: error.response?.data?.message || "Login failed. Please check your credentials." 
      };
    }
  }, []);

  // Signup function
  const signup = useCallback(async (name, email, password) => {
    try {
      console.log('📝 Attempting signup...');
      
      const response = await axios.post(
        `${serverUrl}/api/auth/signup`,
        { name, email, password },
        { 
          withCredentials: true,
          timeout: 15000
        }
      );
      
      if (response.data.user) {
        console.log('✅ Signup successful');
        setUserData(response.data.user);
        setIsAuthenticated(true);
        localStorage.setItem('userData', JSON.stringify(response.data.user));
        
        return { success: true, data: response.data };
      }
      return { success: false, error: "No user data returned" };
    } catch (error) {
      console.log("Signup failed:", error.response?.data?.message || error.message);
      return { 
        success: false, 
        error: error.response?.data?.message || "Signup failed. Please try again." 
      };
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await axios.post(`${serverUrl}/api/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.log("Logout error:", error.message);
    } finally {
      setUserData(null);
      setIsAuthenticated(false);
      localStorage.removeItem('userData');
      localStorage.removeItem('selectedAssistantImage');
      localStorage.removeItem('customAssistantImages');
      localStorage.removeItem('selectedImageIndex');
      console.log('✅ Logged out');
    }
  }, []);

  // Initialize - check auth on mount (silently)
  useEffect(() => {
    const initAuth = async () => {
      // Check localStorage first
      const savedUser = localStorage.getItem('userData');
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          // Try to validate the saved user
          const result = await checkAuth(true);
          if (result.success) {
            console.log('✅ Restored session from localStorage');
          } else {
            console.log('❌ Saved session expired');
            localStorage.removeItem('userData');
          }
        } catch (error) {
          console.log('Error checking saved auth');
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
