import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { generateToken } from '../middleware/auth.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';

/**
 * Register a new user
 */
export async function register(req, res, next) {
  try {
    const validated = registerSchema.parse(req.body);
    const { email, password, fullName } = validated;

    // Check if user already exists
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows && existing.rows.length > 0) {
      return res.status(409).json({
        error: 'Email already registered',
        message: 'An account with this email address already exists. Please log in.'
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Save user
    const insertResult = await db.query(
      'INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name, created_at',
      [email, passwordHash, fullName || '']
    );

    const newUser = insertResult.rows[0];

    // Issue JWT
    const token = generateToken({
      id: newUser.id,
      email: newUser.email
    });

    res.status(201).json({
      message: 'Account successfully registered',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.full_name || '',
        createdAt: newUser.created_at
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Login existing user
 */
export async function login(req, res, next) {
  try {
    const validated = loginSchema.parse(req.body);
    const { email, password } = validated;

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!result.rows || result.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Incorrect email or password.'
      });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Incorrect email or password.'
      });
    }

    const token = generateToken({
      id: user.id,
      email: user.email
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name || '',
        createdAt: user.created_at
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get current authenticated user details
 */
export async function getMe(req, res, next) {
  try {
    const result = await db.query('SELECT id, email, full_name, created_at FROM users WHERE id = $1', [req.user.id]);
    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile no longer exists.'
      });
    }

    const user = result.rows[0];
    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name || '',
        createdAt: user.created_at
      }
    });
  } catch (err) {
    next(err);
  }
}

export default {
  register,
  login,
  getMe
};
