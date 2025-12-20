import React from "react";
import { FaRobot } from "react-icons/fa";

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col items-center justify-center text-white p-6">
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 flex items-center justify-center mb-8">
          <FaRobot className="text-4xl text-accent-blue animate-pulse-slow" />
        </div>
        <div className="absolute -inset-8 pulse-ring rounded-full"></div>
      </div>
      
      <h1 className="text-2xl font-bold mb-4 gradient-text">
        Virtual Assistant
      </h1>
      <p className="text-gray-400 mb-8 text-center max-w-md">
        Loading your personalized AI experience...
      </p>
      
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-accent-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-accent-purple rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-accent-pink rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
}

export default LoadingScreen;