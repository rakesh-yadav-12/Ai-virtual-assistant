import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import connectDb from "./config/db.js";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS configuration for multiple origins
const allowedOrigins = [
  "https://ai-virtual-assistant-15f.onrender.com",
  "https://ai-virtual-assistant-15bb.onrender.com",
  "http://localhost:5173",
  "http://localhost:3000"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Set-Cookie']
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Important: Trust proxy for Render/Heroku
app.set('trust proxy', 1);

// Logging middleware with more details
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  console.log('Origin:', req.headers.origin);
  console.log('Cookies:', req.cookies);
  next();
});

// Static files
app.use("/public", express.static(path.join(__dirname, "public")));

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    service: "Virtual Assistant API",
    cookies: req.cookies,
    origin: req.headers.origin
  });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

// Debug endpoint for cookies
app.get("/api/debug/cookies", (req, res) => {
  res.json({
    cookies: req.cookies,
    headers: req.headers,
    origin: req.headers.origin,
    secure: req.secure,
    hostname: req.hostname
  });
});

// Welcome route
app.get("/", (req, res) => {
  res.json({ 
    message: "Virtual Assistant API", 
    version: "1.0.0",
    status: "Running",
    frontend: "https://ai-virtual-assistant-15f.onrender.com"
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    message: "Route not found",
    path: req.url 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      message: "Validation error",
      errors: err.errors 
    });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      message: "Invalid token" 
    });
  }

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      message: 'CORS Error',
      allowedOrigins: allowedOrigins,
      yourOrigin: req.headers.origin
    });
  }
  
  res.status(500).json({ 
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined
  });
});

const startServer = async () => {
  try {
    await connectDb();
    
    app.listen(port, () => {
      console.log(`🚀 Server started on port ${port}`);
      console.log(`✅ MongoDB connected`);
      console.log(`🌐 CORS enabled for:`, allowedOrigins);
      console.log(`📁 Public files at: /public`);
      console.log(`🔗 Health check: http://localhost:${port}/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
