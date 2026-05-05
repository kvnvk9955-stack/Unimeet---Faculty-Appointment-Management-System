const express = require('express');
const { getFaculties, getFacultyById, getFacultySlots, getMyProfile, updateMyProfile } = require('../controllers/facultyController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// Protected faculty routes (must be before /:id to avoid conflicts)
router.get('/profile/me', protect, authorizeRoles('faculty'), getMyProfile);
router.put('/profile/me', protect, authorizeRoles('faculty'), updateMyProfile);

// Public routes
router.get('/', getFaculties);
router.get('/:id', getFacultyById);
router.get('/:id/slots', getFacultySlots);

module.exports = router;
