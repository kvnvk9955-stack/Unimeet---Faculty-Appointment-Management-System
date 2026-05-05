const mongoose = require('mongoose');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Faculty = require('../models/Faculty');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const getTrend = async (days) => {
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - (days - 1));
      return await Appointment.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);
    };

    const results = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'faculty' }),
      User.countDocuments({ role: 'admin' }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'pending', date: { $gte: today, $lt: tomorrow } }),
      Appointment.countDocuments({ status: 'completed', updatedAt: { $gte: startOfMonth } }),
      Appointment.countDocuments({ status: 'rejected', updatedAt: { $gte: startOfMonth } }),
      Appointment.countDocuments({ status: 'cancelled', updatedAt: { $gte: startOfMonth } }),
      Faculty.countDocuments({ isApproved: false }),
      getTrend(7),
      getTrend(30)
    ]);
    console.log('SUCCESS! Array Length:', results.length);
    console.log('Results output:', results);
  } catch (err) {
    console.error('ERROR OCCURRED:', err);
  }
  process.exit(0);
});
