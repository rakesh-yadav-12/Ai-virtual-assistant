import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import SignUp from "./pages/SignUp.jsx";
import SignIn from "./pages/SignIn.jsx";
import Customize from "./pages/Customize.jsx";
import Home from "./pages/Home.jsx";
import Customize2 from "./pages/Customize2.jsx";
import { userDataContext } from "./context/UserContext.jsx";

function App() {
  const { loadingUser, isAuthenticated, userData, authChecked } = useContext(userDataContext);

  // Show loading only on initial load
  if (loadingUser && !authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Loading Virtual Assistant...</p>
          <p className="text-white/50 text-sm mt-2">Checking authentication status</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Root redirect */}
      <Route 
        path="/" 
        element={
          isAuthenticated ? (
            userData?.assistantName ? <Home /> : <Navigate to="/customize" />
          ) : (
            <Navigate to="/signin" />
          )
        } 
      />
      
      {/* Public routes */}
      <Route 
        path="/signin" 
        element={!isAuthenticated ? <SignIn /> : <Navigate to="/" />} 
      />
      
      <Route 
        path="/signup" 
        element={!isAuthenticated ? <SignUp /> : <Navigate to="/" />} 
      />
      
      {/* Protected routes */}
      <Route 
        path="/customize" 
        element={isAuthenticated ? <Customize /> : <Navigate to="/signin" />} 
      />
      
      <Route 
        path="/customize2" 
        element={isAuthenticated ? <Customize2 /> : <Navigate to="/signin" />} 
      />
      
      <Route 
        path="/home" 
        element={isAuthenticated ? <Home /> : <Navigate to="/signin" />} 
      />
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
