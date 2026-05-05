const logger = require('../utils/logger');
const { errorResponse } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  
  if (process.env.NODE_ENV !== 'test') {
    logger.error(err.stack || err.message);
  }


  if (err.name === 'CastError') {
    return errorResponse(res, 400, 'Invalid ID format');
  }

  if (err.code === 11000) {
    return errorResponse(res, 409, 'Registration failed due to a data conflict or validation error');
  }


  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message
    }));
    return errorResponse(res, 422, 'Validation failed', errors);
  }


  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 401, 'Invalid token');
  }
  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 401, 'Token expired');
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
