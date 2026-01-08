// App.jsx
import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import SignUp from "./pages/SignUp.jsx";
import SignIn from "./pages/SignIn.jsx";
import Customize from "./pages/Customize.jsx";
import Home from "./pages/Home.jsx";
import Customize2 from "./pages/Customize2.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import { userDataContext } from "./context/UserContext.jsx";

function App() {
  const { userData, loadingUser, isAuthenticated, authChecked } = useContext(userDataContext);

  // Show loading screen only on initial load
  if (loadingUser && !authChecked) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? (
            userData?.assistantImage && userData?.assistantName ? (
              <Home />
            ) : (
              <Navigate to="/customize" />
            )
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
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
