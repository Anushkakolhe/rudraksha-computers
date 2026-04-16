const mongoose = require('mongoose');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Transaction = require('../models/Transaction');

// Add new student
exports.addStudent = async (req, res) => {
  try {
    const { name, email, phone, address, course, courses, enrollmentDate, endDate, feesPaid, totalFees } = req.body;

    if (!name || !email || !phone || totalFees === undefined) {
      return res.status(400).json({ success: false, message: 'Name, email, phone, and totalFees are required' });
    }

    const paidAmount = Number(feesPaid) || 0;
    const totalAmount = Number(totalFees);

    if (totalAmount < 0) {
      return res.status(400).json({ success: false, message: 'Total fees must be a non-negative number' });
    }

    if (paidAmount < 0) {
      return res.status(400).json({ success: false, message: 'Fees paid cannot be negative' });
    }

    if (paidAmount > totalAmount) {
      return res.status(400).json({ success: false, message: 'Fees paid cannot exceed total fees' });
    }

    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({ success: false, message: 'Student email already exists' });
    }

    // Handle multiple courses (new logic)
    let coursesArray = [];
    let courseId = null;
    let packageId = null;

    if (courses && Array.isArray(courses) && courses.length > 0) {
      // Multiple courses provided
      coursesArray = courses.map(c => ({
        courseName: c.courseName,
        feesPaid: c.feesPaid || paidAmount,
        progress: c.progress || 0,
        duration: c.duration || "Not Available",
        expectedEndDate: c.expectedEndDate || endDate,
        enrolledDate: enrollmentDate || Date.now()
      }));
    } else if (course) {
      // Single course (existing logic)
      const selectedValue = (course || '').toString();

      if (selectedValue.startsWith('course_')) {
        courseId = selectedValue.replace('course_', '');
      } else if (selectedValue.startsWith('package_')) {
        packageId = selectedValue.replace('package_', '');
      } else if (mongoose.isValidObjectId(selectedValue)) {
        courseId = selectedValue;
      }

      if (!courseId && !packageId) {
        return res.status(400).json({ success: false, message: 'Please select a valid course or package' });
      }
    } else {
      return res.status(400).json({ success: false, message: 'Course or courses are required' });
    }

    const newStudent = new Student({
      name,
      email,
      phone,
      address,
      course: courseId,
      package: packageId,
      courses: coursesArray,
      enrollmentDate: enrollmentDate || Date.now(),
      endDate,
      feesPaid: paidAmount,
      totalFees: totalAmount,
    });

    await newStudent.save();

    if (paidAmount > 0) {
      await Transaction.create({
        type: 'income',
        amount: paidAmount,
        category: 'fees',
        description: `${packageId ? 'Package' : 'Course'} Fee Payment - ${newStudent.name}`,
        date: newStudent.enrollmentDate,
        studentId: newStudent._id,
        courseId: courseId || undefined,
        packageId: packageId || undefined,
      });
    }

    console.log('Created student:', newStudent._id, newStudent.name);
    res.status(201).json({ success: true, data: newStudent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all students
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().populate('course').populate('package').sort({ createdAt: -1 });
    res.status(200).json({ success: true, students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single student
exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('course').populate('package');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Pay fees
exports.payFees = async (req, res) => {
  try {
    const studentId = req.params.id;
    const { amount } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than zero' });
    }

    const paymentAmount = Number(amount);
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const currentPaid = student.feesPaid || 0;
    const totalFees = student.totalFees || 0;

    if (paymentAmount + currentPaid > totalFees) {
      return res.status(400).json({ success: false, message: 'Payment exceeds remaining total fees' });
    }

    student.feesPaid = currentPaid + paymentAmount;
    student.paymentHistory = student.paymentHistory || [];
    student.paymentHistory.push({ amount: paymentAmount, date: new Date() });

    await student.save();

    const transaction = new Transaction({
      type: 'income',
      amount: paymentAmount,
      category: 'fees',
      description: `Fees paid by ${student.name}`,
      studentId: student._id,
      courseId: student.course || undefined,
      packageId: student.package || undefined,
      date: new Date(),
    });

    await transaction.save();

    res.status(200).json({ success: true, message: 'Payment recorded successfully', student, transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get payment history for a student
exports.getPaymentHistory = async (req, res) => {
  try {
    const studentId = req.params.id;
    const payments = await Transaction.find({ studentId }).sort({ date: -1 });
    res.status(200).json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update student
exports.updateStudent = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Handle multiple courses (new logic)
    if (updateData.courses && Array.isArray(updateData.courses)) {
      // Multiple courses provided - keep as is
      delete updateData.course; // Remove single course field
      delete updateData.package; // Remove single package field
    } else if (updateData.course) {
      // Single course (existing logic)
      const selectedValue = (updateData.course || '').toString();
      let courseId = null;
      let packageId = null;

      if (selectedValue.startsWith('course_')) {
        courseId = selectedValue.replace('course_', '');
      } else if (selectedValue.startsWith('package_')) {
        packageId = selectedValue.replace('package_', '');
      } else if (mongoose.isValidObjectId(selectedValue)) {
        courseId = selectedValue;
      }

      if (courseId) {
        updateData.course = courseId;
        updateData.package = null;
      }
      if (packageId) {
        updateData.package = packageId;
        updateData.course = null;
      }

      if (!updateData.course && !updateData.package) {
        return res.status(400).json({ success: false, message: 'Either course or package must be selected' });
      }
    }

    if (updateData.totalFees !== undefined && Number(updateData.totalFees) < 0) {
      return res.status(400).json({ success: false, message: 'Total fees must be a non-negative number' });
    }

    if (updateData.feesPaid !== undefined && Number(updateData.feesPaid) < 0) {
      return res.status(400).json({ success: false, message: 'Fees paid cannot be negative' });
    }

    if (updateData.totalFees !== undefined && updateData.feesPaid !== undefined) {
      if (Number(updateData.feesPaid) > Number(updateData.totalFees)) {
        return res.status(400).json({ success: false, message: 'Fees paid cannot exceed total fees' });
      }
    }

    const student = await Student.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).populate('course').populate('package');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete student
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.status(200).json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reset all students (development only)
exports.resetStudents = async (req, res) => {
  try {
    await Student.deleteMany({});
    // Optional: reset attendance
    // const Attendance = require('../models/Attendance');
    // await Attendance.deleteMany({});
    res.status(200).json({ success: true, message: 'All students deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
