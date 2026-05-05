const { verifyAccessToken } = require('../utils/generateToken');
const { errorResponse } = require('../utils/apiResponse');
const User = require('../models/User');


const protect = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return errorResponse(res, 401, 'Not authorized, no token provided');
    }

    const decoded = verifyAccessToken(token);
    const currentUser = await User.findById(decoded.id).select('_id name email role isActive');
    
    if (!currentUser) {
      return errorResponse(res, 401, 'The user belonging to this token no longer exists');
    }

    if (!currentUser.isActive) {
      return errorResponse(res, 403, 'Your account has been suspended by an administrator');
    }

    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 401, 'Token expired, please refresh');
    }
    return errorResponse(res, 401, 'Not authorized, invalid token');
  }
};


const csrfProtect = (req, res, next) => {
  // Only validate mutating methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('application/json')) {
    return errorResponse(res, 403, 'Invalid content type');
  }

  // ── Check 2: Origin or Referer must match allowed origins ──
  const origin  = req.headers['origin'];
  const referer = req.headers['referer'];

  const allowedOrigins = [process.env.CLIENT_URL].filter(Boolean);
  if (process.env.NODE_ENV === 'development') {
    allowedOrigins.push('http://localhost:8080');
  }

  let requestOrigin = origin;
  if (!requestOrigin && referer) {
    try {
      requestOrigin = new URL(referer).origin;
    } catch (e) {
      return errorResponse(res, 403, 'Forbidden');
    }
  }


  if (!requestOrigin) {
    return next();
  }

  if (!allowedOrigins.includes(requestOrigin)) {
    return errorResponse(res, 403, 'Forbidden');
  }

  next();
};

module.exports = { protect, csrfProtect };
