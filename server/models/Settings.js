const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  instituteName: {
    type: String,
    default: '',
    trim: true
  },
  email: {
    type: String,
    default: '',
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    default: '',
    trim: true
  },
  address: {
    type: String,
    default: '',
    trim: true
  },
  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    attendance: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

SettingsSchema.pre('save', async function() {
  if (!this.isNew) {
    return;
  }

  const count = await mongoose.models.Settings.countDocuments();
  if (count > 0) {
    throw new Error('Only one settings document is allowed.');
  }
});

module.exports = mongoose.model('Settings', SettingsSchema);
