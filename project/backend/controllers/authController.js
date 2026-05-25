const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const { success, error } = require('../utils/responseHandler');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, 'Validation failed', 422, errors.array().map(e => ({ field: e.path, message: e.msg })));
    }

    const { name, email, password, role = 'customer' } = req.body;

    const allowedRoles = ['customer', 'waiter', 'chef', 'admin'];
    if (!allowedRoles.includes(role)) {
      return error(res, 'Invalid role', 400);
    }

    const existing = db.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing) {
      return error(res, 'Email already registered', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const id = db.run(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );

    const user = db.get('SELECT id, name, email, role, createdAt FROM users WHERE id = ?', [id]);
    const token = generateToken(user);

    return success(res, { user, token }, 'Registration successful', 201);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, 'Validation failed', 422, errors.array().map(e => ({ field: e.path, message: e.msg })));
    }

    const { email, password } = req.body;

    const user = db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return error(res, 'Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return error(res, 'Invalid email or password', 401);
    }

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    return success(res, { user: userWithoutPassword, token }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

const getProfile = (req, res, next) => {
  try {
    const user = db.get(
      'SELECT id, name, email, role, createdAt FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!user) return error(res, 'User not found', 404);
    return success(res, user, 'Profile fetched');
  } catch (err) {
    next(err);
  }
};

const registerValidators = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'customer', 'waiter', 'chef']).withMessage('Invalid role'),
];

const loginValidators = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

module.exports = { register, login, getProfile, registerValidators, loginValidators };
