// src/context/UserContext.jsx
import React, { createContext, useState, useEffect, useCallback } from "react";

export const userDataContext = createContext();

// Use proxy URL for development, direct URL for production
const getServerUrl = () => {
  if (import.meta.env.DEV) {
    return ''; // Use proxy during development
  }
  return "https://ai-virtual-assistant-20b.onrender.com";
};

function UserContextProvider({ children }) {
  const [userData, setUserData] = useState(() => {
    try {
      const saved = localStorage.getItem('userData');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loadingUser, setLoadingUser] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Function to make API calls with proper credentials
  const apiFetch = useCallback(async (endpoint, options = {}) => {
    const serverUrl = getServerUrl();
    const url = `${serverUrl}${endpoint}`;
    
    console.log(`🌐 API Call: ${endpoint}`);
    
    const defaultOptions = {
      credentials: 'include', // Include cookies
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };
    
    try {
      const response = await fetch(url, defaultOptions);
      console.log(`📡 Response: ${response.status} ${response.statusText} for ${endpoint}`);
      return response;
    } catch (error) {
      console.error(`❌ Fetch error for ${endpoint}:`, error);
      throw error;
    }
  }, []);

  // Check authentication
  const checkAuth = useCallback(async () => {
    try {
      console.log('🔍 Checking authentication...');
      
      const response = await apiFetch('/api/user/current', {
        method: 'GET',
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ User authenticated:', data.email);
        setUserData(data);
        setIsAuthenticated(true);
        localStorage.setItem('userData', JSON.stringify(data));
        return { success: true, user: data };
      }
      
      // If not authenticated, clear data
      console.log('🔒 Not authenticated or session expired');
      setUserData(null);
      setIsAuthenticated(false);
      localStorage.removeItem('userData');
      return { success: false, error: "Not authenticated" };
      
    } catch (error) {
      console.log('⚠️ Network error during auth check:', error.message);
      // Don't clear data on network errors
      return { success: false, error: "Network error" };
    }
  }, [apiFetch]);

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      console.log('🔐 Attempting login for:', email);
      
      const response = await apiFetch('/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok && data.user) {
        console.log('✅ Login successful!');
        console.log('User data received:', data.user);
        
        // Store user data
        setUserData(data.user);
        setIsAuthenticated(true);
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        // Wait a moment, then verify the session
        setTimeout(async () => {
          await checkAuth();
        }, 100);
        
        return { success: true, data };
      }
      
      console.log('❌ Login failed:', data.message);
      return { 
        success: false, 
        error: data.message || "Login failed. Please check credentials." 
      };
      
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: "Network error. Please check your connection." 
      };
    }
  }, [apiFetch, checkAuth]);

  // Signup function
  const signup = useCallback(async (name, email, password) => {
    try {
      console.log('📝 Creating account for:', email);
      
      const response = await apiFetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      });
      
      const data = await response.json();
      
      if (response.ok && data.user) {
        console.log('✅ Account created successfully!');
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
      console.error('Signup error:', error);
      return { 
        success: false, 
        error: "Network error. Please try again." 
      };
    }
  }, [apiFetch]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      console.log('🚪 Logging out...');
      await apiFetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.log('Logout error:', error.message);
    } finally {
      setUserData(null);
      setIsAuthenticated(false);
      localStorage.removeItem('userData');
      console.log('✅ Logged out');
    }
  }, [apiFetch]);

  // Get Gemini response
  const getGeminiResponse = useCallback(async (command) => {
    if (!command || typeof command !== "string") {
      return {
        type: "error",
        response: "Please provide a valid command",
        timestamp: new Date().toISOString()
      };
    }

    try {
      console.log('🤖 Sending command:', command.substring(0, 50));
      
      const response = await apiFetch('/api/user/ask', {
        method: 'POST',
        body: JSON.stringify({ command })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Response received');
        return data;
      }
      
      if (response.status === 401) {
        // Session expired
        setUserData(null);
        setIsAuthenticated(false);
        localStorage.removeItem('userData');
        
        return {
          type: "auth_error",
          response: "Your session has expired. Please log in again.",
          timestamp: new Date().toISOString()
        };
      }
      
      const errorData = await response.json().catch(() => ({}));
      return {
        type: "error",
        response: errorData.message || "I'm having trouble connecting. Please try again.",
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Gemini API error:', error);
      return {
        type: "error",
        response: "Network error. Please check your connection.",
        timestamp: new Date().toISOString()
      };
    }
  }, [apiFetch]);

  // Initialize auth
  useEffect(() => {
    const initAuth = async () => {
      console.log('🚀 Initializing app...');
      
      // Check localStorage first
      const savedUser = localStorage.getItem('userData');
      
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          console.log('📦 Found saved user:', user.email);
          
          // Try to verify with server
          await checkAuth();
        } catch (error) {
          console.error('Error loading saved user:', error);
          localStorage.removeItem('userData');
        }
      } else {
        console.log('👤 No saved user found');
      }
      
      setLoadingUser(false);
      setAuthChecked(true);
    };
    
    initAuth();
  }, [checkAuth]);

  const value = {
    serverUrl: getServerUrl(),
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
