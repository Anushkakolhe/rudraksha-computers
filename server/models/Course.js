const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: String,
    required: true,
    trim: true
  },
  fees: {
    type: Number,
    required: true,
    min: 0
  },
  instructor: {
    type: String,
    trim: true
  },
  content: [
    {
      title: {
        type: String,
        trim: true,
        default: ""
      },
      description: {
        type: String,
        trim: true,
        default: ""
      },
      videoUrl: {
        type: String,
        trim: true,
        default: ""
      },
      notesFile: {
        type: String,
        trim: true,
        default: ""
      }
    }
  ],
  modules: {
    type: [String],
    default: []
  },
  topics: {
    type: [String],
    default: []
  },
  notes: [
    {
      index: {
        type: Number,
        required: true
      },
      text: {
        type: String,
        required: true,
        trim: true
      }
    }
  ],
  studentsEnrolled: {
    type: Number,
    default: 0
  },
  capacity: {
    type: Number,
    default: 50
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  startDate: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);
