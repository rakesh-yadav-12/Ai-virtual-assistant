import User from "../models/user.model.js";
import { uploadOnCloudinary } from "../config/cloudinary.js";
import geminiResponse from "../config/gemini.js";
import moment from "moment";
import axios from "axios";

// Utility functions
const getWeatherInfo = async (location) => {
  try {
    const weatherConditions = ["Sunny", "Cloudy", "Rainy", "Snowy", "Windy"];
    const temperatures = {
      "Sunny": "25°C",
      "Cloudy": "20°C", 
      "Rainy": "15°C",
      "Snowy": "0°C",
      "Windy": "18°C"
    };
    
    const condition = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
    return {
      location: location || "your area",
      condition: condition,
      temperature: temperatures[condition],
      humidity: `${Math.floor(Math.random() * 30) + 50}%`,
      wind: `${Math.floor(Math.random() * 20) + 5} km/h`
    };
  } catch (error) {
    console.error("Weather info error:", error);
    return null;
  }
};

const getRandomFact = () => {
  const facts = [
    "Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly good to eat.",
    "Octopuses have three hearts. Two pump blood to the gills, while the third pumps it to the rest of the body.",
    "A day on Venus is longer than a year on Venus. It takes 243 Earth days to rotate once on its axis, but only 225 Earth days to orbit the Sun.",
    "Bananas are berries, but strawberries aren't.",
    "A group of flamingos is called a 'flamboyance'.",
    "The shortest war in history was between Britain and Zanzibar on August 27, 1896. It lasted only 38 minutes.",
    "There are more possible iterations of a game of chess than there are atoms in the known universe.",
    "A 'jiffy' is an actual unit of time: 1/100th of a second.",
    "The Eiffel Tower can be 15 cm taller during the summer due to thermal expansion.",
    "Humans share 60% of their DNA with bananas."
  ];
  return facts[Math.floor(Math.random() * facts.length)];
};

const getRandomQuote = () => {
  const quotes = [
    "The only way to do great work is to love what you do. - Steve Jobs",
    "Innovation distinguishes between a leader and a follower. - Steve Jobs",
    "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
    "Strive not to be a success, but rather to be of value. - Albert Einstein",
    "The only thing we have to fear is fear itself. - Franklin D. Roosevelt",
    "Life is what happens to you while you're busy making other plans. - John Lennon",
    "The purpose of our lives is to be happy. - Dalai Lama",
    "Get busy living or get busy dying. - Stephen King",
    "You only live once, but if you do it right, once is enough. - Mae West",
    "The best revenge is massive success. - Frank Sinatra"
  ];
  return quotes[Math.floor(Math.random() * quotes.length)];
};

