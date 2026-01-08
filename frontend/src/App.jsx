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

  console.log("🔄 App rendering - Auth status:", {
    isAuthenticated,
    hasUserData: !!userData,
    loadingUser,
    authChecked
  });

  return (
    <Routes>
      {/* Root route - smart redirect */}
      <Route 
        path="/" 
        element={
          isAuthenticated && userData ? (
            // User is logged in
            userData.assistantName ? 
              <Home /> : // Has assistant name, go to home
              <Customize /> // No assistant name, go to customize
          ) : (
            // User is not logged in
            <Navigate to="/signin" />
          )
        } 
      />
      
      {/* Public routes */}
      <Route 
        path="/signin" 
        element={
          isAuthenticated ? 
            <Navigate to="/" /> : 
            <SignIn />
        } 
      />
      
      <Route 
        path="/signup" 
        element={
          isAuthenticated ? 
            <Navigate to="/" /> : 
            <SignUp />
        } 
      />
      
      {/* Protected routes */}
      <Route 
        path="/customize" 
        element={
          isAuthenticated ? 
            <Customize /> : 
            <Navigate to="/signin" />
        } 
      />
      
      <Route 
        path="/customize2" 
        element={
          isAuthenticated ? 
            <Customize2 /> : 
            <Navigate to="/signin" />
        } 
      />
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
