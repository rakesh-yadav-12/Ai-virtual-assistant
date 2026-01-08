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

  // Silent auth check with improved error handling
  const checkAuth = useCallback(async (silent = true) => {
    try {
      if (!silent) setLoadingUser(true);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      console.log('🔍 Checking authentication at:', `${serverUrl}/api/user/current`);
      
      const response = await fetch(`${serverUrl}/api/user/current`, {
        method: 'GET',
        credentials: 'include', // This is crucial for cookies
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ User authenticated:', data.name);
        setUserData(data);
        setIsAuthenticated(true);
        localStorage.setItem('userData', JSON.stringify(data));
        return { success: true, user: data };
      }
      
      // Handle 401 and other non-200 responses
      if (response.status === 401) {
        console.log('⚠️ User not authenticated (401)');
        setUserData(null);
        setIsAuthenticated(false);
        localStorage.removeItem('userData');
        return { success: false, error: "Not authenticated", status: 401 };
      }
      
      // Handle other errors
      console.log('⚠️ Auth check failed with status:', response.status);
      setUserData(null);
      setIsAuthenticated(false);
      localStorage.removeItem('userData');
      return { success: false, error: `Status ${response.status}`, status: response.status };
      
    } catch (error) {
      // Network error or timeout
      console.log('🌐 Network error during auth check:', error.message);
      
      // If we have cached user data, use it but mark as potentially stale
      const cachedUser = localStorage.getItem('userData');
      if (cachedUser) {
        const user = JSON.parse(cachedUser);
        console.log('📦 Using cached user data due to network error');
        setUserData(user);
        setIsAuthenticated(true);
        return { success: true, user: user, cached: true };
      }
      
      setUserData(null);
      setIsAuthenticated(false);
      return { success: false, error: "Network error" };
    } finally {
      if (!silent) setLoadingUser(false);
      setAuthChecked(true);
    }
  }, []);

  // Gemini Response function with improved auth handling
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
        console.log('🔒 Session expired during request');
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
      const errorText = await response.text();
      console.log('❌ API error:', response.status, errorText);
      
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
      console.log('🌐 Network error in getGeminiResponse:', error);
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

  // Login function with improved cookie handling
  const login = useCallback(async (email, password) => {
    try {
      console.log('🔐 Attempting login for:', email);
      
      const response = await fetch(`${serverUrl}/api/auth/signin`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include', // This sends cookies
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok && data.user) {
        console.log('✅ Login successful for:', data.user.name);
        
        // Set user data immediately
        setUserData(data.user);
        setIsAuthenticated(true);
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        // Verify login worked with a delay
        setTimeout(async () => {
          const verifyResult = await checkAuth(true);
          if (verifyResult.success) {
            console.log('✅ Session verified after login');
          } else {
            console.log('⚠️ Session verification failed after login');
          }
        }, 1000);
        
        return { success: true, data };
      }
      
      console.log('❌ Login failed:', data.message);
      return { 
        success: false, 
        error: data.message || "Login failed" 
      };
      
    } catch (error) {
      console.log('🌐 Login network error:', error);
      return { 
        success: false, 
        error: "Network error. Please try again." 
      };
    }
  }, [checkAuth]);

  // Signup function
  const signup = useCallback(async (name, email, password) => {
    try {
      console.log('📝 Creating account for:', email);
      
      const response = await fetch(`${serverUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name, email, password })
      });
      
      const data = await response.json();
      
      if (response.ok && data.user) {
        console.log('✅ Account created for:', data.user.name);
        
        // Set user data immediately
        setUserData(data.user);
        setIsAuthenticated(true);
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        return { success: true, data };
      }
      
      console.log('❌ Signup failed:', data.message);
      return { 
        success: false, 
        error: data.message || "Signup failed" 
      };
      
    } catch (error) {
      console.log('🌐 Signup network error:', error);
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
      console.log('⚠️ Logout network error:', error.message);
    } finally {
      // Always clear local state
      setUserData(null);
      setIsAuthenticated(false);
      localStorage.removeItem('userData');
      localStorage.removeItem('selectedAssistantImage');
      localStorage.removeItem('customAssistantImages');
      localStorage.removeItem('selectedImageIndex');
      console.log('✅ Logged out locally');
    }
  }, []);

  // Initialize auth on component mount
  useEffect(() => {
    const initAuth = async () => {
      console.log('🚀 Initializing authentication...');
      
      // First check if we have cached user data
      const savedUser = localStorage.getItem('userData');
      
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          console.log('📦 Found cached user:', user.name);
          
          // Try to validate the session
          const result = await checkAuth(true);
          
          if (result.success) {
            console.log('✅ Cached session is valid');
          } else if (result.status === 401) {
            console.log('🔒 Cached session expired, clearing cache');
            localStorage.removeItem('userData');
          } else {
            console.log('⚠️ Using cached data due to network issues');
          }
        } catch (error) {
          console.log('❌ Error parsing cached user data:', error);
          localStorage.removeItem('userData');
        }
      } else {
        console.log('👤 No cached user found, checking auth');
        await checkAuth(true);
      }
      
      setLoadingUser(false);
      console.log('🏁 Auth initialization complete');
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
