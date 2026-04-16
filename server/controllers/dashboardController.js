const Student = require('../models/Student');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');

// Get dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalCourses = await Course.countDocuments();
    const revenueData = await Student.aggregate([
      { $group: { _id: null, total: { $sum: '$feesPaid' } } }
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

    console.log('Dashboard stats', { totalStudents, totalCourses, totalRevenue });

    res.status(200).json({
      success: true,
      data: { totalStudents, totalCourses, totalRevenue }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get enrollment data (monthly enrollment)
exports.getEnrollment = async (req, res) => {
  try {
    const enrollmentData = await Student.aggregate([
      {
        $group: {
          _id: { $month: '$enrollmentDate' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const result = enrollmentData.map(item => ({
      month: monthNames[item._id - 1],
      count: item.count
    }));

    console.log('Enrollment trend result', result);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get course popularity
exports.getCoursePopularity = async (req, res) => {
  try {
    const Package = require('../models/Package');
    
    const students = await Student.find().populate('course').populate('package');
    const packages = await Package.find().populate('courses');
    
    const courseCount = {};

    // Count direct course enrollments
    students.forEach(student => {
      if (student.course) {
        const courseName = student.course.courseName || 'Unknown Course';
        courseCount[courseName] = (courseCount[courseName] || 0) + 1;
      }
    });

    // Count package enrollments - distribute to included courses
    students.forEach(student => {
      if (student.package && student.package._id) {
        const pkg = packages.find(p => p._id.toString() === student.package._id.toString());
        
        if (pkg && pkg.courses && pkg.courses.length > 0) {
          // Distribute student across all courses in package
          pkg.courses.forEach(course => {
            const courseName = course.courseName || 'Unknown Course';
            courseCount[courseName] = (courseCount[courseName] || 0) + 1;
          });
        }
      }
    });

    // Convert to array and sort
    const formatted = Object.entries(courseCount)
      .map(([course, students]) => ({ course, students }))
      .sort((a, b) => b.students - a.students)
      .slice(0, 10);

    console.log('Course popularity result', formatted);
    console.log('Course count map:', courseCount);

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get recent activities
exports.getActivities = async (req, res) => {
  try {
    const recentStudents = await Student.find().sort({ createdAt: -1 }).limit(5).select('name email createdAt');
    const recentAttendance = await Attendance.find().sort({ createdAt: -1 }).limit(5).populate('studentId', 'name');

    res.status(200).json({
      success: true,
      data: {
        newStudents: recentStudents,
        recentAttendance: recentAttendance,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get today's classes (attendance)
exports.getClasses = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await Attendance.find({
      date: { $gte: today, $lt: tomorrow }
    }).populate('studentId', 'name course');

    console.log('Today classes records found', todayAttendance.length);

    res.status(200).json({
      success: true,
      data: todayAttendance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
