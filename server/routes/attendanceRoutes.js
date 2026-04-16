const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  markAttendance,
  getAllAttendance,
  getAttendanceByStudent,
  getAttendanceStats,
  getTodayAttendance,
} = require('../controllers/attendanceController');

router.use(authMiddleware);

router.post('/', markAttendance);
router.get('/', getAllAttendance);
router.get('/student/:id', getAttendanceByStudent);
router.get('/stats', getAttendanceStats);
router.get('/today', getTodayAttendance);

module.exports = router;
