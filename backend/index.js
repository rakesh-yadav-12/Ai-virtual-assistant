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

// CORS configuration
const FRONTEND_URL = process.env.FRONTEND_URL || "https://ai-virtual-assistant-fr.onrender.com";

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static files
app.use("/public", express.static(path.join(__dirname, "public")));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    service: "Virtual Assistant API" 
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
    status: "Running"
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
      console.log(`🌐 CORS enabled for: ${FRONTEND_URL}`);
      console.log(`📁 Public files at: /public`);
      console.log(`🔗 Health check: http://localhost:${port}/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
