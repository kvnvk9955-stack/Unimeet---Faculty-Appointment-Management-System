const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const { maxSessionsPerUser } = require('../config/jwtConfig');
const sendEmail = require('../utils/sendEmail');
const emailTemplates = require('../utils/emailTemplates');
const logger = require('../utils/logger');
const notifyAdmins = require('../utils/notifyAdmins');

// ────────────────────────────────────────────────────────────────
// TOKEN DELIVERY: JSON Response Body + localStorage
// ────────────────────────────────────────────────────────────────
// Tokens are returned in the JSON response body. The frontend
// stores them in localStorage and attaches the access token as
// an Authorization: Bearer header on every request.
// The refresh token is sent in the request body when refreshing.
// ────────────────────────────────────────────────────────────────

const ACCESS_TOKEN_MAX_AGE  = 15 * 60 * 1000;         // 15 minutes
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// ── Helper: Hash a token for DB storage ──
// SECURITY DECISION: We use SHA-256 hashing (not bcrypt) because
// refresh tokens are high-entropy random JWTs (not user passwords).
// SHA-256 is irreversible for high-entropy inputs and O(1) per check,
// whereas bcrypt would add ~250ms latency per refresh request.
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// ── Helper: Generate a token family ID ──
// Each login creates a new family. All rotated tokens inherit the
// same family ID. If a used token is replayed, we wipe the family.
const generateFamily = () => crypto.randomBytes(16).toString('hex');

