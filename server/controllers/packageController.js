const Package = require('../models/Package');
const Course = require('../models/Course');

// Add new package
exports.addPackage = async (req, res) => {
  try {
    console.log('Package add payload:', req.body);
    const { packageName, courses, discount = 0 } = req.body;
    const discountValue = Number(discount);

    if (!packageName || !courses || !Array.isArray(courses) || courses.length === 0) {
      return res.status(400).json({ success: false, message: 'Package name and at least one course are required' });
    }

    if (Number.isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
      return res.status(400).json({ success: false, message: 'Discount must be a number between 0 and 100' });
    }

    const selectedCourses = await Course.find({ _id: { $in: courses } });
    if (selectedCourses.length !== courses.length) {
      return res.status(400).json({ success: false, message: 'One or more selected courses are invalid' });
    }

    const totalPrice = selectedCourses.reduce((sum, course) => sum + (course.fees || 0), 0);
    const finalPrice = totalPrice - (totalPrice * discountValue / 100);

    const newPackage = new Package({
      packageName,
      courses,
      totalPrice,
      discount: discountValue,
      finalPrice,
    });

    await newPackage.save();
    res.status(201).json({ success: true, package: newPackage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all packages
exports.getAllPackages = async (req, res) => {
  try {
    const packages = await Package.find().populate('courses').sort({ createdAt: -1 });
    res.status(200).json({ success: true, packages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single package
exports.getPackage = async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id).populate('courses');
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }
    res.status(200).json({ success: true, package: pkg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update package
exports.updatePackage = async (req, res) => {
  try {
    const pkg = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }
    res.status(200).json({ success: true, message: 'Package updated successfully', package: pkg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete package
exports.deletePackage = async (req, res) => {
  try {
    const pkg = await Package.findByIdAndDelete(req.params.id);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }
    res.status(200).json({ success: true, message: 'Package deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
