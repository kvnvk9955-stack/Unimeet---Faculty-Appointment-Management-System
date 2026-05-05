const crypto = require('crypto');
const Meeting = require('../models/Meeting');
const Faculty = require('../models/Faculty');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Create a new secure meeting link
// @route   POST /api/meetings
// @access  Private (Faculty only)
exports.createMeeting = async (req, res, next) => {
  try {
    const { title, externalUrl, expiresInHours } = req.body;

    const faculty = await Faculty.findOne({ userId: req.user._id });
    if (!faculty) {
      return errorResponse(res, 403, 'Only faculty members can create meetings');
    }

    // Generate a secure 12-character alphanumeric ID
    const meetingId = crypto.randomUUID().replace(/-/g, '').substring(0, 12);

    const meetingData = {
      meetingId,
      title,
      facultyId: faculty._id,
      externalUrl,
      isActive: true,
    };

    if (expiresInHours && expiresInHours > 0) {
      meetingData.expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    }

    const meeting = await Meeting.create(meetingData);

    return successResponse(res, 201, 'Secure meeting link generated', meeting);
  } catch (error) {
    next(error);
  }
};

// @desc    Get meeting details (public view before joining)
// @route   GET /api/meetings/:meetingId
// @access  Public
exports.getMeetingDetails = async (req, res, next) => {
  try {
    const meeting = await Meeting.findOne({ meetingId: req.params.meetingId, isActive: true })
      .populate({ path: 'facultyId', populate: { path: 'userId', select: 'name' } })
      .select('meetingId title facultyId expiresAt isActive created_at'); // Explicitly exclude externalUrl and joinLogs

    if (!meeting) {
      return errorResponse(res, 404, 'Meeting link is invalid or has been deactivated');
    }

    if (meeting.expiresAt && new Date() > meeting.expiresAt) {
      return errorResponse(res, 400, 'This meeting link has expired');
    }

    // Format response to hide internal IDs
    const safeData = {
      meetingId: meeting.meetingId,
      title: meeting.title,
      hostName: meeting.facultyId?.userId?.name || 'Faculty Member',
    };

    return successResponse(res, 200, 'Meeting details retrieved', safeData);
  } catch (error) {
    next(error);
  }
};

// @desc    Join meeting and redirect to external URL
// @route   POST /api/meetings/:meetingId/join
// @access  Public
exports.joinMeeting = async (req, res, next) => {
  try {
    const { studentName } = req.body;

    if (!studentName || studentName.trim() === '') {
      return errorResponse(res, 400, 'Please provide your display name to join');
    }

    const meeting = await Meeting.findOne({ meetingId: req.params.meetingId, isActive: true });

    if (!meeting) {
      return errorResponse(res, 404, 'Meeting link is invalid or has been deactivated');
    }

    if (meeting.expiresAt && new Date() > meeting.expiresAt) {
      return errorResponse(res, 400, 'This meeting link has expired');
    }

    // Optional: Log the join event
    meeting.joinLogs.push({
      studentName: studentName.trim(),
      ipAddress: req.ip || req.connection.remoteAddress,
    });
    
    // Save the log (do not await if performance is absolutely critical, but waiting ensures log integrity)
    await meeting.save();

    // Finally return the highly sensitive real external URL
    return successResponse(res, 200, 'Joining meeting...', { externalUrl: meeting.externalUrl });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active meetings for a faculty (Dashboard view)
// @route   GET /api/meetings/faculty/me
// @access  Private (Faculty only)
exports.getMyMeetings = async (req, res, next) => {
  try {
    const faculty = await Faculty.findOne({ userId: req.user._id });
    if (!faculty) return errorResponse(res, 403, 'Unauthorized');

    const meetings = await Meeting.find({ facultyId: faculty._id }).sort({ createdAt: -1 });

    return successResponse(res, 200, 'My meetings retrieved', meetings);
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle meeting active state
// @route   PATCH /api/meetings/:meetingId/toggle
// @access  Private (Faculty only)
exports.toggleMeetingStatus = async (req, res, next) => {
  try {
    const faculty = await Faculty.findOne({ userId: req.user._id });
    if (!faculty) return errorResponse(res, 403, 'Unauthorized');

    const meeting = await Meeting.findOne({ meetingId: req.params.meetingId, facultyId: faculty._id });
    if (!meeting) return errorResponse(res, 404, 'Meeting not found');

    meeting.isActive = !meeting.isActive;
    await meeting.save();

    return successResponse(res, 200, `Meeting has been ${meeting.isActive ? 'activated' : 'deactivated'}`, meeting);
  } catch (error) {
    next(error);
  }
};
