const { body, validationResult } = require('express-validator');

exports.validate= [
  // Validate email
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email provided is not valid '),

  // Validate password
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),

  // for validating errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = errors.array()[0].msg; // Get the first error message
        return res.status(400).json({ error });
    //   return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];