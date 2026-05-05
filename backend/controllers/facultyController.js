const Faculty = require('../models/Faculty');
const TimeSlot = require('../models/TimeSlot');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/apiResponse');

exports.getFaculties = async (req, res, next) => {
  try {
    const { department, search, page = 1, limit = 12 } = req.query;
    
    const query = { isApproved: true };
    if (department) {
      query.department = department;
    }

    // First find matching users if searching by name
    let userIds = null;
    if (search) {
      const users = await User.find({
        role: 'faculty',
        isActive: true,
        name: { $regex: search, $options: 'i' }
      }).select('_id').lean();
      
      userIds = users.map(u => u._id);
      query.userId = { $in: userIds };
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const [faculties, total] = await Promise.all([
      Faculty.find(query)
        .populate({ path: 'userId', select: 'name email _id isActive', match: { isActive: true } })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Faculty.countDocuments(query)
    ]);

    // Format response and filter out if user is inactive (though handled by match)
    const now = new Date();

    // Get all faculty IDs that have at least one future available slot
    const facultyIdsWithSlots = await TimeSlot.distinct('facultyId', {
      facultyId: { $in: faculties.map(f => f._id) },
      status: 'available',
      date: { $gte: now }
    });
    const availableSet = new Set(facultyIdsWithSlots.map(id => id.toString()));

    const formattedFaculties = faculties
      .filter(f => f.userId !== null)
      .map(f => ({
        id: f._id,
        userId: f.userId._id,
        name: f.userId.name,
        email: f.userId.email,
        department: f.department,
        designation: f.designation,
        officeRoom: f.officeRoom,
        bio: f.bio,
        profilePhoto: f.profilePhoto,
        totalAppointments: f.totalAppointments,
        rating: f.rating,
        isAvailable: availableSet.has(f._id.toString())
      }));

    return successResponse(res, 200, 'Faculty list retrieved', formattedFaculties, {
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      limit: Number(limit)
    });
  } catch (error) {
    next(error);
  }
};

exports.getFacultyById = async (req, res, next) => {
  try {
    const faculty = await Faculty.findById(req.params.id)
      .populate('userId', 'name email isActive')
      .lean();

    if (!faculty || !faculty.userId || !faculty.userId.isActive) {
      return errorResponse(res, 404, 'Faculty not found');
    }

    const formatted = {
      id: faculty._id,
      name: faculty.userId.name,
      email: faculty.userId.email,
      department: faculty.department,
      designation: faculty.designation,
      phone: faculty.phone,
      officeRoom: faculty.officeRoom,
      bio: faculty.bio,
      profilePhoto: faculty.profilePhoto,
      totalAppointments: faculty.totalAppointments,
      rating: faculty.rating
    };

    return successResponse(res, 200, 'Faculty retrieved', formatted);
  } catch (error) {
    next(error);
  }
};

exports.getFacultySlots = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) {
      return errorResponse(res, 400, 'Date query parameter is required (YYYY-MM-DD)');
    }

    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const slots = await TimeSlot.find({
      facultyId: req.params.id,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: 'available'
    }).sort({ startTime: 1 }).lean();

    // Filter out past slots
    const now = new Date();
    const isPastDateTime = (dateObj, timeStr) => {
      try {
        if (!timeStr) return true;
        let hours, minutes;
        if (timeStr.includes('AM') || timeStr.includes('PM')) {
          const [time, modifier] = timeStr.split(' ');
          [hours, minutes] = time.split(':').map(Number);
          if (modifier === 'PM' && hours !== 12) hours += 12;
          if (modifier === 'AM' && hours === 12) hours = 0;
        } else {
          [hours, minutes] = timeStr.split(':').map(Number);
        }
        const d = new Date(dateObj);
        d.setHours(hours, minutes, 0, 0);
        return d <= now;
      } catch {
        return false;
      }
    };

    const validSlots = slots.filter(slot => !isPastDateTime(slot.date, slot.startTime));

    return successResponse(res, 200, 'Available slots retrieved', validSlots);
  } catch (error) {
    next(error);
  }
};

exports.getMyProfile = async (req, res, next) => {
  try {
    let faculty = await Faculty.findOne({ userId: req.user._id })
      .populate('userId', 'name email')
      .lean();

    if (!faculty) {
      const created = await Faculty.create({
        userId: req.user._id,
        employeeId: `EMP${Math.floor(Math.random() * 100000)}`,
        department: 'Computer Science',
        designation: 'Assistant Professor',
        isApproved: true
      });
      faculty = await Faculty.findById(created._id)
        .populate('userId', 'name email')
        .lean();
    }

    return successResponse(res, 200, 'Profile retrieved', faculty);
  } catch (error) {
    next(error);
  }
};

exports.updateMyProfile = async (req, res, next) => {
  try {
    const { designation, phone, officeRoom, bio, profilePhoto, name } = req.body;

    if (name) {
      await User.findByIdAndUpdate(req.user._id, { name });
    }

    const updatedFaculty = await Faculty.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { designation, phone, officeRoom, bio, profilePhoto } },
      { new: true, runValidators: true }
    ).populate('userId', 'name email').lean();

    return successResponse(res, 200, 'Profile updated successfully', updatedFaculty);
  } catch (error) {
    next(error);
  }
};
