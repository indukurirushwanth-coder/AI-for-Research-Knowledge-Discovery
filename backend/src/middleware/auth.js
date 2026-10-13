import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'researchlens_jwt_secret_dev_key_2026';

/**
 * JWT Authentication Middleware
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : null;

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'No authorization token provided. Please log in.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Your session has expired. Please log in again.'
      });
    }
    return res.status(403).json({
      error: 'Invalid token',
      message: 'Failed to authenticate token.'
    });
  }
}

/**
 * Generate signed JWT token
 */
export function generateToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export default {
  authenticate,
  generateToken
};
