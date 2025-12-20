import express from "express";
import {
  askToAssistant,
  getCurrentUser,
  updateAssistant,
  getHistory,
  clearHistory,
  getStats,
  addShortcut,
  getShortcuts
} from "../controllers/user.controllers.js";
import isAuth from "../middlewares/isAuth.js";
import upload from "../middlewares/multer.js";

const userRouter = express.Router();

// User info
userRouter.get("/current", isAuth, getCurrentUser);

// Assistant customization
userRouter.post(
  "/update",
  isAuth,
  upload.single("assistantImage"),
  updateAssistant
);

// Main assistant functionality
userRouter.post("/ask", isAuth, askToAssistant);

// History management
userRouter.get("/history", isAuth, getHistory);
userRouter.delete("/history", isAuth, clearHistory);

// Stats and analytics
userRouter.get("/stats", isAuth, getStats);

// Shortcuts management
userRouter.post("/shortcuts", isAuth, addShortcut);
userRouter.get("/shortcuts", isAuth, getShortcuts);

export default userRouter;