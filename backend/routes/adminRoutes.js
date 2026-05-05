const express = require('express');
const { getStats, getUsers, getUserById, suspendUser, activateUser, toggleUserStatus, getPendingFaculty, getAllFaculty, approveFaculty, getAppointments, cancelAppointment } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('admin'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id/suspend', suspendUser);
router.patch('/users/:id/activate', activateUser);
router.patch('/users/:id/toggle-status', toggleUserStatus);
router.delete('/users/:id', async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You cannot delete your own account' });
    }
    const User = require('../models/User');
    const Student = require('../models/Student');
    const Faculty = require('../models/Faculty');
    
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });
    
    if (target.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Admin accounts cannot be deleted' });
    }

    // Cascade delete the associated profile
    if (target.role === 'student') {
      await Student.findOneAndDelete({ userId: target._id });
    } else if (target.role === 'faculty') {
      await Faculty.findOneAndDelete({ userId: target._id });
    }

    await User.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (e) { next(e); }
});
router.get('/faculty/pending', getPendingFaculty);
router.get('/faculty', getAllFaculty);
router.patch('/faculty/:id/approve', approveFaculty);
router.get('/appointments', getAppointments);
router.patch('/appointments/:id/cancel', cancelAppointment);

// Admin profile update
router.put('/profile', async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Name must be at least 2 characters' });
    }
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user._id, { name: name.trim() });
    return res.json({ success: true, message: 'Profile updated successfully' });
  } catch (e) { next(e); }
});

module.exports = router;
