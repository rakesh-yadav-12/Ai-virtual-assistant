import React, {
  createContext,
  useState,
  useEffect,
  useCallback
} from "react";
import axios from "axios";

export const userDataContext = createContext(null);

const serverUrl =
  import.meta.env.VITE_API_URL ||
  "https://ai-virtual-assistant-backend-8epx.onrender.com";

axios.defaults.withCredentials = true;
axios.defaults.timeout = 30000;

function UserContextProvider({ children }) {
  const [userData, setUserData] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ✅ Check authentication
  const checkAuth = useCallback(async () => {
    try {
      setLoadingUser(true);
      const res = await axios.get(`${serverUrl}/api/user/current`);

      if (res.data) {
        setUserData(res.data);
        setIsAuthenticated(true);
        return res.data;
      }
    } catch (err) {
      console.log("Not authenticated:", err.response?.status || err.message);
      setUserData(null);
      setIsAuthenticated(false);
    } finally {
      setLoadingUser(false);
    }
    return null;
  }, []);

  // ✅ Gemini / Assistant request
  const getGeminiResponse = useCallback(async (command) => {
    if (!command || typeof command !== "string") {
      return {
        type: "error",
        response: "Please provide a valid command",
        timestamp: new Date().toISOString()
      };
    }

    try {
      const res = await axios.post(
        `${serverUrl}/api/user/ask`,
        { command },
        { withCredentials: true }
      );

      return res.data;
    } catch (error) {
      console.error("Assistant error:", error);

      if (error.response?.status === 401) {
        setUserData(null);
        setIsAuthenticated(false);
        return {
          type: "auth_error",
          response: "Please log in again.",
          timestamp: new Date().toISOString()
        };
      }

      if (error.response?.status === 429) {
        return {
          type: "quota_error",
          response: "Service busy. Try again shortly.",
          timestamp: new Date().toISOString()
        };
      }

      return {
        type: "error",
        response: "Connection issue. Please try again.",
        timestamp: new Date().toISOString()
      };
    }
  }, []);

  // ✅ Update preferences
  const updatePreferences = useCallback(async (preferences) => {
    try {
      const res = await axios.post(
        `${serverUrl}/api/user/update`,
        { preferences },
        { withCredentials: true }
      );

      if (res.data?.user) {
        setUserData(res.data.user);
      }

      return res.data;
    } catch (err) {
      console.error("Update preferences error:", err);
      return null;
    }
  }, []);

  // ✅ Logout
  const logout = useCallback(async () => {
    try {
      await axios.post(`${serverUrl}/api/auth/logout`, {}, { withCredentials: true });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUserData(null);
      setIsAuthenticated(false);
      localStorage.clear();
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <userDataContext.Provider
      value={{
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
            setUserData({ ...userData, assistantImage: imageUrl });
          }
        }
      }}
    >
      {children}
    </userDataContext.Provider>
  );
}

export default UserContextProvider;
