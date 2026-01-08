// App.jsx
import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import SignUp from "./pages/SignUp.jsx";
import SignIn from "./pages/SignIn.jsx";
import Customize from "./pages/Customize.jsx";
import Home from "./pages/Home.jsx";
import Customize2 from "./pages/Customize2.jsx";
import TestConnection from "./pages/TestConnection.jsx";
import { userDataContext } from "./context/UserContext.jsx";

function App() {
  const { userData, loadingUser, isAuthenticated } = useContext(userDataContext);

  if (loadingUser) {
    return (
      <div className="w-full h-screen flex items-center justify-center gradient-bg">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Loading your virtual assistant...</p>
          <p className="text-white/50 text-sm mt-2">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Home />
          ) : (
            <Navigate to="/signin" />
          )
        }
      />
      
      <Route 
        path="/signup" 
        element={!isAuthenticated ? <SignUp /> : <Navigate to="/" />} 
      />
      
      <Route 
        path="/signin" 
        element={!isAuthenticated ? <SignIn /> : <Navigate to="/" />} 
      />
      
      <Route 
        path="/customize" 
        element={isAuthenticated ? <Customize /> : <Navigate to="/signin" />} 
      />
      
      <Route 
        path="/customize2" 
        element={isAuthenticated ? <Customize2 /> : <Navigate to="/signin" />} 
      />
      
      <Route 
        path="/test" 
        element={<TestConnection />} 
      />
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
