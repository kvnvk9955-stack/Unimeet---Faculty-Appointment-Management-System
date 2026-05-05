const { body } = require('express-validator');

exports.createSlotValidation = [
  body('date')
    .notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Must be a valid date format')
    .custom((value) => {
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        throw new Error('Date cannot be in the past');
      }
      return true;
    }),
  body('startTime')
    .notEmpty().withMessage('Start time is required')
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Start time must be in 24h format HH:MM (e.g. 09:00)'),
  body('endTime')
    .notEmpty().withMessage('End time is required')
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('End time must be in 24h format HH:MM (e.g. 09:30)'),
  body('duration')
    .optional()
    .isInt({ min: 10, max: 120 }).withMessage('Duration must be between 10 and 120 minutes'),
  body('mode')
    .optional()
    .isIn(['online', 'offline']).withMessage('Mode must be online or offline')
];
