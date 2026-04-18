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
app.use(cors({
  origin: ["https://rudraksha-computers.vercel.app", "http://localhost:5500", "http://127.0.0.1:5500"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));


// Serve static files from client directory
app.use(express.static(path.join(__dirname, "../client")));

// MongoDB connection (using Atlas from .env or local)
mongoose.connect(process.env.MONGO_URI)
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});