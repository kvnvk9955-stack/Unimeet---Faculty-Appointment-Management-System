const express = require('express');
const {
  createMeeting,
  getMeetingDetails,
  joinMeeting,
  getMyMeetings,
  toggleMeetingStatus
} = require('../controllers/meetingController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public routes for students/guests
router.get('/:meetingId', getMeetingDetails);
router.post('/:meetingId/join', joinMeeting);

// Protected routes for faculty
router.post('/', protect, authorizeRoles('faculty'), createMeeting);
router.get('/faculty/me', protect, authorizeRoles('faculty'), getMyMeetings);
router.patch('/:meetingId/toggle', protect, authorizeRoles('faculty'), toggleMeetingStatus);

module.exports = router;
