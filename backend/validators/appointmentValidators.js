const { body, query } = require('express-validator');

exports.bookAppointmentValidation = [
  body('slotId')
    .notEmpty().withMessage('Slot ID is required')
    .isMongoId().withMessage('Invalid Slot ID format'),
  body('purpose')
    .trim()
    .notEmpty().withMessage('Purpose is required')
    .isLength({ min: 10, max: 500 }).withMessage('Purpose must be between 10 and 500 characters')
];

exports.cancelValidation = [
  body('cancellationReason')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('Cancellation reason cannot exceed 300 characters')
];

exports.rejectValidation = [
  body('rejectionReason')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('Rejection reason cannot exceed 300 characters')
];

exports.addLinkValidation = [
  body('meetingLink')
    .notEmpty().withMessage('Meeting link is required')
    .isURL().withMessage('Must be a valid URL')
];
