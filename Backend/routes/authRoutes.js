import { Router } from "express";
import { register, login } from "../controllers/authController.js";
import { refreshAccessToken, logout, getMe } from "../controllers/authController2.js";
import { authenticate } from "../middleware/auth.js";
import { validateRegistration, validateLogin } from "../middleware/validate.js";

const router = Router();

router.post("/register", validateRegistration, register);
router.post("/login", validateLogin, login);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logout);
router.get("/me", authenticate, getMe);

export default router;
