// controllers/auth.controller.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Login function
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie with proper settings for cross-domain
    res.cookie('token', token, {
      httpOnly: true,
      secure: true, // Must be true for HTTPS
      sameSite: 'none', // Required for cross-domain
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      domain: '.onrender.com', // Allow all subdomains on Render
      path: '/'
    });

    // Remove password from response
    const userWithoutPassword = { ...user._doc };
    delete userWithoutPassword.password;

    res.status(200).json({
      message: "Login successful",
      user: userWithoutPassword,
      token: token // Also send token in response for localStorage option
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Signup function
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create user
    const user = new User({ name, email, password });
    await user.save();

    // Create token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      domain: '.onrender.com',
      path: '/'
    });

    // Remove password from response
    const userWithoutPassword = { ...user._doc };
    delete userWithoutPassword.password;

    res.status(201).json({
      message: "User created successfully",
      user: userWithoutPassword,
      token: token
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Logout function
export const logout = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      domain: '.onrender.com',
      path: '/'
    });
    
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Check auth status
export const checkAuth = async (req, res) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ 
        message: "Not authenticated",
        authenticated: false 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        message: "User not found",
        authenticated: false 
      });
    }

    res.status(200).json({
      authenticated: true,
      user: user
    });
  } catch (error) {
    console.error("Auth check error:", error);
    res.status(401).json({ 
      message: "Not authenticated",
      authenticated: false 
    });
  }
};
