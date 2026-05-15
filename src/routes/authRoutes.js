const express = require('express');
const router = express.Router();
const { 
    register, 
    login, 
    refreshToken, 
    logout, 
    getMe
} = require('../controllers/AuthController');

// Validation Middleware (Joi)
const { validateRegister, validateLogin } = require('../middleware/validator');
const { protect } = require('../middleware/auth');

/**
 * @route   POST /api/auth/register
 * @desc    Naya user register karein
 * @access  Public
 */
router.post('/register', validateRegister, register);

/**
 * @route   POST /api/auth/login
 * @desc    Email aur password ke saath login
 * @access  Public
 */
router.post('/login', validateLogin, login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Naya Access Token generate karein
 * @access  Public
 */
router.post('/refresh', refreshToken);

/**
 * @route   POST /api/auth/logout  <-- Changed to POST (Standard practice)
 * @desc    Cookie clear karein aur logout karein
 * @access  Private (Logged in user hi logout kar sakay)
 */
router.post('/logout', protect, logout); // 🔥 Added protect here

/**
 * @route   GET /api/auth/me
 * @desc    Current logged-in user profile
 * @access  Private
 */
router.get('/me', protect, getMe);

module.exports = router;