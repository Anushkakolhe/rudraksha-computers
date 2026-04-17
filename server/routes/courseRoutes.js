const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const {
  addCourse,
  getAllCourses,
  getCourse,
  addNote,
  addNotesToContent,
  updateCourse,
  deleteCourse,
} = require('../controllers/courseController');

router.use(authMiddleware);

router.post('/', addCourse);
router.get('/', getAllCourses);
router.get('/:id', getCourse);
router.post('/:id/add-note', addNote);
router.post('/add-notes/:courseId/:contentIndex', upload.single('notesFile'), addNotesToContent);
router.put('/:id', updateCourse);
router.delete('/:id', deleteCourse);

module.exports = router;
