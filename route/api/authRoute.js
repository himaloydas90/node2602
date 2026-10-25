const express = require('express');
const router = express.Router();

const upload = require('../../middalware/fileUploads');
const { protect } = require('../../middalware/authMiddleware');
const {limiter} = require('../../middalware/ratelimiter')
const {
  register,
  login,
  refreshAccessToken,
  logout,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  getMe,
  imageUpload,
} = require('../../controller/authController');

// Public auth routes
router.post('/register', register);
router.post('/login',limiter, login);
router.post('/refresh-token', refreshAccessToken);
router.post('/logout', logout);

router.get('/verify-email', verifyEmail);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected
router.get('/me', protect, getMe);
router.post('/image', protect, upload.single('avatar'), imageUpload);

module.exports = router;