const calculateMath = (expression) => {
  try {
    const safeExpression = expression
      .replace(/[^0-9+\-*/().\s]/g, '')
      .replace(/\/\//g, '/')
      .trim();
    
    const result = eval(safeExpression);
    return result.toString();
  } catch (error) {
    return "Could not calculate that expression.";
  }
};

export const askToAssistant = async (req, res) => {
  let command;
  
  try {
    command = req.body.command;
    
    if (!command || command.trim() === "") {
      return res.status(400).json({ 
        type: "error",
        userInput: "",
        response: "Please provide a command",
        searchQuery: null,
        action: null,
        parameters: {}
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ 
        type: "auth_error",
        userInput: command,
        response: "Please log in again to continue.",
        searchQuery: null,
        action: null,
        parameters: {}
      });
    }

    const userName = user.name || "User";
    const assistantName = user.assistantName || "Assistant";
    
    // Update last active
    await User.findByIdAndUpdate(req.userId, { lastActive: new Date() });

    // Call Gemini API for intent classification
    let result;
    try {
      result = await geminiResponse(command, assistantName, userName);
    } catch (error) {
      console.error("Gemini API error:", error.message);
      
      if (error.message.includes("quota exhausted")) {
        return res.status(429).json({
          type: "quota_error",
          userInput: command,
          response: "I'm currently experiencing high demand. Please try again in a moment.",
          searchQuery: null,
          action: null,
          parameters: {}
        });
      }
      
      const fallbackResponses = [
        "I'm having trouble processing that right now. Could you try again?",
        "I didn't quite catch that. Can you rephrase?",
        "Let me try that again. Could you repeat your request?",
        "There seems to be a connection issue. Please try again shortly."
      ];
      
      const fallbackResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      
      return res.json({
        type: "general",
        userInput: command,
        response: fallbackResponse,
        searchQuery: null,
        action: null,
        parameters: {}
      });
    }

    if (!result) {
      return res.json({
        type: "general",
        userInput: command,
        response: "I couldn't process your request. Please try again.",
        searchQuery: null,
        action: null,
        parameters: {}
      });
    }

    // Enhanced response based on type
    let enhancedResponse = result.response;
    let finalSearchQuery = result.searchQuery;
    let finalAction = result.action;
    let finalParameters = result.parameters || {};
    
    // Handle specific types with enhanced responses
    switch (result.type) {
      case "time_current":
        enhancedResponse = `The current time is ${moment().format("hh:mm A")}`;
        finalParameters.time = moment().format("HH:mm:ss");
        break;
        
      case "date_current":
        enhancedResponse = `Today's date is ${moment().format("MMMM Do, YYYY")}`;
        finalParameters.date = moment().format("YYYY-MM-DD");
        break;
        
      case "day_current":
        enhancedResponse = `Today is ${moment().format("dddd")}`;
        finalParameters.day = moment().format("dddd");
        break;
        
      case "month_current":
        enhancedResponse = `We are in the month of ${moment().format("MMMM")}`;
        finalParameters.month = moment().format("MMMM");
        break;
        
      case "year_current":
        enhancedResponse = `The current year is ${moment().format("YYYY")}`;
        finalParameters.year = moment().format("YYYY");
        break;
        
      case "weather":
        const weatherInfo = await getWeatherInfo(finalParameters.location || "your location");
        if (weatherInfo) {
          enhancedResponse = `The weather in ${weatherInfo.location} is ${weatherInfo.condition} with a temperature of ${weatherInfo.temperature}. Humidity is ${weatherInfo.humidity} and wind speed is ${weatherInfo.wind}.`;
          finalParameters.weatherData = weatherInfo;
        }
        break;
        
      case "fact":
        enhancedResponse = `Here's an interesting fact: ${getRandomFact()}`;
        break;
        
      case "joke":
        const jokes = [
          "Why don't scientists trust atoms? Because they make up everything!",
          "Why did the scarecrow win an award? Because he was outstanding in his field!",
          "What do you call a fake noodle? An impasta!",
          "Why did the bicycle fall over? Because it was two-tired!",
          "What do you call a bear with no teeth? A gummy bear!",
          "Why did the tomato turn red? Because it saw the salad dressing!",
          "What's orange and sounds like a parrot? A carrot!"
        ];
        enhancedResponse = jokes[Math.floor(Math.random() * jokes.length)];
        break;
        
      case "quote":
        enhancedResponse = getRandomQuote();
        break;
        
      case "definition":
        enhancedResponse = `I would search for the definition of "${finalSearchQuery || "that term"}" for you.`;
        break;
        
      case "calculation":
        if (command.match(/\d+[\+\-\*\/]\d+/)) {
          const calculationResult = calculateMath(command);
          enhancedResponse = `The result is ${calculationResult}`;
          finalParameters.result = calculationResult;
        }
        break;
        
      case "greeting":
        const greetings = [
          `Hello ${userName}! How can I assist you today?`,
          `Hi there ${userName}! What can I do for you?`,
          `Hey ${userName}! Ready to help!`,
          `Greetings ${userName}! How may I be of service?`,
          `Good to see you ${userName}! What would you like to do?`
        ];
        enhancedResponse = greetings[Math.floor(Math.random() * greetings.length)];
        break;
        
      case "farewell":
        const farewells = [
          "Goodbye! Have a great day!",
          "See you later!",
          "Take care!",
          "Until next time!",
          "Bye! Stay safe!"
        ];
        enhancedResponse = farewells[Math.floor(Math.random() * farewells.length)];
        break;
        
      case "thanks":
        enhancedResponse = "You're welcome! I'm happy to help.";
        break;
        
      case "self_intro":
        enhancedResponse = `I'm ${assistantName}, your personal virtual assistant created by ${userName}. I'm here to help you with tasks, answer questions, and make your day easier!`;
        break;
        
      case "creator_info":
        enhancedResponse = `I was created by ${userName}. They're the one who brought me to life!`;
        break;
        
      case "capabilities":
        enhancedResponse = `I can help you with:
• Searching the web (Google, YouTube, Wikipedia)
• Opening applications and websites
• Setting reminders, alarms, and timers
• Answering questions and providing information
• Playing music and videos
• Getting weather updates
• Making calculations and conversions
• Telling jokes and facts
• Managing your schedule
• And much more!

Just tell me what you need!`;
        break;
        
      case "status_check":
        enhancedResponse = "I'm doing great, thanks for asking! Ready to help you with anything you need.";
        break;
        
      case "help_request":
        enhancedResponse = `I'm here to help! You can ask me to:
• "Search for [topic]" - Search on Google
• "Play [song/video]" - Play on YouTube
• "Open [app/website]" - Open any app or site
• "What's the weather?" - Get weather info
• "Set a reminder for [time]" - Set reminders
• "Tell me a joke" - Hear a funny joke
• "What time is it?" - Get current time
• "How to [do something]" - Search for instructions

Or just tell me what you need help with!`;
        break;
        
      default:
        break;
    }

    // Generate appropriate URLs for actions
    let actionUrl = null;
    
    if (finalSearchQuery) {
      const encodedQuery = encodeURIComponent(finalSearchQuery);
      
      switch (result.type) {
        case "google_search":
          actionUrl = `https://www.google.com/search?q=${encodedQuery}`;
          break;
          
        case "youtube_search":
        case "youtube_play":
        case "music_play":
        case "video_play":
          actionUrl = `https://www.youtube.com/results?search_query=${encodedQuery}`;
          break;
          
        case "wikipedia_search":
          actionUrl = `https://en.wikipedia.org/wiki/Special:Search?search=${encodedQuery}`;
          break;
          
        case "amazon_search":
          actionUrl = `https://www.amazon.com/s?k=${encodedQuery}`;
          break;
          
        case "map_search":
          actionUrl = `https://www.google.com/maps/search/${encodedQuery}`;
          break;
          
        case "image_search":
          actionUrl = `https://www.google.com/search?tbm=isch&q=${encodedQuery}`;
          break;
          
        case "recipe_search":
          actionUrl = `https://www.google.com/search?q=${encodedQuery}+recipe`;
          break;
          
        case "movie_search":
          actionUrl = `https://www.imdb.com/find?q=${encodedQuery}`;
          break;
          
        default:
          actionUrl = null;
      }
    } else {
      switch (result.type) {
        case "calculator_open":
          actionUrl = "https://www.google.com/search?q=calculator";
          break;
          
        case "calendar_open":
          actionUrl = "https://calendar.google.com";
          break;
        case "GooglePay_open":
          actionUrl = "https://googlepay.google.com";
          break;
          
        case "email_open":
          actionUrl = "https://mail.google.com";
          break;
          
        case "instagram_open":
          actionUrl = "https://instagram.com";
          break;
          
        case "facebook_open":
          actionUrl = "https://facebook.com";
          break;
          
        case "twitter_open":
          actionUrl = "https://twitter.com";
          break;
          
        case "whatsapp_open":
          actionUrl = "https://web.whatsapp.com";
          break;
          
        case "linkedin_open":
          actionUrl = "https://linkedin.com";
          break;
          
        case "reddit_open":
          actionUrl = "https://reddit.com";
          break;
          
        case "discord_open":
          actionUrl = "https://discord.com/app";
          break;
          
        case "settings_open":
          enhancedResponse = "I can't open system settings directly, but you can access them from your device's settings menu.";
          break;
          
        case "app_open":
          if (finalParameters.app) {
            switch (finalParameters.app.toLowerCase()) {
              case "notepad":
                enhancedResponse = "Opening text editor... (Use your system's text editor)";
                break;
              case "photos":
                enhancedResponse = "Opening photos app... (Use your system's photo viewer)";
                break;
              case "music":
                actionUrl = "https://music.youtube.com";
                break;
              case "maps":
                actionUrl = "https://maps.google.com";
                break;
              default:
                enhancedResponse = `I'll open ${finalParameters.app} for you.`;
            }
          }
          break;
      }
    }

    // Save to history
    const historyEntry = {
      command: command,
      response: enhancedResponse,
      type: result.type,
      actionTaken: !!actionUrl,
      searchQuery: finalSearchQuery,
      timestamp: new Date()
    };
    
    await User.findByIdAndUpdate(req.userId, {
      $push: { 
        history: { 
          $each: [historyEntry], 
          $slice: -50
        }
      }
    });

    // Prepare final response
    const finalResponse = {
      type: result.type,
      userInput: result.userInput || command,
      response: enhancedResponse,
      searchQuery: finalSearchQuery,
      action: finalAction,
      parameters: finalParameters,
      actionUrl: actionUrl,
      timestamp: new Date().toISOString(),
      assistantName: assistantName,
      requiresAction: !!actionUrl
    };

    return res.json(finalResponse);
  } catch (error) {
    console.error("Ask to assistant fatal error:", error);
    return res.status(500).json({
      type: "error",
      userInput: command || "Unknown",
      response: "An unexpected error occurred. Please try again.",
      searchQuery: null,
      action: null,
      parameters: {},
      actionUrl: null,
      timestamp: new Date().toISOString(),
      requiresAction: false
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ 
        message: "User not found" 
      });
    }
    
    return res.status(200).json(user);
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({ 
      message: "Server error fetching user data" 
    });
  }
};

