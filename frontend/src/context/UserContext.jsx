// src/context/UserContext.jsx - FINAL WORKING VERSION
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

  // Custom fetch that handles errors silently
  const silentFetch = useCallback(async (endpoint, options = {}) => {
    const url = `${serverUrl}${endpoint}`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, {
        ...options,
        credentials: 'include',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return await response.json();
      }
      
      // For 401, return null without throwing error
      if (response.status === 401) {
        return null;
      }
      
      return null;
    } catch (error) {
      // Network or timeout error - return null
      return null;
    }
  }, []);

  // Check authentication - SILENT
  const checkAuth = useCallback(async () => {
    try {
      const data = await silentFetch('/api/user/current');
      
      if (data && data._id) {
        setUserData(data);
        setIsAuthenticated(true);
        localStorage.setItem('userData', JSON.stringify(data));
        return { success: true, user: data };
      }
      
      // Not authenticated - clear data
      setUserData(null);
      setIsAuthenticated(false);
      localStorage.removeItem('userData');
      return { success: false };
      
    } catch (error) {
      // Should not reach here
      setUserData(null);
      setIsAuthenticated(false);
      localStorage.removeItem('userData');
      return { success: false };
    }
  }, [silentFetch]);

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
        
        // Verify login worked
        await checkAuth();
        
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
  }, [checkAuth]);

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
    }
  }, []);

  // Initialize
  useEffect(() => {
    const initAuth = async () => {
      // Check localStorage first
      const savedUser = localStorage.getItem('userData');
      
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          const result = await checkAuth();
          if (!result.success) {
            localStorage.removeItem('userData');
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
    logout
  };

  return (
    <userDataContext.Provider value={value}>
      {children}
    </userDataContext.Provider>
  );
}

export default UserContextProvider;
