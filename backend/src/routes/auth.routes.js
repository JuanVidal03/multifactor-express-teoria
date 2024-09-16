import { Router } from "express";
import { register, login, verifyOTP } from "../controllers/auth.controller.js";

const authRouter = Router();

authRouter.post("/login", login);
authRouter.post("/register", register);
authRouter.post("/verify-otp", verifyOTP);

export default authRouter;
