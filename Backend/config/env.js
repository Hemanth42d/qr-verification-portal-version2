const env = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
};

export default env;
