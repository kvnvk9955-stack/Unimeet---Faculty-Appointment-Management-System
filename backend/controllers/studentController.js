const Student = require('../models/Student');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const { successResponse, errorResponse } = require('../utils/apiResponse');

exports.getMyProfile = async (req, res, next) => {
  try {
    let student = await Student.findOne({ userId: req.user._id })
      .populate('userId', 'name email createdAt')
      .lean();

    if (!student) {
      const created = await Student.create({
        userId: req.user._id,
        studentId: `STU${Math.floor(Math.random() * 100000)}`,
        department: 'Computer Science',
      });
      student = await Student.findById(created._id)
        .populate('userId', 'name email createdAt')
        .lean();
    }

    return successResponse(res, 200, 'Profile retrieved', student);
  } catch (error) {
    next(error);
  }
};

exports.updateMyProfile = async (req, res, next) => {
  try {
    const { phone, bio, profilePhoto, name } = req.body;

    if (name) {
      await User.findByIdAndUpdate(req.user._id, { name });
    }

    const updatedStudent = await Student.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { phone, bio, profilePhoto } },
      { new: true, runValidators: true }
    ).populate('userId', 'name email').lean();

    return successResponse(res, 200, 'Profile updated successfully', updatedStudent);
  } catch (error) {
    next(error);
  }
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    let student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      student = await Student.create({
        userId: req.user._id,
        studentId: `STU${Math.floor(Math.random() * 100000)}`,
        department: 'Computer Science',
      });
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalAppointments,
      pendingCount,
      approvedCount,
      completedCount,
      upcomingToday,
      unreadNotifications
    ] = await Promise.all([
      Appointment.countDocuments({ studentId: student._id }),
      Appointment.countDocuments({ studentId: student._id, status: 'pending' }),
      Appointment.countDocuments({ studentId: student._id, status: 'approved' }),
      Appointment.countDocuments({ studentId: student._id, status: 'completed' }),
      Appointment.countDocuments({ 
        studentId: student._id, 
        status: { $in: ['pending', 'approved'] },
        date: { $gte: today, $lt: tomorrow }
      }),
      Notification.countDocuments({ userId: req.user._id, isRead: false })
    ]);

    return successResponse(res, 200, 'Dashboard stats retrieved', {
      totalAppointments,
      pendingCount,
      approvedCount,
      completedCount,
      upcomingToday,
      unreadNotifications
    });
  } catch (error) {
    next(error);
  }
};
