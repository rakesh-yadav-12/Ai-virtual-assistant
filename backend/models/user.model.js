import mongoose from "mongoose";

const historySchema = new mongoose.Schema({
  command: { type: String, required: true },
  response: { type: String, required: true },
  type: { type: String, required: true },
  actionTaken: { type: Boolean, default: false },
  searchQuery: { type: String },
  timestamp: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  assistantName: { 
    type: String, 
    default: "Assistant" 
  },
  assistantImage: { 
    type: String,
    default: null 
  },
  preferences: {
    voiceSpeed: { type: Number, default: 1 },
    voicePitch: { type: Number, default: 1 },
    theme: { type: String, default: "dark" },
    language: { type: String, default: "en-US" }
  },
  history: [historySchema],
  shortcuts: [{
    keyword: String,
    action: String,
    url: String
  }],
  location: {
    city: String,
    country: String,
    timezone: String
  },
  integrations: {
    openWeatherApiKey: String,
    newsApiKey: String
  },
  lastActive: { type: Date, default: Date.now }
}, { 
  timestamps: true 
});

const User = mongoose.model("User", userSchema);
export default User;