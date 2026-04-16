const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// Import all routes
const authRoutes = require("./routes/auth");
const studentRoutes = require("./routes/studentRoutes");
const courseRoutes = require("./routes/courseRoutes");
const packageRoutes = require("./routes/packageRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const reportRoutes = require("./routes/reportRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const studentAuthRoutes = require("./studentModule/routes/studentAuthRoutes");

const app = express();

app.use(express.json());
app.use(cors());

// Serve uploaded note files
app.use("/uploads", express.static("uploads"));

// Serve static files from client directory
app.use(express.static(path.join(__dirname, "../client")));

// MongoDB connection (using Atlas from .env or local)
mongoose.connect(process.env.MONGO_URI || "mongodb+srv://Admin:Admin%40123@cluster0.zm5kreg.mongodb.net/studentDB?retryWrites=true&w=majority")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Test route
app.get("/", (req, res) => {
  res.send("Server Running");
});

// Auth routes (no middleware required)
app.use("/auth", authRoutes);
app.use("/api/student", studentAuthRoutes);
app.use("/api/student", require("./studentModule/routes/studentDashboardRoutes"));

// API routes (protected with middleware)
app.use("/api/students", studentRoutes);
app.use("/api/owner/students", studentRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/owner/courses", courseRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/owner/packages", packageRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/owner/attendance", attendanceRoutes);
app.use("/api/owner/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/settings", settingsRoutes);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});