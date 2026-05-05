const { body } = require('express-validator');

const departmentsList = [
  'Computer Science', 'Information Technology', 'Electronics & Communication',
  'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering',
  'MBA', 'MCA', 'Mathematics', 'Physics', 'Chemistry', 'English'
];

exports.registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[a-zA-Z]/).withMessage('Password must contain at least one letter'),
  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['student', 'faculty', 'admin']).withMessage('Role must be student, faculty, or admin'),
  body('department')
    .if(body('role').equals('faculty'))
    .notEmpty().withMessage('Department is required for faculty')
    .isIn(departmentsList).withMessage('Invalid department'),
  body('department')
    .if(body('role').equals('student'))
    .notEmpty().withMessage('Department is required for student')
    .isIn(departmentsList).withMessage('Invalid department'),
  body('studentId')
    .if(body('role').equals('student'))
    .notEmpty().withMessage('Student ID is required'),
  body('employeeId')
    .if(body('role').equals('faculty'))
    .notEmpty().withMessage('Employee ID is required'),
  body('designation')
    .if(body('role').equals('faculty'))
    .notEmpty().withMessage('Designation is required for faculty')
    .isIn(['Assistant Professor', 'Associate Professor', 'Professor', 'HOD', 'Dean']).withMessage('Invalid designation'),
  body('phone')
    .optional({ checkFalsy: true })
    .matches(/^\+?[1-9]\d{1,14}$/).withMessage('Please provide a valid phone number')
];

exports.loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
  body('password')
    .notEmpty().withMessage('Password is required')
];

exports.changePasswordValidation = [
  body('oldPassword')
    .notEmpty().withMessage('Old password is required'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[a-zA-Z]/).withMessage('Password must contain at least one letter'),
  body('confirmPassword')
    .notEmpty().withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

exports.forgotPasswordValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
];

exports.resetPasswordValidation = [
  body('token')
    .notEmpty().withMessage('Reset token is required'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('confirmPassword')
    .notEmpty().withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];
