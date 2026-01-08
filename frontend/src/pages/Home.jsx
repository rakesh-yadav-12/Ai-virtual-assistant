// src/pages/Home.jsx - SIMPLIFIED VERSION
import React, { useContext, useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { userDataContext } from "../context/UserContext.jsx";

function Home() {
  const { userData, getGeminiResponse, logout } = useContext(userDataContext);
  const navigate = useNavigate();

  // State
  const [command, setCommand] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assistantSpeaking, setAssistantSpeaking] = useState(false);

  // Refs
  const isMobile = useRef(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));

  // Get assistant image
  const getAssistantImage = () => {
    const localStorageImage = localStorage.getItem('selectedAssistantImage');
    if (localStorageImage) return localStorageImage;
    if (userData?.assistantImage) return userData.assistantImage;
    return "https://api.dicebear.com/7.x/avataaars/svg?seed=virtual-assistant&backgroundColor=3b82f6";
  };

  const assistantImage = getAssistantImage();

  // Handle command processing
  const handleCommand = useCallback(async (cmd) => {
    if (!cmd.trim()) return;

    setLoading(true);
    
    // Add user message
    const userMessageId = Date.now();
    setMessages(prev => [...prev, {
      id: userMessageId,
      type: "user",
      text: cmd,
      timestamp: new Date()
    }]);

    try {
      const result = await getGeminiResponse(cmd);
      
      if (result) {
        // Remove user message after a brief delay
        setTimeout(() => {
          setMessages(prev => prev.filter(msg => msg.id !== userMessageId));
        }, 2000);
        
        // Handle auth error - redirect to login
        if (result.type === "auth_error") {
          await logout();
          navigate("/signin");
          return;
        }
        
        // Add assistant message
        const assistantMessageId = Date.now();
        setMessages(prev => [...prev, {
          id: assistantMessageId,
          type: "assistant",
          text: result.response,
          timestamp: new Date(),
          actionUrl: result.actionUrl,
          requiresAction: result.requiresAction
        }]);

        // Auto-open URLs for certain actions
        if (result.actionUrl && result.requiresAction) {
          setTimeout(() => {
            window.open(result.actionUrl, '_blank', 'noopener,noreferrer');
          }, 1500);
        }

        // Remove assistant message after some time
        setTimeout(() => {
          setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
        }, 10000);
      }
    } catch (error) {
      console.log("Command processing error:", error);
    } finally {
      setLoading(false);
      setCommand("");
    }
  }, [getGeminiResponse, logout, navigate]);

  // Manual command submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (command.trim()) {
      handleCommand(command.trim());
    }
  };

  // Logout handler
  const handleLogout = async () => {
    await logout();
    navigate("/signin");
  };

  // If no user data, redirect to signin
  useEffect(() => {
    if (!userData) {
      navigate("/signin");
    }
  }, [userData, navigate]);

  if (!userData) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-gray-900 to-black overflow-hidden">
      {/* Top Bar with Logout */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition"
        >
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="h-full flex flex-col items-center justify-center p-4">
        {/* Assistant Image */}
        <div className="mb-8">
          <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-blue-500/50 shadow-2xl">
            <img 
              src={assistantImage}
              alt="Assistant" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=virtual-assistant&backgroundColor=3b82f6";
              }}
            />
          </div>
          
          {/* Assistant Name */}
          <div className="text-center mt-4">
            <h2 className="text-3xl font-bold text-white">
              {userData.assistantName || "Assistant"}
            </h2>
            <p className="text-white/70 mt-1">How can I help you today?</p>
          </div>
        </div>

        {/* Messages Display */}
        <div className="w-full max-w-2xl mb-8">
          <div className="min-h-[100px] flex flex-col items-center">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`mb-4 ${message.type === 'user' ? 'text-blue-300' : 'text-white'}`}
              >
                <div className={`p-4 rounded-xl ${message.type === 'user' ? 'bg-blue-500/10' : 'bg-white/10'}`}>
                  <p>{message.text}</p>
                  {message.actionUrl && message.requiresAction && (
                    <button
                      onClick={() => window.open(message.actionUrl, '_blank', 'noopener,noreferrer')}
                      className="mt-2 text-sm bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded-lg transition"
                    >
                      Open Link →
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
                <p className="text-white/60 text-sm mt-2">Processing your request...</p>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="w-full max-w-2xl">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative">
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Ask me anything..."
                className="w-full bg-white/10 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-sm backdrop-blur-sm pr-24"
                disabled={loading}
              />
              
              <button
                type="submit"
                disabled={loading || !command.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed w-10 h-10 rounded-full flex items-center justify-center transition"
                title="Send message"
              >
                <span>➤</span>
              </button>
            </div>
            
            <p className="text-white/40 text-sm mt-2 text-center">
              Type your command and press Enter
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Home;
