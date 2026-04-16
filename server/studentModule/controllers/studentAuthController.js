const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const StudentAuth = require("../models/StudentAuth");
require("dotenv").config();

const registerStudent = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    const existingStudent = await StudentAuth.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: "Student already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newStudent = new StudentAuth({
      name,
      email,
      phone,
      password: hashedPassword,
    });

    await newStudent.save();

    return res.status(201).json({
      success: true,
      message: "Account created successfully"
    });
  } catch (error) {
    console.error("Student registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

const loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const student = await StudentAuth.findOne({ email });
    if (!student) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, student.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { id: student._id, email: student.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      token,
      email: student.email,
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        createdAt: student.createdAt,
      },
    });
  } catch (error) {
    console.error("Student login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

module.exports = {
  registerStudent,
  loginStudent,
};
