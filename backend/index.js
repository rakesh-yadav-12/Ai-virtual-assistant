// In your backend index.js
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

// More permissive CORS for testing
app.use(cors({
  origin: function (origin, callback) {
    // Allow all origins during development/testing
    // In production, you should restrict this to your frontend domains
    const allowedOrigins = [
      'https://ai-virtual-assistant-21f.onrender.com'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      console.warn(`Blocked by CORS: ${origin}`);
      callback(null, true); // Still allow for now
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cookies', 'Cookie'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static files
app.use("/public", express.static(path.join(__dirname, "public")));

// Logging middleware - Debug CORS and cookies
app.use((req, res, next) => {
  console.log(`
    ${new Date().toISOString()}
    ${req.method} ${req.url}
    Origin: ${req.headers.origin || 'No origin'}
    Cookies: ${JSON.stringify(req.cookies)}
    Auth Header: ${req.headers.authorization || 'No auth header'}
  `);
  next();
});

// Health check - No auth required
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    service: "Virtual Assistant API",
    cookies: req.cookies,
    origin: req.headers.origin
  });
});

// Public test endpoint
app.get("/api/test", (req, res) => {
  res.status(200).json({ 
    message: "API is working",
    cookies: req.cookies,
    headers: req.headers
  });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

// Welcome route
app.get("/", (req, res) => {
  res.json({ 
    message: "Virtual Assistant API", 
    version: "1.0.0",
    status: "Running",
    endpoints: {
      auth: "/api/auth",
      user: "/api/user",
      test: "/api/test",
      health: "/health"
    }
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
  
  // Handle CORS errors
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ 
      message: "CORS Error: Access denied",
      error: err.message
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
      console.log(`🌐 CORS: Allowing all origins for now`);
      console.log(`📁 Public files at: /public`);
      console.log(`🔗 Health check: https://ai-virtual-assistant-20b.onrender.com/health`);
      console.log(`🔗 Test endpoint: https://ai-virtual-assistant-20b.onrender.com/api/test`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
