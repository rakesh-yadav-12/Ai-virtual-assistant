import genToken from "../config/token.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const signUp = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: "Name, email, and password are required" 
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ 
        message: "Password must be at least 6 characters long" 
      });
    }

    const existEmail = await User.findOne({ email });
    if (existEmail) {
      return res.status(400).json({ 
        message: "Email already exists!" 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      name, 
      email, 
      password: hashedPassword,
      assistantName: name + "'s Assistant"
    });

    const token = genToken(user._id);
    
    res.cookie("token", token, { 
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    const { password: _, ...safeUser } = user.toObject();
    
    return res.status(201).json({
      message: "Account created successfully!",
      user: safeUser
    });
  } catch (error) {
    console.error("Sign up error:", error.message);
    return res.status(500).json({ 
      message: "Server error during sign up",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        message: "Email and password are required" 
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        message: "Invalid email or password" 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        message: "Invalid email or password" 
      });
    }

    const token = genToken(user._id);
    
    res.cookie("token", token, { 
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    const { password: _, ...safeUser } = user.toObject();
    
    return res.status(200).json({
      message: "Login successful!",
      user: safeUser
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ 
      message: "Server error during login",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

export const logOut = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "None"
    });
    
    return res.status(200).json({ 
      message: "Logged out successfully" 
    });
  } catch (error) {
    console.error("Logout error:", error.message);
    return res.status(500).json({ 
      message: "Server error during logout" 
    });
  }
};
