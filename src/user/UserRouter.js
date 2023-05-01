const express = require('express');
const router = express.Router();
const User = require('./User');
const UserService = require('./UserService');
const { check, validationResult } = require('express-validator');

// VALIDATE WITHOUT USING EXPRESS VALIDATOR, PASS DATA TO REQ.BODY

// const validateUsername = (req, res, next) => {
//   const user = req.body;

//   if (user.username === null) {
//     req.validationErrors = {
//       username: 'Username cannot be null',
//     };
//   }

//   next();
// };

// const validateEmail = (req, res, next) => {
//   const user = req.body;

//   if (user.email === null) {
//     req.validationErrors = {
//       ...req.validationErrors,
//       email: 'Email cannot be null',
//     };
//   }
//   next();
// };

router.post(
  '/api/1.0/users',
  check('username')
    .notEmpty()
    .withMessage('Username cannot be null')
    .bail()
    .isLength({ min: 4, max: 32 })
    .withMessage('Must have min 4 and max 32 characters')
    .bail(),
  check('email')
    .notEmpty()
    .withMessage('Email cannot be null')
    .bail()
    .isEmail()
    .withMessage('Email is not valid')
    .bail()
    .custom(async (email) => {
      const user = await UserService.findByEmail(email);
      if (user) {
        throw new Error('Email in use');
      }
    }),
  check('password')
    .notEmpty()
    .withMessage('Password cannot be null')
    .bail()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .bail()
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).*/)
    .withMessage(
      'Password have at least 1 uppercase, 1 lower case and 1 number'
    ),
  async (req, res) => {
    const result = validationResult(req);

    if (!result.isEmpty()) {
      // const response = {
      //   validationErrors: { ...req.validationErrors },
      // };
      const validationErrors = {};
      result.errors.forEach(
        (error) => (validationErrors[error.path] = error.msg)
      );
      return res.status(400).send({ validationErrors: validationErrors });
    }

    await UserService.save(req.body);
    return res.send({ message: 'User created' });
  }
);

module.exports = router;
