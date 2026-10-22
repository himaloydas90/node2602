const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const TEMP_SECRET = process.env.JWT_TEMP_SECRET;

const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const TEMP_EXPIRES_IN = process.env.JWT_TEMP_EXPIRES_IN || '1h';

/**
 * Generate a short-lived access token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
};

/**
 * Generate a long-lived refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
};

/**
 * Generate a temporary token (email verification / password reset)
 * @param {object} payload
 * @param {string} purpose - 'email_verification' | 'password_reset'
 */
const generateTemporaryToken = (payload, purpose) => {
  return jwt.sign({ ...payload, purpose }, TEMP_SECRET, {
    expiresIn: TEMP_EXPIRES_IN,
  });
};

/**
 * Verify an access token
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, ACCESS_SECRET);
};

/**
 * Verify a refresh token
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_SECRET);
};

/**
 * Verify a temporary token and optionally enforce a purpose
 */
const verifyTemporaryToken = (token, expectedPurpose) => {
  const decoded = jwt.verify(token, TEMP_SECRET);

  if (expectedPurpose && decoded.purpose !== expectedPurpose) {
    const error = new Error('Invalid token purpose');
    error.name = 'TokenPurposeError';
    throw error;
  }

  return decoded;
};

/**
 * Hash a refresh token before storing it in the database
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTemporaryToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyTemporaryToken,
  hashToken,
};
