const express = require('express');
const { bookAppointment, getStudentAppointments, getFacultyAppointments, approveAppointment, rejectAppointment, getAdminAppointments, cancelAppointment, markAppointmentCompleted, markAppointmentMissed, addMeetingLink, rescheduleByStudent, rescheduleByFaculty, rescheduleConfirm, rescheduleDecline } = require('../controllers/appointmentController');
const { validate } = require('../middleware/validate');
const { bookAppointmentValidation, rejectValidation, addLinkValidation } = require('../validators/appointmentValidators');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', authorizeRoles('student'), bookAppointmentValidation, validate, bookAppointment);
router.get('/student', authorizeRoles('student'), getStudentAppointments);

router.get('/faculty', authorizeRoles('faculty'), getFacultyAppointments);
router.patch('/:id/approve', authorizeRoles('faculty'), approveAppointment);
router.patch('/:id/link', authorizeRoles('faculty'), addLinkValidation, validate, addMeetingLink);
router.patch('/:id/reject', authorizeRoles('faculty'), rejectValidation, validate, rejectAppointment);
router.patch('/:id/complete', authorizeRoles('faculty'), markAppointmentCompleted);
router.patch('/:id/missed', authorizeRoles('faculty'), markAppointmentMissed);
router.patch('/:id/cancel', authorizeRoles('student'), cancelAppointment);

// Reschedule routes
router.post('/:id/reschedule-student', authorizeRoles('student'), rescheduleByStudent);
router.post('/:id/reschedule-faculty', authorizeRoles('faculty'), rescheduleByFaculty);
router.patch('/:id/reschedule-confirm', authorizeRoles('student'), rescheduleConfirm);
router.patch('/:id/reschedule-decline', authorizeRoles('student'), rescheduleDecline);

router.get('/admin', authorizeRoles('admin'), getAdminAppointments);

module.exports = router;
