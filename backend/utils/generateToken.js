const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn, jwtRefreshSecret, jwtRefreshExpiresIn } = require('../config/jwtConfig');

const generateAccessToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, jwtSecret, { expiresIn: jwtExpiresIn });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, jwtRefreshSecret, { expiresIn: jwtRefreshExpiresIn });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, jwtRefreshSecret, { algorithms: ['HS256'] });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
