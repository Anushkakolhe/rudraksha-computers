const Attendance = require('../models/Attendance');
const Student = require('../models/Student');

const normalizeDate = (input) => {
  const date = input ? new Date(input) : new Date();
  date.setHours(0, 0, 0, 0);
  date.setMilliseconds(0);
  return date;
};

const distanceInDays = (start, end) => {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((end - start) / msPerDay) + 1;
};

// Mark attendance
exports.markAttendance = async (req, res) => {
  try {
    const { studentId, date, status } = req.body;

    if (!studentId || !date || !status) {
      return res.status(400).json({ success: false, message: 'studentId, date and status are required' });
    }

    if (!['Present', 'Absent'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be Present or Absent' });
    }

    const attendanceDate = normalizeDate(date);
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (!student.enrollmentDate || !student.endDate) {
      return res.status(400).json({ success: false, message: 'Student enrollment and end dates are required' });
    }

    const enrollmentDate = normalizeDate(student.enrollmentDate);
    const endDate = normalizeDate(student.endDate);

    if (attendanceDate < enrollmentDate || attendanceDate > endDate) {
      return res.status(400).json({ success: false, message: 'Attendance not allowed outside enrollment period' });
    }

    const attendance = await Attendance.findOneAndUpdate(
      { student: studentId, date: attendanceDate },
      { student: studentId, date: attendanceDate, status },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate('student', 'name course enrollmentDate endDate');

    res.status(200).json({ success: true, attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all attendance or by date
exports.getAllAttendance = async (req, res) => {
  try {
    const { date } = req.query;

    if (date) {
      const attendanceDate = normalizeDate(date);
      const attendanceRecords = await Attendance.find({ date: attendanceDate }).populate('student', 'name course enrollmentDate endDate');
      const allStudents = await Student.find().populate('course', 'courseName');

      const studentsWithStatus = allStudents.map(student => {
        const record = attendanceRecords.find(a => String(a.student._id) === String(student._id));
        return {
          studentId: student._id,
          name: student.name,
          course: student.course,
          status: record ? record.status : 'Absent',
          enrollmentDate: student.enrollmentDate,
          endDate: student.endDate
        };
      });

      return res.status(200).json({ success: true, students: studentsWithStatus, date });
    }

    const attendance = await Attendance.find()
      .populate('student', 'name email')
      .sort({ date: -1 });
    res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get attendance for a student
exports.getAttendanceByStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (!student.enrollmentDate || !student.endDate) {
      return res.status(400).json({ success: false, message: 'Student enrollment and end dates are required' });
    }

    const start = normalizeDate(student.enrollmentDate);
    const end = normalizeDate(student.endDate);

    if (end < start) {
      return res.status(400).json({ success: false, message: 'Invalid enrollment period' });
    }

    const totalDays = distanceInDays(start, end);
    const presentDays = await Attendance.countDocuments({
      student: student._id,
      date: { $gte: start, $lte: end },
      status: 'Present'
    });

    const absentDays = totalDays - presentDays;
    const attendancePercentage = totalDays === 0 ? 0 : Number(((presentDays / totalDays) * 100).toFixed(2));

    res.status(200).json({
      success: true,
      data: {
        totalDays,
        presentDays,
        absentDays,
        attendancePercentage
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get today's attendance (and default absent)
exports.getTodayAttendance = async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const attendanceRecords = await Attendance.find({
      date: { $gte: start, $lt: end }
    })
      .populate({ path: 'student', populate: { path: 'course' } });

    console.log('Attendance today found', attendanceRecords.length);

    let studentsWithStatus;

    if (attendanceRecords.length === 0) {
      const allStudents = await Student.find().populate('course');
      studentsWithStatus = allStudents.map(student => ({
        studentId: student._id,
        name: student.name,
        course: student.course,
        status: 'Absent'
      }));
      console.log('No attendance recorded today, returning all students as Absent. Found', studentsWithStatus.length);
      return res.status(200).json({ success: true, students: studentsWithStatus });
    }

    const allStudents = await Student.find().populate('course');

    studentsWithStatus = allStudents.map(student => {
      const record = attendanceRecords.find(a => String(a.student._id) === String(student._id));
      return {
        studentId: student._id,
        name: student.name,
        course: student.course,
        status: record ? record.status : 'Absent',
        present: Boolean(record)
      };
    });

    return res.status(200).json({ success: true, students: studentsWithStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get attendance stats
exports.getAttendanceStats = async (req, res) => {
  try {
    const stats = await Attendance.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const present = stats.find(s => s._id === 'Present')?.count || 0;
    const absent = stats.find(s => s._id === 'Absent')?.count || 0;

    res.status(200).json({
      success: true,
      data: {
        present,
        absent
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
