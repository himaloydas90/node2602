const User = require('../model/userModel');
const asyncHandler = require('../utils/asyncHandler');
const {
  generateAccessToken,
  generateRefreshToken,
  generateTemporaryToken,
  verifyRefreshToken,
  verifyTemporaryToken,
  hashToken,
} = require('../utils/tokenHelper');
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require('../utils/sendEmail');

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const validatePassword = (password) => {
  const checks = [
    {
      test: (p) => p.length >= 8,
      msg: 'Password must be at least 8 characters long',
    },
    {
      test: (p) => /[A-Z]/.test(p),
      msg: 'Password must include an uppercase letter',
    },
    {
      test: (p) => /[a-z]/.test(p),
      msg: 'Password must include a lowercase letter',
    },
    {
      test: (p) => /\d/.test(p),
      msg: 'Password must include a number',
    },
    {
      test: (p) => /[@$!%*?&]/.test(p),
      msg: 'Password must include a special character (@$!%*?&)',
    },
  ];

  const failed = checks.find((c) => !c.test(password));
  return failed ? failed.msg : null;
};

const issueAuthTokens = async (user) => {
  const payload = { userId: user._id.toString(), email: user.email };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  user.refreshTokens.push({ token: hashToken(refreshToken) });

  // Keep only the latest 5 refresh tokens (multi-device support with a sane limit)
  if (user.refreshTokens.length > 5) {
    user.refreshTokens = user.refreshTokens.slice(-5);
  }

  await user.save();

  return { accessToken, refreshToken };
};

/**
 * POST /auth/register
 */
const register = asyncHandler(async (req, res) => {
  const {
    username,
    email,
    password,
    profileImage,
    address,
    phone,
    gender,
    dateOfBirth,
    role
  } = req.body;

  if (!username) {
    return res.status(400).json({ success: false, message: 'Username is required' });
  }
  if (username.length < 4 || username.length > 20) {
    return res.status(400).json({
      success: false,
      message: 'Username must be between 4 and 20 characters long',
    });
  }

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({ success: false, message: 'Invalid email format!' });
  }

  if (!password) {
    return res.status(400).json({ success: false, message: 'Password is required' });
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ success: false, message: passwordError });
  }

  if (gender && !['male', 'female', 'other'].includes(gender)) {
    return res.status(400).json({
      success: false,
      message: "Gender must be 'male', 'female', or 'other'",
    });
  }


  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'Email already registered!',
    });
  }

  const user = await User.create({
    username: username.trim(),
    email: email.toLowerCase().trim(),
    password,
    role,
    ...(profileImage && { profileImage }),
    ...(address && { address }),
    ...(phone && { phone }),
    ...(gender && { gender }),
    ...(dateOfBirth && { dateOfBirth }),
  });

  const verificationToken = generateTemporaryToken(
    { userId: user._id.toString(), email: user.email },
    'email_verification'
  );

  try {
    await sendVerificationEmail(user.email, verificationToken, user.username);
  } catch (emailError) {
    console.error('Verification email failed:', emailError.message);
  }

  return res.status(201).json({
    success: true,
    message:
      'User registered successfully. Please check your email (including the spam folder) to verify your account.',
    user: user.toSafeObject(),
  });
});

/**
 * POST /auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
    });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    '+password'
  );

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  if (!user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email before logging in.',
    });
  }

  const tokens = await issueAuthTokens(user);

  return res.status(200).json({
    success: true,
    message: 'Login successful',
    user: user.toSafeObject(),
    ...tokens,
  });
});

/**
 * POST /auth/refresh-token
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: 'Refresh token is required',
    });
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
    });
  }

  const hashed = hashToken(refreshToken);
  const user = await User.findById(decoded.userId);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'User not found',
    });
  }

  const tokenExists = user.refreshTokens.some((entry) => entry.token === hashed);
  if (!tokenExists) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token has been revoked',
    });
  }

  // Rotate refresh token: invalidate the old one and issue a new pair
  user.refreshTokens = user.refreshTokens.filter((entry) => entry.token !== hashed);
  const tokens = await issueAuthTokens(user);

  return res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    ...tokens,
  });
});

/**
 * POST /auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: 'Refresh token is required',
    });
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    // Token already invalid/expired — treat logout as successful
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  }

  const hashed = hashToken(refreshToken);
  await User.findByIdAndUpdate(decoded.userId, {
    $pull: { refreshTokens: { token: hashed } },
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * GET/POST /auth/verify-email
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const token = req.body?.token || req.query.token;
  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Verification token is required',
    });
  }

  let decoded;
  try {
    decoded = verifyTemporaryToken(token, 'email_verification');
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired verification token',
    });
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  if (user.isVerified) {
    return res.status(200).json({
      success: true,
      message: 'Email is already verified',
    });
  }

  user.isVerified = true;
  await user.save();

  return res.status(200).json({
    success: true,
    message: 'Email verified successfully. You can now log in.',
  });
});

/**
 * POST /auth/resend-verification
 */
const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required',
    });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  // Always return a generic success to avoid email enumeration
  const genericResponse = {
    success: true,
    message:
      'If that email is registered and unverified, a verification link has been sent. Please check your spam folder as well.',
  };

  if (!user || user.isVerified) {
    return res.status(200).json(genericResponse);
  }

  const verificationToken = generateTemporaryToken(
    { userId: user._id.toString(), email: user.email },
    'email_verification'
  );

  try {
    await sendVerificationEmail(user.email, verificationToken, user.username);
  } catch (emailError) {
    console.error('Resend verification email failed:', emailError.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to send verification email. Please try again later.',
    });
  }

  return res.status(200).json(genericResponse);
});

/**
 * POST /auth/forgot-password
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required',
    });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  const genericResponse = {
    success: true,
    message: 'If that email is registered, a password reset link has been sent.',
  };

  if (!user) {
    return res.status(200).json(genericResponse);
  }

  const resetToken = generateTemporaryToken(
    { userId: user._id.toString(), email: user.email },
    'password_reset'
  );

  try {
    await sendPasswordResetEmail(user.email, resetToken, user.username);
  } catch (emailError) {
    console.error('Password reset email failed:', emailError.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to send password reset email. Please try again later.',
    });
  }

  return res.status(200).json(genericResponse);
});

/**
 * POST /auth/reset-password
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({
      success: false,
      message: 'Token and new password are required',
    });
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ success: false, message: passwordError });
  }

  let decoded;
  try {
    decoded = verifyTemporaryToken(token, 'password_reset');
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token',
    });
  }

  const user = await User.findById(decoded.userId).select('+password');
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  user.password = password;
  // Invalidate all sessions after a password reset
  user.refreshTokens = [];
  await user.save();

  return res.status(200).json({
    success: true,
    message: 'Password reset successfully. Please log in with your new password.',
  });
});

/**
 * GET /auth/me — current authenticated user
 */
const getMe = asyncHandler(async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user.toSafeObject ? req.user.toSafeObject() : req.user,
  });
});

/**
 * POST /auth/image — existing Cloudinary upload
 */
const imageUpload = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No image was uploaded!',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Image uploaded successfully',
    url: req.file.path,
  });
});

module.exports = {
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
};
