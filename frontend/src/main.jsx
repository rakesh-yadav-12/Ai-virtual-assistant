import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import UserContextProvider from './context/UserContext.jsx'
import './index.css'

// Enable debugging in development
if (import.meta.env.DEV) {
  console.log('🚀 Development mode enabled');
  
  // Log cookies for debugging
  console.log('🍪 Current cookies:', document.cookie);
  
  // Fix for cookie issues in development
  document.cookie = "test_cookie=test_value; SameSite=Lax; path=/";
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <UserContextProvider>
        <App />
      </UserContextProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
