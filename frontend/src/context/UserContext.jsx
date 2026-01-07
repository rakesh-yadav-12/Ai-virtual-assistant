import React, { createContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

export const userDataContext = createContext();

const serverUrl = "https://ai-virtual-assistant-15bb.onrender.com";

// Configure axios defaults
axios.defaults.baseURL = serverUrl;
axios.defaults.withCredentials = true;

// Helper to get token from localStorage as fallback
const getTokenFromStorage = () => {
  return localStorage.getItem('token');
};

// Helper to set auth header
const setAuthHeader = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

function UserContextProvider({ children }) {
  const [userData, setUserData] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      setLoadingUser(true);
      
      // Try with cookies first
      const response = await axios.get('/api/user/current');
      
      if (response.data.user) {
        setUserData(response.data.user);
        setIsAuthenticated(true);
        
        // Also store token in localStorage as backup
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          setAuthHeader(response.data.token);
        }
        
        return response.data.user;
      }
    } catch (error) {
      console.log("Auth check failed:", error.response?.status || error.message);
      
      // Try with localStorage token as fallback
      const storedToken = getTokenFromStorage();
      if (storedToken) {
        setAuthHeader(storedToken);
        try {
          const fallbackResponse = await axios.get('/api/user/current');
          if (fallbackResponse.data.user) {
            setUserData(fallbackResponse.data.user);
            setIsAuthenticated(true);
            return fallbackResponse.data.user;
          }
        } catch (fallbackError) {
          console.log("Fallback auth also failed");
        }
      }
      
      setUserData(null);
      setIsAuthenticated(false);
    } finally {
      setLoadingUser(false);
    }
    return null;
  }, []);

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      const response = await axios.post('/api/auth/signin', {
        email,
        password
      });
      
      if (response.data.user) {
        setUserData(response.data.user);
        setIsAuthenticated(true);
        
        // Store token in localStorage as backup
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          setAuthHeader(response.data.token);
        }
        
        return { success: true, data: response.data };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { 
        success: false, 
        message: error.response?.data?.message || "Login failed" 
      };
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUserData(null);
      setIsAuthenticated(false);
      localStorage.removeItem('token');
      localStorage.removeItem('selectedAssistantImage');
      localStorage.removeItem('customAssistantImages');
      localStorage.removeItem('selectedImageIndex');
      delete axios.defaults.headers.common['Authorization'];
    }
  }, []);

  // Get Gemini response
  const getGeminiResponse = useCallback(async (command) => {
    try {
      const response = await axios.post('/api/user/ask', { command });
      return response.data;
    } catch (error) {
      console.error("Assistant error:", error);
      
      if (error.response?.status === 401) {
        // Token expired, try to refresh
        const storedToken = getTokenFromStorage();
        if (storedToken) {
          setAuthHeader(storedToken);
          // Retry once
          try {
            const retryResponse = await axios.post('/api/user/ask', { command });
            return retryResponse.data;
          } catch (retryError) {
            // If retry fails, logout
            logout();
          }
        } else {
          logout();
        }
      }
      
      return {
        type: "error",
        userInput: command,
        response: "I'm having trouble connecting. Please try again.",
        searchQuery: null,
        action: null,
        parameters: {},
        actionUrl: null,
        requiresAction: false,
        timestamp: new Date().toISOString()
      };
    }
  }, [logout]);

  // Initialize
  useEffect(() => {
    // Check for stored token on mount
    const storedToken = getTokenFromStorage();
    if (storedToken) {
      setAuthHeader(storedToken);
    }
    
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
    logout,
    getGeminiResponse,
    updateUserImage: (imageUrl) => {
      if (userData) {
        setUserData({
          ...userData,
          assistantImage: imageUrl
        });
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
