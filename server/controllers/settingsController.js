const Settings = require('../models/Settings');

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPhone = (phone) => {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 20;
};

// Get settings
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    console.log('Settings fetched:', settings);
    res.status(200).json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update settings
exports.updateSettings = async (req, res, next) => {
  try {
    console.log('Settings updated:', req.body);

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    const {
      instituteName,
      email,
      phone,
      address,
      notifications = {}
    } = req.body;

    if (instituteName !== undefined) {
      if (!instituteName.toString().trim()) {
        return res.status(400).json({ success: false, message: 'Institute name cannot be empty.' });
      }
      settings.instituteName = instituteName;
    }

    if (email !== undefined) {
      if (email && !isValidEmail(email)) {
        return res.status(400).json({ success: false, message: 'Email format is invalid.' });
      }
      settings.email = email;
    }

    if (phone !== undefined) {
      if (phone && !isValidPhone(phone)) {
        return res.status(400).json({ success: false, message: 'Phone number must contain 8 to 20 digits.' });
      }
      settings.phone = phone;
    }

    if (address !== undefined) {
      settings.address = address;
    }

    settings.notifications.email = notifications.email ?? settings.notifications.email;
    settings.notifications.sms = notifications.sms ?? settings.notifications.sms;
    settings.notifications.attendance = notifications.attendance ?? settings.notifications.attendance;

    await settings.save();

    res.status(200).json({ success: true, message: 'Settings updated successfully', settings });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
