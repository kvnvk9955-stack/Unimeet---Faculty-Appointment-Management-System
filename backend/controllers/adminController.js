const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Appointment = require('../models/Appointment');
const TimeSlot = require('../models/TimeSlot');
const Notification = require('../models/Notification');
const sendEmail = require('../utils/sendEmail');
const emailTemplates = require('../utils/emailTemplates');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const logger = require('../utils/logger');

exports.getStats = async (req, res, next) => {
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
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);
    };

    const [
      totalStudents, totalFaculty, totalAdmins, totalAppointments,
      pendingToday, completedThisMonth, rejectedThisMonth, cancelledThisMonth,
      pendingFacultyCount, trend7DaysRaw, trend30DaysRaw
    ] = await Promise.all([
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

    // Ensure every day is represented (fill 0 for missing days)
    const buildFilledTrend = (rawArr, days) => {
      const map = {};
      rawArr.forEach(item => { map[item._id] = item.count; });
      const result = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        result.push({
          date: dateStr,
          label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
          shortLabel: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
          count: map[dateStr] || 0
        });
      }
      return result;
    };

    const appointmentsLast7Days = buildFilledTrend(trend7DaysRaw, 7);
    const appointmentsLast30Days = buildFilledTrend(trend30DaysRaw, 30);

    // Top faculty by bookings
    const topFacultyRaw = await Faculty.find()
      .populate('userId', 'name email')
      .sort({ totalAppointments: -1 })
      .limit(5)
      .lean();

    const topFacultyByBookings = topFacultyRaw.map(f => ({
      name: f.userId?.name || 'Unknown',
      department: f.department || '',
      bookings: f.totalAppointments || 0,
    }));

    // Department breakdown from appointments
    const deptAgg = await Appointment.aggregate([
      {
        $lookup: {
          from: 'faculties',
          localField: 'facultyId',
          foreignField: '_id',
          as: 'faculty'
        }
      },
      { $unwind: { path: '$faculty', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$faculty.department',
          total: { $sum: 1 },
          approved: { $sum: { $cond: [{ $in: ['$status', ['approved', 'completed']] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        }
      },
      { $sort: { total: -1 } }
    ]);

    const departmentStats = deptAgg.map(d => ({
      department: d._id || 'Unknown',
      total: d.total,
      count: d.total,
      approved: d.approved,
      rejected: d.rejected,
      cancelled: d.cancelled,
      approvalRate: d.total > 0 ? Math.round((d.approved / d.total) * 100) : 0,
    }));

    // Recent 10 appointments
    const recentAppointments = await Appointment.find()
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } })
      .populate({ path: 'facultyId', select: 'department', populate: { path: 'userId', select: 'name email' } })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return successResponse(res, 200, 'Admin stats retrieved', {
      totalStudents, totalFaculty, totalAdmins, totalAppointments,
      pendingToday, completedThisMonth, rejectedThisMonth, cancelledThisMonth,
      pendingFacultyCount,
      appointmentsLast7Days,
      appointmentsLast30Days,
      topFacultyByBookings,
      departmentStats,
      recentAppointments,
      // backward compat aliases
      monthlyTrend: appointmentsLast30Days,
      topFaculty: topFacultyByBookings,
    });
  } catch (error) {
    next(error);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const { role, search, isActive, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(query).select('-password -refreshToken -passwordResetToken').skip(skip).limit(Number(limit)).lean(),
      User.countDocuments(query)
    ]);

    // Enhance users with profiles
    const enhancedUsers = await Promise.all(users.map(async (user) => {
      let profile = null;
      if (user.role === 'student') profile = await Student.findOne({ userId: user._id }).lean();
      if (user.role === 'faculty') profile = await Faculty.findOne({ userId: user._id }).lean();
      return { ...user, profile };
    }));

    return successResponse(res, 200, 'Users retrieved', enhancedUsers, {
      total, page: Number(page), pages: Math.ceil(total / limit), limit: Number(limit)
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password -refreshToken').lean();
    if (!user) return errorResponse(res, 404, 'User not found');
    
    let profile = null;
    if (user.role === 'student') profile = await Student.findOne({ userId: user._id }).lean();
    if (user.role === 'faculty') profile = await Faculty.findOne({ userId: user._id }).lean();

    return successResponse(res, 200, 'User retrieved', { ...user, profile });
  } catch (error) {
    next(error);
  }
};

exports.suspendUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return errorResponse(res, 403, 'You cannot suspend your own account');
    }
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return errorResponse(res, 404, 'User not found');
    if (targetUser.role === 'admin') {
      const activeAdmins = await User.countDocuments({ role: 'admin', isActive: true });
      if (activeAdmins <= 1) return errorResponse(res, 403, 'Cannot suspend the last active admin');
    }
    targetUser.isActive = false;
    await targetUser.save({ validateBeforeSave: false });
    return successResponse(res, 200, 'User suspended successfully');
  } catch (error) {
    next(error);
  }
};

