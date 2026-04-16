const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getDashboardStats,
  getEnrollment,
  getCoursePopularity,
  getActivities,
  getClasses,
} = require('../controllers/dashboardController');

router.use(authMiddleware);

router.get('/stats', getDashboardStats);
router.get('/enrollment', getEnrollment);
router.get('/course-popularity', getCoursePopularity);
router.get('/activities', getActivities);
router.get('/classes', getClasses);

module.exports = router;
