import express from "express";
import { login, signup, logout } from "../controllers/auth.controller.js";

const authRouter = express.Router();

authRouter.post("/signup", signup);
authRouter.post("/signin", login);
authRouter.post("/logout", logout);

export default authRouter;
