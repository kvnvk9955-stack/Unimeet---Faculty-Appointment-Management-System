const express = require('express');
const { getMyProfile, updateMyProfile, getDashboardStats } = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

// Protected student routes
router.use(protect);
router.use(authorizeRoles('student'));

router.get('/profile/me', getMyProfile);
router.put('/profile/me', updateMyProfile);
router.get('/dashboard/stats', getDashboardStats);

module.exports = router;
