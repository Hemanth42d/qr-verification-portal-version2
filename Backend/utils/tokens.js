import jwt from "jsonwebtoken";
import env from "../config/env.js";

export const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, env.jwtSecret, { expiresIn: "15m" });
};

export const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, env.jwtRefreshSecret, { expiresIn: "7d" });
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.jwtRefreshSecret);
};

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
