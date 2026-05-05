const express = require('express');
const { register, login, refreshToken, logout, logoutAll, forgotPassword, resetPassword, changePassword, getMe } = require('../controllers/authController');
const { validate } = require('../middleware/validate');
const { registerValidation, loginValidation, forgotPasswordValidation, resetPasswordValidation, changePasswordValidation } = require('../validators/authValidators');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPasswordValidation, validate, forgotPassword);
router.patch('/reset-password', resetPasswordValidation, validate, resetPassword);

// Protected routes
router.use(protect);
router.post('/logout', logout);
router.post('/logout-all', logoutAll);
router.patch('/change-password', changePasswordValidation, validate, changePassword);
router.get('/me', getMe);

module.exports = router;
