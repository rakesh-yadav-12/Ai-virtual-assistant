// src/context/UserContext.jsx
import React, { createContext, useState, useEffect, useCallback } from "react";

export const userDataContext = createContext();

const serverUrl = "https://ai-virtual-assistant-20b.onrender.com";

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

  // SIMPLIFIED AUTH CHECK - No timeout, no abort controller
  const checkAuth = useCallback(async () => {
    try {
      console.log('🔍 Checking authentication status...');
      
      const response = await fetch(`${serverUrl}/api/user/current`, {
        method: 'GET',
        credentials: 'include', // THIS IS CRUCIAL - sends cookies
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Auth check response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ User authenticated:', data.email);
        setUserData(data);
        setIsAuthenticated(true);
        localStorage.setItem('userData', JSON.stringify(data));
        return { success: true, user: data };
      }
      
      // Any non-OK response means not authenticated
      console.log('🔒 Not authenticated or session expired');
      setUserData(null);
      setIsAuthenticated(false);
      localStorage.removeItem('userData');
      return { success: false, error: "Not authenticated" };
      
    } catch (error) {
      console.log('⚠️ Network error during auth check:', error.message);
      // Don't clear data on network errors - might be temporary
      return { success: false, error: "Network error" };
    }
  }, []);

  // SIMPLIFIED LOGIN FUNCTION
  const login = useCallback(async (email, password) => {
    try {
      console.log('🔐 Attempting login for:', email);
      
      const response = await fetch(`${serverUrl}/api/auth/signin`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include', // THIS IS CRUCIAL
        body: JSON.stringify({ email, password })
      });
      
      console.log('Login response status:', response.status);
      
      const data = await response.json();
      
      if (response.ok && data.user) {
        console.log('✅ Login successful!');
        console.log('User data received:', data.user);
        
        // Store user data
        setUserData(data.user);
        setIsAuthenticated(true);
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        // Verify login worked immediately
        const authResult = await checkAuth();
        
        if (authResult.success) {
          console.log('✅ Session confirmed');
          return { success: true, data };
        } else {
          console.log('⚠️ Session verification failed');
          // Still return success since login worked, but warn
          return { 
            success: true, 
            data,
            warning: "Session verification failed but login succeeded"
          };
        }
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
  }, [checkAuth]);

  // SIMPLIFIED SIGNUP
  const signup = useCallback(async (name, email, password) => {
    try {
      console.log('📝 Creating account for:', email);
      
      const response = await fetch(`${serverUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include', // THIS IS CRUCIAL
        body: JSON.stringify({ name, email, password })
      });
      
      console.log('Signup response status:', response.status);
      
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
  }, []);

  // SIMPLIFIED LOGOUT
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
      console.log('✅ Logged out');
    }
  }, []);

  // SIMPLIFIED GEMINI RESPONSE
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
      
      const response = await fetch(`${serverUrl}/api/user/ask`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ command })
      });
      
      console.log('Gemini response status:', response.status);
      
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
  }, []);

  // INITIAL AUTH CHECK - SIMPLIFIED
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
          const result = await checkAuth();
          
          if (result.success) {
            console.log('✅ Session restored from localStorage');
          } else {
            console.log('🔒 Saved session expired');
            localStorage.removeItem('userData');
          }
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
