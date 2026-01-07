// middleware/auth.middleware.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    console.log('Auth middleware - Checking cookies:', req.cookies);
    console.log('Auth middleware - Headers:', req.headers.authorization);
    
    // Get token from cookies first
    let token = req.cookies?.token;
    
    // If no cookie, check Authorization header
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('Using Bearer token from header');
    }

    if (!token) {
      console.log('❌ No token found');
      return res.status(401).json({
        success: false,
        message: "Not authenticated. Please login.",
        authenticated: false
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
        authenticated: false
      });
    }

    // Attach user to request
    req.user = user;
    console.log('✅ User authenticated:', user.email);
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
        authenticated: false
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: "Token expired",
        authenticated: false
      });
    }
    
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
      authenticated: false
    });
  }
};
