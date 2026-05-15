const Joi = require('joi');
const ErrorHandler = require('../utils/ErrorHandler');

// User Registration Validation
exports.validateRegister = (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().required().min(3).max(30),
        email: Joi.string().email().required(),
        password: Joi.string().required().min(6),
        role: Joi.string().valid('admin', 'author').default('author')
    });

    const { error } = schema.validate(req.body);
    if (error) return next(new ErrorHandler(error.details[0].message, 400));
    next();
};

// Login Validation
exports.validateLogin = (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    });

    const { error } = schema.validate(req.body);
    if (error) return next(new ErrorHandler(error.details[0].message, 400));
    next();
};