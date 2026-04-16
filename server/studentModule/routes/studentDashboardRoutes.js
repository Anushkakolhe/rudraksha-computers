const express = require("express");
const router = express.Router();
const studentAuthMiddleware = require("../middleware/studentAuthMiddleware");
const {
  getStudentDashboard,
  getStudentCourseContent,
  getStudentCourseById,
  getCourseById,
  updateStudentProgress
} = require("../controllers/studentDashboardController");

router.get("/dashboard", studentAuthMiddleware, getStudentDashboard);
router.get("/course/id/:courseId", studentAuthMiddleware, getCourseById);
router.get("/course/:courseName", studentAuthMiddleware, getStudentCourseContent);
router.get("/course-by-id/:id", studentAuthMiddleware, getStudentCourseById);
router.put("/update-progress", studentAuthMiddleware, updateStudentProgress);

module.exports = router;
