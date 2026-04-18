const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Owner = require("../models/OwnerLogin");
require("dotenv").config();

const router = express.Router();

// POST /auth/signup - Create new owner account
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    // Validate password length (8-16 characters)
    if (password.length < 8 || password.length > 16) {
      return res.status(400).json({
        success: false,
        message: "Password must be between 8 and 16 characters",
      });
    }

    // Check if user already exists
    const existingOwner = await Owner.findOne({ email });
    if (existingOwner) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Hash password using bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new owner
    const newOwner = new Owner({
      name,
      email,
      password: hashedPassword,
    });

    // Save to MongoDB
    await newOwner.save();

    return res.status(201).json({
      success: true,
      message: "Account created successfully. Please login.",
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
});

// POST /auth/login - Owner login and generate JWT token
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find owner by email
    const owner = await Owner.findOne({ email });
    if (!owner) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Compare password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, owner.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT token with 7-day expiration
    const token = jwt.sign(
      { id: owner._id, email: owner.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
});

module.exports = router;