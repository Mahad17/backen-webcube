const User = require('../models/User');
const ErrorHandler = require('../utils/ErrorHandler');
const jwt = require('jsonwebtoken');

// Helper function to send tokens
const sendTokenResponse = (user, statusCode, res) => {
    // Methods humne User model mein pehle hi define kiye thay
    const accessToken = user.getSignedJwtToken();
    const refreshToken = user.getRefreshToken();

    const options = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
    };

    res.status(statusCode).cookie('refreshToken', refreshToken, options).json({
        success: true,
        message: "Login Successful",
        accessToken, 
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
};

// @desc    Get all users
// @route   GET /api/users
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: users });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Update user role
// @route   PATCH /api/users/:id/role
exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        
        // Validate role
        if (!['admin', 'author'].includes(role)) {
            return res.status(400).json({ success: false, message: "Invalid role" });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id, 
            { role }, 
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Admin can create any user with any role
exports.adminCreateUser = async (req, res, next) => {
  try {
    const user = await User.create(req.body); 
    res.status(201).json({ success: true, data: user });
  } catch (error) { next(error); }
};

exports.getMe = async (req, res) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, user });
};

// @desc    Register User
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;
        const user = await User.create({ name, email, password, role: 'author' });
        sendTokenResponse(user, 201, res);
    } catch (error) {
        next(error);
    }
};

// @desc    Login User
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await user.matchPassword(password))) {
            return next(new ErrorHandler('Invalid Credentials', 401));
        }

        sendTokenResponse(user, 200, res);
    } catch (error) {
        next(error);
    }
};

// @desc    Refresh Token Logic
exports.refreshToken = async (req, res, next) => {
    try {
        const token = req.cookies.refreshToken;

        if (!token) return next(new ErrorHandler('No Refresh Token Provided', 401));

        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) return next(new ErrorHandler('User not found', 404));

        const accessToken = user.getSignedJwtToken();

        res.status(200).json({
            success: true,
            accessToken
        });
    } catch (error) {
        next(new ErrorHandler('Invalid Refresh Token', 403));
    }
};

// @desc    Logout User
exports.logout = async (req, res, next) => {
    res.cookie('refreshToken', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
};