const User = require('../models/User');
const Notification = require('../models/Notification');
const logger = require('./logger');

const notifyAdmins = async ({ title, message, type, appointmentId = null }) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('_id').lean();
    if (admins.length === 0) return;

    const notifications = admins.map(admin => {
      const notif = {
        userId: admin._id,
        title,
        message,
        type
      };
      if (appointmentId) notif.appointmentId = appointmentId;
      return notif;
    });

    await Notification.insertMany(notifications);
  } catch (error) {
    logger.error('Error notifying admins: ' + error.message);
  }
};

module.exports = notifyAdmins;
