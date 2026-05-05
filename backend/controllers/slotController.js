const TimeSlot = require('../models/TimeSlot');
const Faculty = require('../models/Faculty');
const Appointment = require('../models/Appointment');
const { successResponse, errorResponse } = require('../utils/apiResponse');

exports.createSlot = async (req, res, next) => {
  try {
    const { date, startTime, endTime, duration, mode } = req.body;
    
    // Find faculty profile
    let faculty = await Faculty.findOne({ userId: req.user._id });
    if (!faculty) {
      faculty = await Faculty.create({
        userId: req.user._id,
        employeeId: `EMP${Math.floor(Math.random() * 100000)}`,
        department: 'Computer Science',
        designation: 'Assistant Professor',
        isApproved: true
      });
    }

    if (!faculty.isApproved) {
      return errorResponse(res, 403, 'Your account must be approved by an administrator before creating slots');
    }

    // Validate slot is not in the past (with 15-min buffer)
    const parseTimeTo24h = (timeStr) => {
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours !== 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return { hours, minutes };
    };

    const slotDate = new Date(req.body.date);
    let slotDateTime;
    // startTime is sent as 24h (e.g. "09:00") from the frontend
    if (startTime && startTime.includes(':') && !startTime.includes('AM') && !startTime.includes('PM')) {
      const [h, m] = startTime.split(':').map(Number);
      slotDateTime = new Date(slotDate);
      slotDateTime.setHours(h, m, 0, 0);
    } else if (startTime) {
      const { hours, minutes } = parseTimeTo24h(startTime);
      slotDateTime = new Date(slotDate);
      slotDateTime.setHours(hours, minutes, 0, 0);
    }

    if (slotDateTime) {
      const bufferTime = new Date(Date.now() + 15 * 60 * 1000);
      if (slotDateTime < bufferTime) {
        return errorResponse(res, 400, 'Cannot create a slot in the past or within the next 15 minutes.');
      }
    }

    // Check for overlap (simplified exact match check per specs)
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const dTime = Number(duration) || 30;
    const [sH, sM] = startTime.split(':').map(Number);
    const [eH, eM] = endTime.split(':').map(Number);
    
    let current = new Date(date);
    current.setHours(sH, sM, 0, 0);
    
    const end = new Date(date);
    end.setHours(eH, eM, 0, 0);
    
    const slotsToCreate = [];
    
    while (current < end) {
      const next = new Date(current.getTime() + dTime * 60000);
      if (next > end) break;
      
      const sHStr = String(current.getHours()).padStart(2, '0');
      const sMStr = String(current.getMinutes()).padStart(2, '0');
      const nHStr = String(next.getHours()).padStart(2, '0');
      const nMStr = String(next.getMinutes()).padStart(2, '0');
      
      slotsToCreate.push({
        facultyId: faculty._id,
        date,
        startTime: `${sHStr}:${sMStr}`,
        endTime: `${nHStr}:${nMStr}`,
        duration: dTime,
        mode: mode || 'offline'
      });
      
      current = next;
    }

    if (slotsToCreate.length === 0) {
      return errorResponse(res, 400, 'End time must be after start time with enough gap for at least one slot duration');
    }

    const startTimes = slotsToCreate.map(s => s.startTime);
    const existingSlot = await TimeSlot.findOne({
      facultyId: faculty._id,
      date: { $gte: startOfDay, $lte: endOfDay },
      startTime: { $in: startTimes }
    }).lean();

    if (existingSlot) {
      return errorResponse(res, 409, `Overlap detected. A slot already exists at ${existingSlot.startTime}`);
    }

    const createdSlots = await TimeSlot.insertMany(slotsToCreate);

    return successResponse(res, 201, `Successfully created ${createdSlots.length} time slot(s)`, createdSlots);
  } catch (error) {
    next(error);
  }
};

