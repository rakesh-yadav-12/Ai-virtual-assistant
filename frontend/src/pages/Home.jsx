import React, { useContext, useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { userDataContext } from "../context/UserContext.jsx";

function Home() {
  const { userData, getGeminiResponse, logout } = useContext(userDataContext);
  const navigate = useNavigate();

  // State
  const [isListening, setIsListening] = useState(false);
  const [command, setCommand] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  const [assistantSpeaking, setAssistantSpeaking] = useState(false);
  const [assistantImageGlow, setAssistantImageGlow] = useState(false);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  
  // New state for features
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("main");

  // Refs
  const recognitionRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const menuRef = useRef(null);
  const isMobile = useRef(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));

  // Get assistant image
  const getAssistantImage = () => {
    const localStorageImage = localStorage.getItem('selectedAssistantImage');
    if (localStorageImage) return localStorageImage;
    if (userData?.assistantImage) return userData.assistantImage;
    return "https://api.dicebear.com/7.x/avataaars/svg?seed=virtual-assistant&backgroundColor=3b82f6";
  };

  const assistantImage = getAssistantImage();

  // Text-to-speech function optimized for mobile
  const speakText = useCallback((text) => {
    if (!text || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Mobile-friendly voice settings
    utterance.rate = isMobile.current ? 0.9 : 1.0; // Slower on mobile for better clarity
    utterance.pitch = isMobile.current ? 1.0 : 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      setAssistantSpeaking(true);
      setAssistantImageGlow(true);
    };

    utterance.onend = () => {
      setAssistantSpeaking(false);
      setAssistantImageGlow(false);
    };

    utterance.onerror = () => {
      setAssistantSpeaking(false);
      setAssistantImageGlow(false);
    };

    // On mobile, wait for user interaction if needed
    window.speechSynthesis.speak(utterance);
  }, []);

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
        
        // Speak the response
        speakText(result.response);

        // Auto-open URLs for certain actions
        if (result.actionUrl && result.requiresAction) {
          setTimeout(() => {
            window.open(result.actionUrl, '_blank', 'noopener,noreferrer');
          }, 1500);
        }

        // Remove assistant message after speaking completes
        setTimeout(() => {
          setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
        }, 10000);
      } else {
        // Add error message
        const errorMsg = "Sorry, I couldn't process that. Please try again.";
        setMessages(prev => [...prev, {
          id: Date.now() + 3,
          type: "assistant",
          text: errorMsg,
          timestamp: new Date()
        }]);
        speakText(errorMsg);
        
        setTimeout(() => {
          setMessages(prev => prev.filter(msg => msg.id !== userMessageId));
        }, 1500);
      }
    } catch (error) {
      console.error("Command processing error:", error);
      const errorMsg = "There was an error. Please try again.";
      
      // Remove user message on error
      setTimeout(() => {
        setMessages(prev => prev.filter(msg => msg.id !== userMessageId));
      }, 1500);
      
      // Add error message
      const errorMessageId = Date.now();
      setMessages(prev => [...prev, {
        id: errorMessageId,
        type: "assistant",
        text: errorMsg,
        timestamp: new Date()
      }]);
      speakText(errorMsg);
      
      // Remove error message after speaking
      setTimeout(() => {
        setMessages(prev => prev.filter(msg => msg.id !== errorMessageId));
      }, 6000);
    } finally {
      setLoading(false);
      setWakeWordDetected(false);
      setCommand("");
    }
  }, [getGeminiResponse, speakText]);

  // Initialize speech recognition with mobile optimizations
  const initSpeechRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      console.warn("Speech recognition not supported");
      setMicPermissionDenied(true);
      return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Mobile-specific settings
    recognition.continuous = !isMobile.current; // Continuous only on desktop
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    
    // Adjust for mobile
    if (isMobile.current) {
      recognition.continuous = false;
    }

    recognition.onstart = () => {
      setIsListening(true);
      setMicPermissionDenied(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setWakeWordDetected(false);
      
      // Auto-restart only on desktop, not mobile
      if (!isMobile.current && recognitionRef.current) {
        setTimeout(() => {
          try {
            recognitionRef.current.start();
          } catch (err) {
            console.log("Recognition restart error:", err);
          }
        }, 500);
      }
    };

    recognition.onresult = (event) => {
      clearTimeout(silenceTimeoutRef.current);
      
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Update command display with interim results
      if (interimTranscript) {
        setCommand(interimTranscript.trim());
      }

      // Process final transcript
      if (finalTranscript) {
        setCommand(finalTranscript.trim());
        
        // Check for wake word
        const lowerTranscript = finalTranscript.toLowerCase().trim();
        const assistantName = userData?.assistantName?.toLowerCase() || "assistant";
        
        if (lowerTranscript.includes(assistantName) || wakeWordDetected) {
          if (!wakeWordDetected && lowerTranscript.includes(assistantName)) {
            setWakeWordDetected(true);
            
            // Remove wake word from command
            const commandWithoutWake = lowerTranscript.replace(assistantName, '').trim();
            if (commandWithoutWake) {
              handleCommand(commandWithoutWake);
            }
          } else if (wakeWordDetected) {
            handleCommand(finalTranscript.trim());
          }
        }
        
        // Reset silence timer
        silenceTimeoutRef.current = setTimeout(() => {
          setCommand("");
        }, 2000);
      }
    };

    recognition.onerror = (event) => {
      console.error("Recognition error:", event.error);
      setIsListening(false);
      
      // Handle permission errors
      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        setMicPermissionDenied(true);
      }
    };

    return recognition;
  }, [userData?.assistantName, wakeWordDetected, handleCommand]);

  // Manual command submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (command.trim()) {
      handleCommand(command.trim());
    }
  };

  // Start/Stop listening manually (for mobile)
  const toggleListening = async () => {
    if (isListening) {
      stopListening();
    } else {
      await startListening();
    }
  };

  // Start listening with permission check
  const startListening = async () => {
    // On mobile, we need to check permissions differently
    if (isMobile.current) {
      try {
        // Request microphone permission
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // Stop immediately
        
        // Initialize recognition
        if (!recognitionRef.current) {
          recognitionRef.current = initSpeechRecognition();
        }
        
        // Start recognition with delay for mobile
        setTimeout(() => {
          try {
            if (recognitionRef.current) {
              recognitionRef.current.start();
            }
          } catch (err) {
            console.log("Mobile start error:", err);
          }
        }, 300);
        
      } catch (error) {
        console.error("Microphone permission denied:", error);
        setMicPermissionDenied(true);
        alert("Please allow microphone access in your browser settings to use voice commands.");
      }
    } else {
      // Desktop
      if (!recognitionRef.current) {
        recognitionRef.current = initSpeechRecognition();
      }
      
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        recognitionRef.current.start();
      } catch (error) {
        console.error("Microphone error:", error);
        setMicPermissionDenied(true);
      }
    }
  };

  // Stop listening
  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.log("Stop error:", err);
      }
    }
    setIsListening(false);
    setWakeWordDetected(false);
  };

  // Logout handler
  const handleLogout = async () => {
    stopListening();
    window.speechSynthesis.cancel();
    await logout();
    navigate("/signin");
    setMenuOpen(false);
    setActiveTab("main");
  };

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
        setActiveTab("main");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (userData) {
      // Don't auto-start on mobile - wait for user interaction
      if (!isMobile.current) {
        // Start recognition on desktop only
        recognitionRef.current = initSpeechRecognition();
        
        const startDesktopRecognition = async () => {
          try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            if (recognitionRef.current) {
              setTimeout(() => {
                try {
                  recognitionRef.current.start();
                } catch (err) {
                  console.log("Starting recognition...");
                }
              }, 800);
            }
          } catch (error) {
            console.log("Microphone access needed on desktop");
            setMicPermissionDenied(true);
          }
        };

        startDesktopRecognition();
      }
    }

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {}
      }
      
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      
      window.speechSynthesis.cancel();
    };
  }, [userData, initSpeechRecognition]);

  // Load voices for speech synthesis
  useEffect(() => {
    if ('speechSynthesis' in window) {
      // Some browsers need this to populate voices
      setTimeout(() => {
        window.speechSynthesis.getVoices();
      }, 1000);
    }
  }, []);

  if (!userData) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Initializing your assistant...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen gradient-bg overflow-hidden">
      {/* User Avatar Hamburger Menu */}
      <div className="absolute top-4 right-4 z-50" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="relative w-12 h-12 rounded-full overflow-hidden border-3 border-blue-500/50 bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-blue-500/30 active:scale-9"
          aria-label="User menu"
        >
          <img 
            src={assistantImage}
            alt="User avatar"
            className="w-full h-full object-cover"
          />
          
          {/* Active indicator dot */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse"></div>
        </button>

        {/* Dropdown Menu */}
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-gray-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/20 overflow-hidden z-50 animate-fadeIn">
            {/* User Info Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-blue-500/50">
                    <img 
                      src={assistantImage}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1">
                    <div className="relative">
                      <div className="w-4 h-4 bg-green-500 rounded-full animate-ping opacity-75"></div>
                      <div className="absolute top-1 left-1 w-2 h-2 bg-green-400 rounded-full"></div>
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-lg">{userData.name || "User"}</p>
                  <p className="text-sm text-green-400 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    {isListening ? "Listening" : assistantSpeaking ? "Speaking" : "Active"}
                  </p>
                  <p className="text-xs text-white/60">Assistant: {userData.assistantName || "Assistant"}</p>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setActiveTab("main")}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === "main" ? 'text-blue-400 border-b-2 border-blue-400' : 'text-white/70 hover:text-white'}`}
              >
                Menu
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === "settings" ? 'text-purple-400 border-b-2 border-purple-400' : 'text-white/70 hover:text-white'}`}
              >
                Settings
              </button>
            </div>

            {/* Tab Content */}
            <div className="max-h-96 overflow-y-auto">
              {/* Main Menu Tab */}
              {activeTab === "main" && (
                <div className="p-3 space-y-2">
                  <button
                    onClick={() => {
                      navigate("/customize");
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30">
                      <span className="text-blue-400">⚙️</span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium">Customize Assistant</p>
                      <p className="text-xs text-white/60">Change avatar & name</p>
                    </div>
                    <div className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      →
                    </div>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-red-500/20 group-hover:bg-red-500/30">
                      <span className="text-red-400">🚪</span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium">Log Out</p>
                      <p className="text-xs text-white/60">Sign out from account</p>
                    </div>
                    <div className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      →
                    </div>
                  </button>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === "settings" && (
                <div className="p-3">
                  <div className="space-y-3">
                    {/* Microphone Permission Status */}
                    <div className="p-3 rounded-lg bg-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">Microphone</p>
                        <div className={`w-3 h-3 rounded-full ${micPermissionDenied ? 'bg-red-500' : 'bg-green-500'}`}></div>
                      </div>
                      <p className="text-sm text-white/70">
                        {micPermissionDenied 
                          ? "Microphone access denied. Please allow in browser settings." 
                          : "Microphone is ready for voice commands"}
                      </p>
                      {micPermissionDenied && (
                        <button
                          onClick={() => {
                            // Guide user to settings
                            if (isMobile.current) {
                              alert("Go to browser settings > Site permissions > Microphone, and allow access for this site.");
                            }
                          }}
                          className="mt-2 text-sm text-blue-400 hover:text-blue-300"
                        >
                          Fix microphone access
                        </button>
                      )}
                    </div>
                    
                    {/* Voice Commands Toggle */}
                    <div className="p-3 rounded-lg bg-white/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Voice Commands</p>
                          <p className="text-sm text-white/70">Toggle listening</p>
                        </div>
                        <button
                          onClick={toggleListening}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                            isListening ? 'bg-green-500' : 'bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                              isListening ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      {isMobile.current && (
                        <p className="text-xs text-yellow-400 mt-2">
                          On mobile, tap the microphone button below to start listening
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content - Centered Assistant Image */}
      <div className="h-full flex flex-col items-center justify-center p-4 pt-20">
        {/* Large Assistant Image */}
        <div className="mb-6 relative">
          <div className={`relative w-64 h-64 md:w-80 md:h-80 lg:w-60 lg:h-80 rounded-3xl overflow-hidden  transition-all duration-500 ${
            assistantImageGlow 
              ? 'border-blue-500 shadow-[0_0_60px_rgba(59,130,246,0.9)] scale-105' 
              : 'border-white/30'
          }`}>
            <img 
              src={assistantImage}
              alt="Assistant" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=virtual-assistant&backgroundColor=3b82f6";
              }}
            />
            
            {/* Listening indicator */}
            {isListening && (
              <div className="absolute -top-2 -right-2 w-10 h-10 bg-green-500 rounded-full animate-pulse flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-full"></div>
              </div>
            )}
            
            {/* Speaking animation */}
            {assistantSpeaking && (
              <div className="absolute inset-0 rounded-3xl">
                <div className="absolute inset-0 bg-blue-500/30 animate-ping rounded-3xl"></div>
                <div className="absolute inset-6 bg-blue-500/20 animate-ping rounded-2xl" style={{animationDelay: '0.2s'}}></div>
                <div className="absolute inset-12 bg-blue-500/10 animate-ping rounded-xl" style={{animationDelay: '0.4s'}}></div>
              </div>
            )}
          </div>
          
          {/* Assistant Name */}
          <div className="text-center mt-4">
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              I am {userData.assistantName || "Assistant"}
            </h2>
            <p className="text-white/70 mt-1 text-sm">
              {isListening ? "🎤 Listening..." : assistantSpeaking ? "🗣️ Speaking..." : "💭 Ready to assist"}
            </p>
          </div>
        </div>

        {/* Live Conversation Text Display */}
        <div className="w-full max-w-2xl">
          {/* Text Display Area */}
          <div className="min-h-[100px] flex flex-col justify-center items-center">
            {/* Display Current Messages */}
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`text-center animate-fadeIn ${
                  message.type === 'user' 
                    ? 'text-blue-300 font-medium text-lg' 
                    : 'text-white text-xl font-semibold'
                }`}
              >
                {message.type === 'user' && (
                  <div className="animate-slideUp">
                    <p className="text-blue-300/80 italic">"{message.text}"</p>
                    <div className="flex justify-center mt-2">
                      <div className="w-4 h-1 bg-blue-400/50 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                )}
                
                {message.type === 'assistant' && (
                  <div className="animate-scaleIn px-4">
                    <p className="text-white leading-relaxed">{message.text}</p>
                    {/* Show action button if available */}
                    {message.actionUrl && message.requiresAction && (
                      <button
                        onClick={() => window.open(message.actionUrl, '_blank', 'noopener,noreferrer')}
                        className="mt-2 text-sm bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded-lg transition"
                      >
                        Open Link →
                      </button>
                    )}
                    {/* Small speaking indicator dots */}
                    {assistantSpeaking && (
                      <div className="flex justify-center gap-2 mt-4">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {/* Loading Animation */}
            {loading && (
              <div className="animate-fadeIn text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
                <p className="text-white/60 text-sm mt-2">Processing your request...</p>
              </div>
            )}
            
            {/* Status Message when no conversation */}
            {messages.length === 0 && !loading && !assistantSpeaking && (
              <div className="animate-fadeIn text-center">
                <p className="text-white/60 text-lg">
                  {isMobile.current ? (
                    <>
                      Tap the <span className="text-blue-300 font-medium">microphone button</span> below to start speaking
                    </>
                  ) : (
                    <>
                      Say "<span className="text-blue-300 font-medium">I am</span>" or "
                      <span className="text-blue-300 font-medium">{userData.assistantName || "Assistant"}</span>" to activate
                    </>
                  )}
                </p>
                <p className="text-white/40 text-sm mt-2">
                  Or type your message below
                </p>
              </div>
            )}
          </div>

          {/* Input Area with Mobile Microphone Button */}
          <form onSubmit={handleSubmit} className="mt-8 relative">
            <div className="relative">
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder={
                  isMobile.current 
                    ? "Type your message here..." 
                    : `Say "I am" or "${userData.assistantName || 'Assistant'}" to activate...`
                }
                className="w-full bg-white/10 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-sm backdrop-blur-sm pr-24"
                disabled={loading}
              />
              
              {/* Mobile Microphone Button */}
              {isMobile.current && (
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isListening 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                  title={isListening ? "Stop listening" : "Start listening"}
                >
                  <span className="text-white text-lg">
                    {isListening ? '⏹️' : '🎤'}
                  </span>
                </button>
              )}
              
              {/* Send Button (for typing) */}
              <button
                type="submit"
                disabled={loading || !command.trim()}
                className={`absolute ${isMobile.current ? 'right-16' : 'right-2'} top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed w-10 h-10 rounded-full flex items-center justify-center transition`}
                title="Send message"
              >
                <span>➤</span>
              </button>
            </div>
            
            {/* Status Messages */}
            <div className="mt-2 text-center">
              {micPermissionDenied && (
                <p className="text-red-400 text-xs animate-pulse">
                  ❌ Microphone access denied. Please allow in browser settings.
                </p>
              )}
              
              {isMobile.current && !micPermissionDenied && (
                <p className="text-white/70 text-xs">
                  {isListening ? "🎤 Tap the button again to stop" : "🎤 Tap the microphone to speak"}
                </p>
              )}
              
              {!isMobile.current && (
                <p className="text-xs text-white/50">
                  {isListening ? "🎤 Assistant is listening..." : "💡 Ready for voice commands"}
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
      
      {/* Add custom animations for CSS */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.98);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out forwards;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out forwards;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        
        /* Mobile optimizations */
        @media (max-width: 768px) {
          .gradient-bg {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          }
        }
      `}</style>
    </div>
  );
}

export default Home;
