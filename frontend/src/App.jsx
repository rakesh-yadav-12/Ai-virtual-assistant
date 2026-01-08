// App.jsx
import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import SignUp from "./pages/SignUp.jsx";
import SignIn from "./pages/SignIn.jsx";
import Landing from "./pages/Landing.jsx";
import Customize from "./pages/Customize.jsx";
import Home from "./pages/Home.jsx";
import Customize2 from "./pages/Customize2.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import { userDataContext } from "./context/UserContext.jsx";

function App() {
  const { loadingUser, isAuthenticated, userData } = useContext(userDataContext);

  // Show loading screen
  if (loadingUser) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/signin" element={!isAuthenticated ? <SignIn /> : <Navigate to="/home" />} />
      <Route path="/signup" element={!isAuthenticated ? <SignUp /> : <Navigate to="/home" />} />
      
      {/* Protected routes */}
      <Route path="/home" element={isAuthenticated ? <Home /> : <Navigate to="/signin" />} />
      <Route path="/customize" element={isAuthenticated ? <Customize /> : <Navigate to="/signin" />} />
      <Route path="/customize2" element={isAuthenticated ? <Customize2 /> : <Navigate to="/signin" />} />
      
      {/* Redirects */}
      <Route path="/assistant" element={<Navigate to="/home" />} />
      <Route path="/dashboard" element={<Navigate to="/home" />} />
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
