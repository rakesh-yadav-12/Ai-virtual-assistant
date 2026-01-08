// src/context/UserContext.jsx - COMPLETE FIXED VERSION
import React, { createContext, useState, useEffect, useCallback } from "react";

export const userDataContext = createContext();

const serverUrl = "https://ai-virtual-assistant-20b.onrender.com";

function UserContextProvider({ children }) {
  const [userData, setUserData] = useState(() => {
    const saved = localStorage.getItem('userData');
    return saved ? JSON.parse(saved) : null;
  });
  const [loadingUser, setLoadingUser] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Silent auth check
  const checkAuth = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${serverUrl}/api/user/current`, {
        method: 'GET',
        credentials: 'include',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
        setIsAuthenticated(true);
        localStorage.setItem('userData', JSON.stringify(data));
        return { success: true, user: data };
      }
      
      // 401 is expected - user is not logged in
      setUserData(null);
      setIsAuthenticated(false);
      localStorage.removeItem('userData');
      return { success: false, error: "Not authenticated" };
      
    } catch (error) {
      // Network error or timeout
      setUserData(null);
      setIsAuthenticated(false);
      localStorage.removeItem('userData');
      return { success: false, error: "Network error" };
    }
  }, []);

  // Gemini Response function
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
      const response = await fetch(`${serverUrl}/api/user/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ command })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      
      // Handle errors
      if (response.status === 401) {
        setUserData(null);
        setIsAuthenticated(false);
        localStorage.removeItem('userData');
        
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
      
    } catch (error) {
      return {
        type: "error",
        userInput: command,
        response: "Network error. Please check your connection.",
        searchQuery: null,
        action: null,
        parameters: {},
        actionUrl: null,
        requiresAction: false,
        timestamp: new Date().toISOString()
      };
    }
  }, []);

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      const response = await fetch(`${serverUrl}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok && data.user) {
        setUserData(data.user);
        setIsAuthenticated(true);
        localStorage.setItem('userData', JSON.stringify(data.user));
        console.log('✅ Login successful');
        return { success: true, data };
      }
      
      return { 
        success: false, 
        error: data.message || "Login failed" 
      };
      
    } catch (error) {
      return { 
        success: false, 
        error: "Network error. Please try again." 
      };
    }
  }, []);

  // Signup function
  const signup = useCallback(async (name, email, password) => {
    try {
      const response = await fetch(`${serverUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password })
      });
      
      const data = await response.json();
      
      if (response.ok && data.user) {
        setUserData(data.user);
        setIsAuthenticated(true);
        localStorage.setItem('userData', JSON.stringify(data.user));
        console.log('✅ Account created');
        return { success: true, data };
      }
      
      return { 
        success: false, 
        error: data.message || "Signup failed" 
      };
      
    } catch (error) {
      return { 
        success: false, 
        error: "Network error. Please try again." 
      };
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await fetch(`${serverUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      // Silent error
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

  // Initialize
  useEffect(() => {
    const initAuth = async () => {
      console.log('🔍 Checking authentication...');
      
      // Check localStorage first
      const savedUser = localStorage.getItem('userData');
      
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          const result = await checkAuth();
          if (!result.success) {
            console.log('🔒 Session expired');
            localStorage.removeItem('userData');
          } else {
            console.log('✅ Session restored');
          }
        } catch {
          localStorage.removeItem('userData');
        }
      } else {
        await checkAuth();
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
    logout,
    getGeminiResponse // Add this
  };

  return (
    <userDataContext.Provider value={value}>
      {children}
    </userDataContext.Provider>
  );
}

export default UserContextProvider;
