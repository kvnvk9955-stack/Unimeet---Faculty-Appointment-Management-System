const Notification = require('../models/Notification');
const { successResponse, errorResponse } = require('../utils/apiResponse');

exports.getNotifications = async (req, res, next) => {
  try {
    const { isRead, page = 1, limit = 15 } = req.query;
    
    const query = { userId: req.user._id };
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId: req.user._id, isRead: false })
    ]);

    return successResponse(res, 200, 'Notifications retrieved', { notifications, unreadCount }, {
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      limit: Number(limit)
    });
  } catch (error) {
    next(error);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    return successResponse(res, 200, 'All notifications marked as read', { updatedCount: result.modifiedCount });
  } catch (error) {
    next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      return errorResponse(res, 404, 'Notification not found');
    }

    return successResponse(res, 200, 'Notification marked as read', notification);
  } catch (error) {
    next(error);
  }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    const result = await Notification.deleteOne({ _id: req.params.id, userId: req.user._id });
    
    if (result.deletedCount === 0) {
      return errorResponse(res, 404, 'Notification not found');
    }

    return successResponse(res, 200, 'Notification deleted successfully');
  } catch (error) {
    next(error);
  }
};

exports.clearAllNotifications = async (req, res, next) => {
  try {
    const result = await Notification.deleteMany({ userId: req.user._id });
    return successResponse(res, 200, 'All notifications cleared', { deletedCount: result.deletedCount });
  } catch (error) {
    next(error);
  }
};