exports.getMySlots = async (req, res, next) => {
  try {
    const { date, status, page = 1, limit = 20 } = req.query;
    
    let faculty = await Faculty.findOne({ userId: req.user._id });
    if (!faculty) {
      faculty = await Faculty.create({
        userId: req.user._id,
        employeeId: `EMP${Math.floor(Math.random() * 100000)}`,
        department: 'Computer Science',
        designation: 'Assistant Professor',
        isApproved: true
      });
    }

    const query = { facultyId: faculty._id };
    
    if (status) query.status = status;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setUTCHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [slots, total] = await Promise.all([
      TimeSlot.find(query)
        .populate({ path: 'bookedBy', select: 'userId studentId', populate: { path: 'userId', select: 'name email' }})
        .sort({ date: 1, startTime: 1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      TimeSlot.countDocuments(query)
    ]);

    return successResponse(res, 200, 'Slots retrieved', slots, {
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      limit: Number(limit)
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteSlot = async (req, res, next) => {
  try {
    let faculty = await Faculty.findOne({ userId: req.user._id });
    if (!faculty) {
      faculty = await Faculty.create({
        userId: req.user._id,
        employeeId: `EMP${Math.floor(Math.random() * 100000)}`,
        department: 'Computer Science',
        designation: 'Assistant Professor',
        isApproved: true
      });
    }

    const slot = await TimeSlot.findOne({ _id: req.params.id, facultyId: faculty._id });
    if (!slot) return errorResponse(res, 404, 'Slot not found');

    if (slot.status === 'booked') {
      return errorResponse(res, 400, 'Cannot delete a booked slot. Cancel the appointment first.');
    }

    await TimeSlot.deleteOne({ _id: slot._id });

    return successResponse(res, 200, 'Slot deleted successfully');
  } catch (error) {
    next(error);
  }
};

exports.cancelSlot = async (req, res, next) => {
  try {
    let faculty = await Faculty.findOne({ userId: req.user._id });
    if (!faculty) {
      faculty = await Faculty.create({
        userId: req.user._id,
        employeeId: `EMP${Math.floor(Math.random() * 100000)}`,
        department: 'Computer Science',
        designation: 'Assistant Professor',
        isApproved: true
      });
    }

    const slot = await TimeSlot.findOne({ _id: req.params.id, facultyId: faculty._id });
    if (!slot) return errorResponse(res, 404, 'Slot not found');

    if (slot.status === 'booked') {
      // Find the associated pending/approved appointment and cancel it
      const appointment = await Appointment.findOne({ slotId: slot._id, status: { $in: ['pending', 'approved'] } })
        .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } });
      if (appointment) {
        appointment.status = 'cancelled';
        appointment.cancelledBy = 'faculty';
        appointment.cancellationReason = 'Faculty cancelled the slot';
        await appointment.save();
        
        faculty.totalAppointments = Math.max(0, faculty.totalAppointments - 1);
        await faculty.save();

        // Notify student
        const facultyUser = await require('../models/User').findById(faculty.userId);
        const facultyName = facultyUser?.name || 'Faculty';
        const dateStr = new Date(slot.date).toDateString();
        await require('../models/Notification').create({
          userId: appointment.studentId.userId._id,
          title: 'Appointment Cancelled by Faculty',
          message: `Your appointment with ${facultyName} on ${dateStr} at ${slot.startTime} has been cancelled by the faculty.`,
          type: 'appointment_cancelled',
          appointmentId: appointment._id
        });

        // Send email to student
        const sendEmail = require('../utils/sendEmail');
        const emailTemplates = require('../utils/emailTemplates');
        const logger = require('../utils/logger');
        const formatTimeAmPm = (timeStr) => {
          if (!timeStr) return "";
          if (timeStr.toUpperCase().includes('AM') || timeStr.toUpperCase().includes('PM')) return timeStr;
          const [hours, minutes] = timeStr.split(":");
          if (hours === undefined || minutes === undefined) return timeStr;
          const h = parseInt(hours, 10);
          const ampm = h >= 12 ? "PM" : "AM";
          const formattedH = h % 12 || 12;
          return `${String(formattedH).padStart(2, '0')}:${minutes} ${ampm}`;
        };
        const timeSlotStr = `${formatTimeAmPm(slot.startTime)} - ${formatTimeAmPm(slot.endTime)}`;
        sendEmail({
          to: appointment.studentId.userId.email,
          subject: 'Appointment Cancelled by Faculty',
          html: emailTemplates.appointmentCancelledByFaculty(appointment.studentId.userId.name, facultyName, slot.date, timeSlotStr)
        }).catch(err => logger.error(`Email error: ${err.message}`));
        logger.info(`Faculty cancel email queued to student: ${appointment.studentId.userId.email}`);
      }
    }

    slot.status = 'cancelled';
    await slot.save();

    return successResponse(res, 200, 'Slot cancelled successfully');
  } catch (error) {
    next(error);
  }
};
