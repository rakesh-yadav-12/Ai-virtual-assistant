import React, { createContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

export const userDataContext = createContext();

// Fixed the serverUrl assignment - added proper quotes
const serverUrl = "https://ai-virtual-assistant-8b.onrender.com";

axios.defaults.withCredentials = true;
axios.defaults.timeout = 30;

function UserContextProvider({ children }) {
  const [userData, setUserData] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      setLoadingUser(true);
      const response = await axios.get(`${serverUrl}/api/user/current`);
      
      if (response.data) {
        setUserData(response.data);
        setIsAuthenticated(true);
        return response.data;
      }
    } catch (error) {
      console.log("Not authenticated:", error.response?.status || error.message);
      setUserData(null);
      setIsAuthenticated(false);
    } finally {
      setLoadingUser(false);
    }
    return null;
  }, []);

  // Get Gemini response with enhanced error handling
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
        `${serverUrl}/api/user/ask`,
        { command },
        { withCredentials: true }
      );
      
      return response.data;
    } catch (error) {
      console.error("Assistant error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      // Handle specific errors
      if (error.response?.status === 401) {
        setUserData(null);
        setIsAuthenticated(false);
        return {
          type: "auth_error",
          userInput: command,
          response: "Please log in again to continue.",
          searchQuery: null,
          action: null,
          parameters: {},
          actionUrl: null,
          requiresAction: false,
          timestamp: new Date().toISOString()
        };
      }
      
      if (error.response?.status === 429) {
        return {
          type: "quota_error",
          userInput: command,
          response: "Service is currently busy. Please try again in a moment.",
          searchQuery: null,
          action: null,
          parameters: {},
          actionUrl: null,
          requiresAction: false,
          timestamp: new Date().toISOString()
        };
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

  // Update user preferences
  const updatePreferences = useCallback(async (preferences) => {
    try {
      const response = await axios.post(
        `${serverUrl}/api/user/update`,
        { preferences },
        { withCredentials: true }
      );
      
      if (response.data.user) {
        setUserData(response.data.user);
      }
      
      return response.data;
    } catch (error) {
      console.error("Update preferences error:", error);
      return null;
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await axios.post(`${serverUrl}/api/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUserData(null);
      setIsAuthenticated(false);
      // Clear localStorage on logout
      localStorage.removeItem('selectedAssistantImage');
      localStorage.removeItem('customAssistantImages');
      localStorage.removeItem('selectedImageIndex');
    }
  }, []);

  // Initialize
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
    getGeminiResponse,
    updatePreferences,
    logout,
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
