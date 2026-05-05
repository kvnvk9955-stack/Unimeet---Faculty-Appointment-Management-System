const express = require('express');
const { getNotifications, markAllAsRead, markAsRead, deleteNotification, clearAllNotifications } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.patch('/mark-all-read', markAllAsRead);
router.delete('/clear', clearAllNotifications);
router.patch('/:id/mark-read', markAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;
