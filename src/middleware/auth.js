const jwt = require('jsonwebtoken');
const ErrorHandler = require('../utils/ErrorHandler');
const User = require('../models/User');

// Check if user is authenticated
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ErrorHandler('Not authorized to access this route', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return next(new ErrorHandler('User no longer exists', 404));
    }

    next();
  } catch (err) {
    return next(new ErrorHandler('Token invalid or expired', 401));
  }
};

// Role-based Authorization (Admin, Author etc.)
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Agar user ka role allowed roles list mein nahi hai
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(`User role ${req.user.role} is not authorized to access this route`, 403)
      );
    }
    next();
  };
};