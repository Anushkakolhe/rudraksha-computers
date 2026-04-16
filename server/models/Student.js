const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null
  },
  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
    default: null
  },
  courses: [{
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null
    },
    courseName: {
      type: String,
      required: true
    },
    feesPaid: {
      type: Number,
      default: 0
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    duration: {
      type: String,
      default: "Not Available"
    },
    expectedEndDate: {
      type: Date
    },
    enrolledDate: {
      type: Date,
      default: Date.now
    }
  }],
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  feesPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  totalFees: {
    type: Number,
    required: true,
    min: 0
  },
  paymentHistory: [
    {
      amount: {
        type: Number,
        min: 0,
      },
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],
  status: {
    type: String,
    enum: ['active', 'completed', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);
