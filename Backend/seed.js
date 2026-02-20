import "dotenv/config";
import mongoose from "mongoose";
import User from "./models/User.js";

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const existing = await User.findOne({ email: "admin@certportal.com" });
  if (existing) {
    console.log("Admin user already exists");
  } else {
    await User.create({
      name: "Admin",
      email: "admin@certportal.com",
      passwordHash: "admin123",
      role: "admin",
    });
    console.log("Admin user created: admin@certportal.com / admin123");
  }

  await mongoose.disconnect();
};

seed().catch(console.error);
