// routes/user.routes.js
import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { 
  getCurrentUser,
  updateUserPreferences,
  askAssistant 
} from '../controllers/user.controller.js';

const router = express.Router();

// Get current user (protected)
router.get('/current', protect, getCurrentUser);

// Update user preferences (protected)
router.post('/update', protect, updateUserPreferences);

// Ask assistant (protected)
router.post('/ask', protect, askAssistant);

// Debug endpoint
router.get('/debug', (req, res) => {
  res.json({
    cookies: req.cookies,
    authenticated: !!req.cookies?.token,
    timestamp: new Date().toISOString()
  });
});

export default router;
