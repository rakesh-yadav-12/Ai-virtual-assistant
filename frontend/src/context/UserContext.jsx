// src/context/UserContext.jsx
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
  const [authChecked, setAuthChecked] = useState(false);

  // Silent auth check - SIMPLIFIED VERSION
  const checkAuth = useCallback(async (silent = true) => {
    try {
      if (!silent) setLoadingUser(true);
      
      const response = await fetch(`${serverUrl}/api/user/current`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
        setIsAuthenticated(true);
        localStorage.setItem('userData', JSON.stringify(data));
        return { success: true, user: data };
      }
      
      // If 401 or any error, user is not logged in
      setUserData(null);
      setIsAuthenticated(false);
      localStorage.removeItem('userData');
      return { success: false, error: "Not authenticated" };
      
    } catch (error) {
      // Network error or timeout
      console.log("Auth check network error:", error.message);
      setUserData(null);
      setIsAuthenticated(false);
      localStorage.removeItem('userData');
      return { success: false, error: "Network error" };
    } finally {
      if (!silent) setLoadingUser(false);
      setAuthChecked(true);
    }
  }, []);

  // Gemini Response function with proper error handling
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
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ command })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      
      // Handle 401 - User needs to login again
      if (response.status === 401) {
        setUserData(null);
        setIsAuthenticated(false);
        localStorage.removeItem('userData');
        
        return {
          type: "auth_error",
          userInput: command,
          response: "Your session has expired. Please log in again.",
          searchQuery: null,
          action: null,
          parameters: {},
          actionUrl: null,
          requiresAction: false,
          timestamp: new Date().toISOString()
        };
      }
      
      // Handle other errors
      const errorData = await response.json().catch(() => ({}));
      return {
        type: "error",
        userInput: command,
        response: errorData.message || "I'm having trouble connecting. Please try again.",
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

  // Login function - FIXED VERSION
  const login = useCallback(async (email, password) => {
    try {
      console.log('🔐 Attempting login...');
      
      const response = await fetch(`${serverUrl}/api/auth/signin`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok && data.user) {
        console.log('✅ Login successful, user:', data.user.email);
        setUserData(data.user);
        setIsAuthenticated(true);
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        // Wait a bit then verify
        setTimeout(async () => {
          await checkAuth(true);
        }, 500);
        
        return { success: true, data };
      }
      
      return { 
        success: false, 
        error: data.message || "Login failed" 
      };
      
    } catch (error) {
      console.error("Login error:", error);
      return { 
        success: false, 
        error: "Network error. Please try again." 
      };
    }
  }, [checkAuth]);

  // Signup function
  const signup = useCallback(async (name, email, password) => {
    try {
      console.log('📝 Creating account...');
      
      const response = await fetch(`${serverUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ name, email, password })
      });
      
      const data = await response.json();
      
      if (response.ok && data.user) {
        console.log('✅ Account created');
        setUserData(data.user);
        setIsAuthenticated(true);
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        return { success: true, data };
      }
      
      return { 
        success: false, 
        error: data.message || "Signup failed" 
      };
      
    } catch (error) {
      console.error("Signup error:", error);
      return { 
        success: false, 
        error: "Network error. Please try again." 
      };
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      console.log('🚪 Logging out...');
      await fetch(`${serverUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
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

  // Initialize - FIXED VERSION
  useEffect(() => {
    const initAuth = async () => {
      console.log('🔍 Checking authentication...');
      
      // Check localStorage first
      const savedUser = localStorage.getItem('userData');
      
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          console.log("Found saved user:", user.email);
          
          // Try to verify with server
          const result = await checkAuth(true);
          
          if (result.success) {
            console.log('✅ Session restored');
          } else {
            console.log('🔒 Session expired');
            localStorage.removeItem('userData');
          }
        } catch (error) {
          console.error("Error parsing saved user:", error);
          localStorage.removeItem('userData');
        }
      } else {
        console.log("No saved user found");
        // Still check with server in case cookies exist
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
    logout,
    getGeminiResponse
  };

  return (
    <userDataContext.Provider value={value}>
      {children}
    </userDataContext.Provider>
  );
}

export default UserContextProvider;
