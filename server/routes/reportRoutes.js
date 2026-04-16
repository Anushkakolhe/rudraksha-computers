const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getReportData,
  addTransaction,
  getFinancialStats,
  getTransactionsFromStudents,
} = require('../controllers/reportController');

router.use(authMiddleware);

router.get('/', getReportData);
router.get('/stats', getFinancialStats);
router.get('/transactions', getTransactionsFromStudents);
router.post('/add', addTransaction);

module.exports = router;