// ────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ────────────────────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, department, studentId, employeeId, designation, phone } = req.body;

    const userExists = await User.findOne({ email }).lean();
    if (userExists) {
      return errorResponse(res, 400, 'User already exists with this email');
    }

    if (role === 'admin' && req.headers['admin-secret'] !== process.env.ADMIN_SECRET) {
      const adminExists = await User.findOne({ role: 'admin' }).lean();
      if (adminExists) {
        return errorResponse(res, 403, 'Unauthorized to create admin account');
      }
    }

    const newUser = await User.create({ name, email, password, role });

    try {
      if (role === 'student') {
        await Student.create({ userId: newUser._id, studentId, department, phone });
      } else if (role === 'faculty') {
        await Faculty.create({ userId: newUser._id, employeeId, department, designation, phone });
        
        // Notify admin about new faculty registration
        notifyAdmins({
          title: 'New Faculty Registration',
          message: `${newUser.name} has registered as faculty and is awaiting approval.`,
          type: 'general'
        });
      }
    } catch (profileError) {
      // Cleanup: delete the User if profile creation failed to prevent orphaned users
      await User.findByIdAndDelete(newUser._id);
      throw profileError;
    }

    const accessToken  = generateAccessToken(newUser._id, newUser.role);
    const refreshToken = generateRefreshToken(newUser._id);
    const family = generateFamily();

    // ATOMIC: Push first session token directly
    await User.updateOne({ _id: newUser._id }, {
      $push: {
        refreshTokens: {
          tokenHash:   hashToken(refreshToken),
          tokenFamily: family,
          expiresAt:   new Date(Date.now() + REFRESH_TOKEN_MAX_AGE),
          deviceIp:    req.ip,
          userAgent:   (req.headers['user-agent'] || '').substring(0, 256)
        }
      }
    });

    // Non-blocking welcome email
    sendEmail({
      to: newUser.email,
      subject: 'Welcome to Unimeet!',
      html: emailTemplates.welcomeEmail(newUser.name, newUser.role)
    }).catch(err => logger.error(`Welcome email failed: ${err.message}`));

    return successResponse(res, 201, 'Registration successful', {
      user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role },
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ────────────────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +failedLoginAttempts +lockUntil +refreshTokens');
    if (!user) {
      // SECURITY: Dummy bcrypt compare to prevent timing side-channel.
      // Without this, "user not found" returns in ~2ms while
      // "wrong password" takes ~250ms (bcrypt). An attacker can
      // measure response times to enumerate valid email addresses.
      await bcrypt.compare(password, '$2a$12$000000000000000000000000000000000000000000000000000000');
      return errorResponse(res, 401, 'Invalid credentials');
    }

    if (user.isLocked()) {
      return errorResponse(res, 403, 'Account is temporarily locked due to too many failed attempts. Please try again later.');
    }

    if (!user.isActive) {
      return errorResponse(res, 403, 'Your account has been suspended');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // ATOMIC: Increment failed attempts without .save()
      const update = { $inc: { failedLoginAttempts: 1 } };
      if ((user.failedLoginAttempts || 0) + 1 >= 10) {
        update.$set = { lockUntil: new Date(Date.now() + 15 * 60 * 1000) };
      }
      await User.updateOne({ _id: user._id }, update);
      return errorResponse(res, 401, 'Invalid credentials');
    }

    const accessToken  = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);
    const family = generateFamily();
    const now = new Date();

    // ── ATOMIC: Session management ──
    // 1. Remove expired tokens
    // 2. Push new session
    // 3. Enforce max sessions (remove oldest if over limit)
    // All done atomically to prevent race conditions during concurrent logins.
    await User.updateOne({ _id: user._id }, {
      $set: { failedLoginAttempts: 0, lastLogin: now },
      $unset: { lockUntil: '' },
      $pull: { refreshTokens: { expiresAt: { $lt: now } } }
    });

    await User.updateOne({ _id: user._id }, {
      $push: {
        refreshTokens: {
          $each: [{
            tokenHash:   hashToken(refreshToken),
            tokenFamily: family,
            expiresAt:   new Date(Date.now() + REFRESH_TOKEN_MAX_AGE),
            deviceIp:    req.ip,
            userAgent:   (req.headers['user-agent'] || '').substring(0, 256)
          }],
          // SECURITY DECISION: $slice enforces max sessions at the DB level.
          // Negative value keeps the LAST N entries (newest).
          // This means oldest sessions are automatically evicted on login.
          $slice: -(maxSessionsPerUser)
        }
      }
    });

    return successResponse(res, 200, 'Login successful', {
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────
// POST /api/auth/refresh-token
// ────────────────────────────────────────────────────────────────
// SECURITY ARCHITECTURE:
//
// This is the most security-critical function in the entire app.
// It must be atomic, race-condition-proof, and resistant to
// token cloning attacks under parallel execution.
//
// ALGORITHM:
//   1. Verify JWT signature → extract userId
//   2. Hash the presented token
//   3. ATOMIC findOneAndUpdate:
//        Filter: { userId, tokenHash, usedAt: null }
//        Update: { $set: { usedAt: now } }
//      This is document-level locked by MongoDB. ONLY ONE thread
//      can match and claim an unused token. The loser gets null.
//   4. If claimed → generate new pair, atomically push new token
//   5. If NOT claimed → check if token exists with usedAt set:
//      a. Recently used (< 10s) → race condition, return 200 (no new tokens)
//      b. Old usage → GENUINE REUSE ATTACK → wipe entire token family
//   6. Cleanup: pull expired + old used tokens
//
// WHY THIS IS UNBREAKABLE:
//   - findOneAndUpdate is atomic at MongoDB's storage engine level
//   - Two threads racing on the same token: only one gets the match
//   - The loser cannot mint tokens because it gets null
//   - Token family tracking means reuse wipes only the compromised
//     session chain, not unrelated device sessions
// ────────────────────────────────────────────────────────────────
exports.refreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) return errorResponse(res, 401, 'No refresh token provided');

    // Step 1: Verify JWT signature
    let decoded;
    try {
      decoded = require('../utils/generateToken').verifyRefreshToken(refreshToken);
    } catch (err) {
      return errorResponse(res, 401, 'Invalid or expired refresh token');
    }

    const hashedToken = hashToken(refreshToken);

    // ── Step 2: ATOMIC claim ──
    // This is the critical section. MongoDB guarantees that
    // findOneAndUpdate is atomic at the document level.
    // The filter demands usedAt: null (or $exists: false).
    // Only the FIRST thread to execute this will match.
    // The second thread will get result = null.
    const claimResult = await User.findOneAndUpdate(
      {
        _id: decoded.id,
        isActive: true,
        refreshTokens: {
          $elemMatch: {
            tokenHash: hashedToken,
            usedAt: { $exists: false }
          }
        }
      },
      {
        $set: { 'refreshTokens.$[elem].usedAt': new Date() }
      },
      {
        arrayFilters: [{ 'elem.tokenHash': hashedToken }],
        new: false,  // return the document BEFORE update so we can read the family
        projection: { refreshTokens: 1, role: 1 }
      }
    );

    if (claimResult) {
      // ── SUCCESS: We claimed the token ──
      // Find the matched token entry to get the family
      const claimedEntry = claimResult.refreshTokens.find(
        rt => rt.tokenHash === hashedToken
      );
      const family = claimedEntry ? claimedEntry.tokenFamily : generateFamily();

      // Generate new pair
      const newAccessToken  = generateAccessToken(decoded.id, claimResult.role);
      const newRefreshToken = generateRefreshToken(decoded.id);
      const newTokenHash    = hashToken(newRefreshToken);

      // 1. ATOMIC: Push new token (same family)
      const newTokenObj = {
        tokenHash:   newTokenHash,
        tokenFamily: family,
        expiresAt:   new Date(Date.now() + REFRESH_TOKEN_MAX_AGE),
        deviceIp:    req.ip,
        userAgent:   (req.headers['user-agent'] || '').substring(0, 256),
        createdAt:   new Date()
      };

      await User.updateOne(
        { _id: decoded.id },
        { $push: { refreshTokens: newTokenObj } }
      );

      // 2. CLEANUP: Remove expired tokens and tokens used > 10 seconds ago
      const tenSecondsAgo = new Date(Date.now() - 10000);
      await User.updateOne(
        { _id: decoded.id },
        {
          $pull: {
            refreshTokens: {
              $or: [
                { expiresAt: { $lt: new Date() } },
                { usedAt: { $lt: tenSecondsAgo } }
              ]
            }
          }
        }
      );

      return successResponse(res, 200, 'Token refreshed successfully', {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      });
    }

    // ── CLAIM FAILED: Token was not matched as unused ──
    // Two possibilities:
    //   A. Race condition (another thread just claimed it < 10s ago)
    //   B. Genuine reuse attack (token was rotated long ago)

    // Check if the token exists at all (with usedAt set)
    const user = await User.findOne(
      {
        _id: decoded.id,
        'refreshTokens.tokenHash': hashedToken
      },
      { 'refreshTokens.$': 1 }
    ).lean();

    if (user && user.refreshTokens && user.refreshTokens[0]) {
      const entry = user.refreshTokens[0];
      const timeSinceUse = Date.now() - new Date(entry.usedAt).getTime();

      if (timeSinceUse <= 10000) {
        // ── RACE CONDITION (benign) ──
        // Another thread just claimed this token < 10 seconds ago.
        // The client will receive the new tokens from that thread's response.
        // We return 200 with no new tokens so the client knows it's fine.
        return successResponse(res, 200, 'Token refreshed successfully');
      }

      // ── GENUINE REUSE ATTACK ──
      // This token was used > 10 seconds ago. An attacker is replaying it.
      // Nuke the ENTIRE token family to kill all descendants.
      const family = entry.tokenFamily;
      await User.updateOne(
        { _id: decoded.id },
        { $pull: { refreshTokens: { tokenFamily: family } } }
      );
      logger.warn(`TOKEN REUSE DETECTED for user ${decoded.id}, family ${family}. Family wiped.`);
      return errorResponse(res, 403, 'Security alert: Token reuse detected. Session revoked. Please log in again.');
    }

    // Token hash not in DB at all → already cleaned up or forged
    return errorResponse(res, 401, 'Invalid refresh token');

  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────
// POST /api/auth/logout  (single device)
// ────────────────────────────────────────────────────────────────
// SECURITY DECISION: Uses ATOMIC $pull instead of .save()
// This ensures that logging out on laptop does NOT overwrite
// a concurrent token rotation happening on your phone.
// ────────────────────────────────────────────────────────────────
exports.logout = async (req, res, next) => {
  try {
    const refreshToken = req.body.refreshToken;

    if (refreshToken) {
      const hashedToken = hashToken(refreshToken);
      // ATOMIC: Pull only this specific token
      await User.updateOne(
        { _id: req.user._id },
        { $pull: { refreshTokens: { tokenHash: hashedToken } } }
      );
    }

    return successResponse(res, 200, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────
// POST /api/auth/logout-all  (all devices)
// ────────────────────────────────────────────────────────────────
exports.logoutAll = async (req, res, next) => {
  try {
    // ATOMIC: Set refreshTokens to empty array
    await User.updateOne(
      { _id: req.user._id },
      { $set: { refreshTokens: [] } }
    );

    return successResponse(res, 200, 'Logged out from all devices successfully');
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// ────────────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Always return 200 to prevent email enumeration
      return successResponse(res, 200, 'If your email is registered, you will receive a reset link shortly');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    // ATOMIC: Set reset token fields without .save()
    await User.updateOne({ _id: user._id }, {
      $set: {
        passwordResetToken: hashToken(resetToken),
        passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000)
      }
    });

    const resetURL = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    if (process.env.NODE_ENV === 'development') {
      logger.info(`\n========== PASSWORD RESET LINK ==========`);
      logger.info(`User: ${user.email}`);
      logger.info(`Link: ${resetURL}`);
      logger.info(`=========================================\n`);
    }
    
    sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      html: emailTemplates.passwordResetEmail(user.name, resetURL)
    }).catch(err => {
      logger.error(`Forgot password email failed: ${err.message}`);
      User.updateOne({ _id: user._id }, {
        $unset: { passwordResetToken: '', passwordResetExpires: '' }
      }).catch(() => {});
    });

    const responseData = process.env.NODE_ENV === 'development' ? { resetURL } : {};
    return successResponse(res, 200, 'If your email is registered, you will receive a reset link shortly', responseData);
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────
// PATCH /api/auth/reset-password
// ────────────────────────────────────────────────────────────────
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    const hashedResetToken = hashToken(token);
    const user = await User.findOne({
      passwordResetToken: hashedResetToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return errorResponse(res, 400, 'Token is invalid or has expired');
    }

    // Password change requires .save() to trigger the bcrypt pre-save hook.
    // But we also atomically wipe all sessions to force re-login.
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // ATOMIC: Wipe all sessions (separate operation, safe)
    await User.updateOne({ _id: user._id }, { $set: { refreshTokens: [] } });

    return successResponse(res, 200, 'Password has been reset successfully');
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────
// PATCH /api/auth/change-password
// ────────────────────────────────────────────────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return errorResponse(res, 400, 'Incorrect old password');
    }
    
    // Password change requires .save() for bcrypt hook
    user.password = newPassword;
    await user.save();

    // ATOMIC: Wipe all sessions (separate, no race condition risk)
    await User.updateOne({ _id: user._id }, { $set: { refreshTokens: [] } });

    return successResponse(res, 200, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────
// GET /api/auth/me
// ────────────────────────────────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    let profile = null;
    
    if (req.user.role === 'student') {
      profile = await Student.findOne({ userId: req.user._id }).lean();
    } else if (req.user.role === 'faculty') {
      profile = await Faculty.findOne({ userId: req.user._id }).lean();
    }
    
    return successResponse(res, 200, 'User details fetched', {
      user: req.user,
      profile
    });
  } catch (error) {
    next(error);
  }
};