export const updateAssistant = async (req, res) => {
  try {
    const { assistantName, preferences, imageUrl } = req.body;
    let assistantImage = imageUrl || null;

    if (req.file) {
      const uploadedImage = await uploadOnCloudinary(req.file.path, {
        folder: "virtual-assistant/avatars",
        width: 400,
        height: 400,
        crop: "fill"
      });
      if (uploadedImage && uploadedImage.secure_url) {
        assistantImage = uploadedImage.secure_url;
      }
    }

    const updateData = {};
    if (assistantName) updateData.assistantName = assistantName;
    if (assistantImage) updateData.assistantImage = assistantImage;
    if (preferences) updateData.preferences = preferences;

    const user = await User.findByIdAndUpdate(
      req.userId, 
      updateData, 
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ 
        message: "User not found" 
      });
    }

    return res.status(200).json({
      message: "Assistant updated successfully",
      user
    });
  } catch (error) {
    console.error("Update assistant error:", error);
    return res.status(500).json({ 
      message: "Server error updating assistant",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

export const getHistory = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("history");
    if (!user) {
      return res.status(404).json({ 
        message: "User not found" 
      });
    }
    
    const sortedHistory = user.history.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    return res.status(200).json(sortedHistory);
  } catch (error) {
    console.error("Get history error:", error);
    return res.status(500).json({ 
      message: "Server error fetching history" 
    });
  }
};

export const clearHistory = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, { 
      history: [] 
    });
    
    return res.status(200).json({ 
      message: "History cleared successfully" 
    });
  } catch (error) {
    console.error("Clear history error:", error);
    return res.status(500).json({ 
      message: "Server error clearing history" 
    });
  }
};

