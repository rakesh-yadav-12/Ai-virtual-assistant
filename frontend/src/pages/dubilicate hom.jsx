import React, { useContext, useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { userDataContext } from "../context/userContext.jsx";

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

  // Refs
  const recognitionRef = useRef(null);
  const silenceTimeoutRef = useRef(null);

  // Get assistant image
  const getAssistantImage = () => {
    const localStorageImage = localStorage.getItem('selectedAssistantImage');
    if (localStorageImage) return localStorageImage;
    if (userData?.assistantImage) return userData.assistantImage;
    return "https://api.dicebear.com/7.x/avataaars/svg?seed=virtual-assistant&backgroundColor=3b82f6";
  };

  const assistantImage = getAssistantImage();

  // Text-to-speech function
  const speakText = useCallback((text) => {
    if (!text || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(voice => voice.lang.startsWith('en')) || voices[0];
    
    if (englishVoice) utterance.voice = englishVoice;
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
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

  // Initialize speech recognition
  const initSpeechRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      console.warn("Speech recognition not supported");
      return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
      setWakeWordDetected(false);
      
      // Auto-restart
      setTimeout(() => {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (err) {
            console.log("Restarting recognition...");
          }
        }
      }, 300);
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

  // Logout handler
  const handleLogout = async () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {}
    }
    
    window.speechSynthesis.cancel();
    await logout();
    navigate("/signin");
  };

  // Initialize speech recognition on mount
  useEffect(() => {
    if (userData) {
      recognitionRef.current = initSpeechRecognition();
      
      const startRecognition = async () => {
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
          console.log("Microphone access needed");
        }
      };

      startRecognition();
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

  // Add welcome message
  useEffect(() => {
    if (userData && messages.length === 0) {
      setTimeout(() => {
        const welcomeMessage = {
          id: Date.now(),
          type: "assistant",
          text: `Hello ${userData.name}! I'm ${userData.assistantName}, your personal assistant. Say my name to activate me.`,
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
        speakText(welcomeMessage.text);
        
        // Remove welcome message after speaking
        setTimeout(() => {
          setMessages([]);
        }, 6000);
      }, 1200);
    }
  }, [userData, messages.length, speakText]);

  // Load voices for speech synthesis
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
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
      {/* Top Right Buttons */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={() => navigate("/customize")}
          className="px-4 py-2 bg-white/10 hover:bg-white/15 backdrop-blur-sm rounded-xl text-white transition flex items-center gap-2 text-sm"
          title="Customize Assistant"
        >
          ⚙️ Customize
        </button>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm rounded-xl text-red-300 transition text-sm"
          title="Logout"
        >
          🚪 Logout
        </button>
      </div>

      {/* Main Content - Centered Assistant Image */}
      <div className="h-full flex flex-col items-center justify-center p-4">
        {/* Large Assistant Image */}
        <div className="mb-6 relative">
          <div className={`relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-full overflow-hidden border-8 transition-all duration-500 ${
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
              <div className="absolute inset-0 rounded-full">
                <div className="absolute inset-0 bg-blue-500/30 animate-ping rounded-full"></div>
                <div className="absolute inset-6 bg-blue-500/20 animate-ping rounded-full" style={{animationDelay: '0.2s'}}></div>
                <div className="absolute inset-12 bg-blue-500/10 animate-ping rounded-full" style={{animationDelay: '0.4s'}}></div>
              </div>
            )}
          </div>
          
          {/* Assistant Name */}
          <div className="text-center mt-4">
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              I am {userData.assistantName || "Assistant"}
            </h2>
            <p className="text-white/70 mt-1 text-sm">
              {isListening ? "🎤 Listening..." : "💭 Ready to assist"}
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
            
            {/* Voice Wave Animation (When assistant is speaking) */}
            {assistantSpeaking && messages.length > 0 && messages[messages.length - 1].type === 'assistant' && (
              <div className="mt-4 flex items-center justify-center gap-3 animate-fadeIn">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-10 bg-gradient-to-t from-blue-400 to-blue-600 rounded-full animate-voiceWave"
                    style={{
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: '0.8s'
                    }}
                  ></div>
                ))}
              </div>
            )}
            
            {/* Status Message when no conversation */}
            {messages.length === 0 && !loading && !assistantSpeaking && (
              <div className="animate-fadeIn text-center">
                <p className="text-white/60 text-lg">
                  Say "<span className="text-blue-300 font-medium">I am</span>" or "
                  <span className="text-blue-300 font-medium">{userData.assistantName || "Assistant"}</span>" to activate
                </p>
                <p className="text-white/40 text-sm mt-2">
                  Or type your message below
                </p>
              </div>
            )}
          </div>

          {/* Simple Input (optional for typing) */}
          <form onSubmit={handleSubmit} className="mt-8">
            <div className="relative">
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder={`Say "I am" or "${userData.assistantName || 'Assistant'}" to activate...`}
                className="w-full bg-white/10 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-sm backdrop-blur-sm"
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
            <p className="text-xs text-white/50 text-center mt-2">
              {isListening ? "🎤 Assistant is listening..." : "💡 Ready for voice commands"}
            </p>
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
        
        @keyframes voiceWave {
          0%, 100% {
            transform: scaleY(0.2);
          }
          50% {
            transform: scaleY(1);
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
        
        .animate-voiceWave {
          animation: voiceWave 0.8s ease-in-out infinite;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default Home;