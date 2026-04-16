const Course = require('../models/Course');

// Add new course
exports.addCourse = async (req, res) => {
  try {
    const { courseName, description, duration, fees, instructor, capacity } = req.body;

    if (!courseName || !description || !duration || !fees) {
      return res.status(400).json({ success: false, message: 'Course name, description, duration, and fees are required' });
    }

    const newCourse = new Course({
      courseName,
      description,
      duration,
      fees,
      instructor,
      capacity: capacity || 50,
    });

    await newCourse.save();
    res.status(201).json({ success: true, message: 'Course added successfully', course: newCourse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all courses
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    console.log('Fetched courses:', courses.length);
    res.status(200).json({ success: true, courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single course
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    res.status(200).json({ success: true, course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add note to a course content item
exports.addNote = async (req, res) => {
  try {
    const { index, note } = req.body;
    if (typeof index !== 'number' || !note || typeof note !== 'string') {
      return res.status(400).json({ success: false, message: 'Index and note text are required' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    course.notes.push({ index, text: note.trim() });
    await course.save();

    res.status(200).json({ success: true, message: 'Note added successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add file notes to a course content item
exports.addNotesToContent = async (req, res) => {
  try {
    const { courseId, contentIndex } = req.params;
    const index = Number(contentIndex);

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!Array.isArray(course.content) || course.content.length === 0) {
      const lines = String(course.description || '')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      course.content = lines.map((line) => ({ title: '', description: line, videoUrl: '', notesFile: '' }));
    }

    if (!course.content[index]) {
      return res.status(400).json({ message: 'Invalid content index' });
    }

    if (typeof course.content[index] === 'string') {
      course.content[index] = {
        title: '',
        description: course.content[index],
        videoUrl: '',
        notesFile: ''
      };
    }

    if (!req.file || !req.file.path) {
      return res.status(400).json({ message: 'Upload failed or file missing' });
    }

    course.content[index].notesFile = req.file.path.replace(/\\/g, '/');
    await course.save();

    res.status(200).json({ message: 'Notes uploaded successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update course
exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    res.status(200).json({ success: true, message: 'Course updated successfully', course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete course
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    res.status(200).json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
