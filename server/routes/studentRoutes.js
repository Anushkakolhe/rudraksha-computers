const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  addStudent,
  getAllStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  resetStudents,
  payFees,
  getPaymentHistory,
} = require('../controllers/studentController');

router.use(authMiddleware);

router.post('/', addStudent);
router.get('/', getAllStudents);
router.post('/pay-fees/:id', payFees);
router.get('/:id/payments', getPaymentHistory);
router.get('/:id', getStudent);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);
router.delete('/reset', resetStudents);

module.exports = router;
