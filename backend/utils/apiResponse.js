const successResponse = (res, statusCode, message, data = {}, meta = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(Object.keys(meta).length && { meta })
  });
};

const errorResponse = (res, statusCode, message, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors })
  });
};

module.exports = {
  successResponse,
  errorResponse
};
