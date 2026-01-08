// src/context/UserContext.jsx
import React, { createContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

export const userDataContext = createContext();

const serverUrl = "https://ai-virtual-assistant-20b.onrender.com";

// Create a custom axios instance that SILENCES 401 errors
const createAxiosInstance = () => {
  const instance = axios.create({
    baseURL: serverUrl,
    withCredentials: true,
    timeout: 10000
  });

  // Intercept responses to hide 401 errors
  instance.interceptors.response.use(
    response => response,
    error => {
      // SILENTLY handle 401 errors - don't log them
      if (error.response?.status === 401) {
        // Return a custom error that won't log to console
        return Promise.reject({
          isAuthError: true,
          status: 401,
          message: "Not authenticated"
        });
      }
      
      // For other errors, you can log them
      if (error.response?.status >= 500) {
        console.error("Server error:", error.message);
      }
      
      return Promise.reject(error);
    }
  );

  return instance;
};

function UserContextProvider({ children }) {
  const [userData, setUserData] = useState(() => {
    const saved = localStorage.getItem('userData');
    return saved ? JSON.parse(saved) : null;
  });
  const [loadingUser, setLoadingUser] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Create axios instance for this component
  const axiosInstance = createAxiosInstance();

  // Check authentication status
  const checkAuth = useCallback(async (silent = true) => {
    try {
      if (!silent) setLoadingUser(true);
      
      console.log('🔍 Checking authentication status...');
      
      const response = await axiosInstance.get("/api/user/current");
      
      if (response.data && response.data._id) {
        console.log('✅ User is authenticated');
        setUserData(response.data);
        setIsAuthenticated(true);
        localStorage.setItem('userData', JSON.stringify(response.data));
        return { success: true, user: response.data };
      }
    } catch (error) {
      // 401 errors are handled silently by the interceptor
      if (error.isAuthError) {
        console.log('🔒 User is not authenticated (this is normal)');
      } else if (!silent) {
        console.log('Auth check failed:', error.message);
      }
      
      // Clear any stale data
      setUserData(null);
      setIsAuthenticated(false);
      localStorage.removeItem('userData');
      
      return { success: false, error: "Not authenticated" };
    } finally {
      if (!silent) setLoadingUser(false);
    }
    return { success: false, error: "Auth check failed" };
  }, [axiosInstance]);

  // Login function - use regular axios to see actual errors
  const login = useCallback(async (email, password) => {
    try {
      console.log('🔐 Attempting login...');
      
      const response = await axios.post(
        `${serverUrl}/api/auth/signin`,
        { email, password },
        { 
          withCredentials: true,
          timeout: 15000
        }
      );
      
      if (response.data.user) {
        console.log('✅ Login successful!');
        setUserData(response.data.user);
        setIsAuthenticated(true);
        localStorage.setItem('userData', JSON.stringify(response.data.user));
        
        // Verify login worked
        await checkAuth(true);
        
        return { success: true, data: response.data };
      }
      return { success: false, error: "No user data returned" };
    } catch (error) {
      console.log('Login response:', error.response?.data);
      return { 
        success: false, 
        error: error.response?.data?.message || "Login failed. Please check your credentials." 
      };
    }
  }, [checkAuth]);

  // Signup function
  const signup = useCallback(async (name, email, password) => {
    try {
      console.log('📝 Creating account...');
      
      const response = await axios.post(
        `${serverUrl}/api/auth/signup`,
        { name, email, password },
        { 
          withCredentials: true,
          timeout: 15000
        }
      );
      
      if (response.data.user) {
        console.log('✅ Account created successfully!');
        setUserData(response.data.user);
        setIsAuthenticated(true);
        localStorage.setItem('userData', JSON.stringify(response.data.user));
        
        return { success: true, data: response.data };
      }
      return { success: false, error: "No user data returned" };
    } catch (error) {
      console.log('Signup response:', error.response?.data);
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
      console.log('Logout error:', error.message);
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

  // Initialize - check auth on mount
  useEffect(() => {
    const initAuth = async () => {
      // Check if we have saved user data
      const savedUser = localStorage.getItem('userData');
      
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          // Try to validate with backend
          const result = await checkAuth(true);
          if (!result.success) {
            console.log('Saved session expired, clearing...');
            localStorage.removeItem('userData');
          }
        } catch (error) {
          console.log('Error checking saved session');
          localStorage.removeItem('userData');
        }
      } else {
        // No saved user, check auth silently
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