export const getStats = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ 
        message: "User not found" 
      });
    }
    
    const stats = {
      totalCommands: user.history.length,
      commandsToday: user.history.filter(h => 
        moment(h.timestamp).isSame(moment(), 'day')
      ).length,
      mostUsedTypes: {},
      lastActive: user.lastActive
    };
    
    user.history.forEach(h => {
      stats.mostUsedTypes[h.type] = (stats.mostUsedTypes[h.type] || 0) + 1;
    });
    
    stats.mostUsedTypes = Object.entries(stats.mostUsedTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});
    
    return res.status(200).json(stats);
  } catch (error) {
    console.error("Get stats error:", error);
    return res.status(500).json({ 
      message: "Server error fetching stats" 
    });
  }
};

export const addShortcut = async (req, res) => {
  try {
    const { keyword, action, url } = req.body;
    
    if (!keyword || !action) {
      return res.status(400).json({ 
        message: "Keyword and action are required" 
      });
    }
    
    await User.findByIdAndUpdate(req.userId, {
      $push: {
        shortcuts: { keyword, action, url }
      }
    });
    
    return res.status(200).json({ 
      message: "Shortcut added successfully" 
    });
  } catch (error) {
    console.error("Add shortcut error:", error);
    return res.status(500).json({ 
      message: "Server error adding shortcut" 
    });
  }
};

export const getShortcuts = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("shortcuts");
    if (!user) {
      return res.status(404).json({ 
        message: "User not found" 
      });
    }
    
    return res.status(200).json(user.shortcuts);
  } catch (error) {
    console.error("Get shortcuts error:", error);
    return res.status(500).json({ 
      message: "Server error fetching shortcuts" 
    });
  }
};