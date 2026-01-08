import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import UserContextProvider from './context/UserContext.jsx'
import './index.css'

// Enable detailed logging in development
if (import.meta.env.DEV) {
  console.log('🚀 Development mode enabled');
  console.log('🔧 Environment:', import.meta.env.MODE);
  console.log('🌐 API URL:', import.meta.env.VITE_API_URL);
  
  // Log all fetch requests
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    console.log('📤 Fetch request:', args[0]);
    return originalFetch.apply(this, args);
  };
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