exports.activateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
    if (!user) return errorResponse(res, 404, 'User not found');
    return successResponse(res, 200, 'User activated successfully');
  } catch (error) {
    next(error);
  }
};

exports.toggleUserStatus = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return errorResponse(res, 403, 'You cannot change your own account status');
    }
    const user = await User.findById(req.params.id);
    if (!user) return errorResponse(res, 404, 'User not found');
    // If deactivating an admin, check minimum admin count
    if (user.role === 'admin' && user.isActive) {
      const activeAdmins = await User.countDocuments({ role: 'admin', isActive: true });
      if (activeAdmins <= 1) return errorResponse(res, 403, 'Cannot deactivate the last active admin');
    }
    user.isActive = !user.isActive;
    await user.save();
    return successResponse(res, 200, `User ${user.isActive ? 'activated' : 'suspended'} successfully`, { isActive: user.isActive });
  } catch (error) {
    next(error);
  }
};

exports.getPendingFaculty = async (req, res, next) => {
  try {
    const faculty = await Faculty.find({ isApproved: false })
      .populate('userId', 'name email isActive')
      .lean();
    return successResponse(res, 200, 'Pending faculty retrieved', faculty);
  } catch (error) {
    next(error);
  }
};

exports.getAllFaculty = async (req, res, next) => {
  try {
    const faculty = await Faculty.find()
      .populate('userId', 'name email isActive')
      .lean();
    return successResponse(res, 200, 'All faculty retrieved', faculty);
  } catch (error) {
    next(error);
  }
};

exports.approveFaculty = async (req, res, next) => {
  try {
    const faculty = await Faculty.findById(req.params.id).populate('userId');
    if (!faculty) return errorResponse(res, 404, 'Faculty not found');

    const newStatus = !faculty.isApproved;
    faculty.isApproved = newStatus;
    await faculty.save();

    if (newStatus) {
      await Notification.create({
        userId: faculty.userId._id,
        title: 'Account Approved',
        message: 'Your faculty account has been approved by the admin.',
        type: 'account_approved'
      });
      sendEmail({
        to: faculty.userId.email,
        subject: 'Account Approved',
        html: emailTemplates.facultyApprovedEmail(faculty.userId.name)
      }).catch(err => logger.error(`Email error: ${err.message}`));
    }

    return successResponse(res, 200, `Faculty ${newStatus ? 'approved' : 'approval revoked'} successfully`);
  } catch (error) {
    next(error);
  }
};

exports.getAppointments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } })
        .populate({ path: 'facultyId', populate: { path: 'userId', select: 'name email' } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Appointment.countDocuments(query)
    ]);

    return successResponse(res, 200, 'Appointments retrieved', appointments, {
      total, page: Number(page), pages: Math.ceil(total / limit), limit: Number(limit)
    });
  } catch (error) {
    next(error);
  }
};

exports.cancelAppointment = async (req, res, next) => {
  try {
    const { cancellationReason } = req.body;
    if (!cancellationReason) return errorResponse(res, 400, 'Admin must provide cancellation reason');

    const appointment = await Appointment.findById(req.params.id)
      .populate('facultyId studentId');
    if (!appointment) return errorResponse(res, 404, 'Appointment not found');

    appointment.status = 'cancelled';
    appointment.cancelledBy = 'admin';
    appointment.cancellationReason = cancellationReason;
    await appointment.save();

    await TimeSlot.findByIdAndUpdate(appointment.slotId, { status: 'available', bookedBy: null });
    
    // Decrease faculty appointment count
    await Faculty.findByIdAndUpdate(appointment.facultyId._id, { $inc: { totalAppointments: -1 } });

    // Assuming notify logic directly via DB
    await Notification.create([
      { userId: appointment.facultyId.userId, title: 'Appointment Cancelled', message: 'Admin cancelled an appointment.', type: 'appointment_cancelled', appointmentId: appointment._id },
      { userId: appointment.studentId.userId, title: 'Appointment Cancelled', message: 'Admin cancelled your appointment.', type: 'appointment_cancelled', appointmentId: appointment._id }
    ]);

    return successResponse(res, 200, 'Appointment cancelled by admin successfully');
  } catch (error) {
    next(error);
  }
};
