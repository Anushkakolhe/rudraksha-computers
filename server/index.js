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

// CORS — allow Vercel frontend (all preview + production URLs) and local dev
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Render health checks)
    if (!origin) return callback(null, true);
    const allowed = [
      /^https:\/\/rudraksha-computers(\.vercel\.app|-.+\.vercel\.app)$/,
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
    ];
    if (allowed.some((pattern) => pattern.test(origin))) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cache-Control"],
  credentials: true,
};

app.use(cors(corsOptions));


// Serve static files from client directory
app.use(express.static(path.join(__dirname, "../client")));

// MongoDB connection (using Atlas from .env or local)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Health check routes
app.get("/", (req, res) => res.json({ status: "ok", message: "Server Running" }));
app.get("/api", (req, res) => res.json({ status: "ok", message: "API Running" }));
app.get("/api/test", (req, res) => res.json({ status: "ok", message: "API working", timestamp: new Date().toISOString() }));

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