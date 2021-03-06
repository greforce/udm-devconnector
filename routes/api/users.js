const express = require('express');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');

const keys = require('../../config/keys');

const router = express.Router();

// Load Input Validation
const validateRegisterInput = require('../../validation/register');
const validateLoginInput = require('../../validation/login');

// Load User model
const User = require('../../models/User');

// @route     GET api/users/test
// @desc      Tests users route
// @access    Public
router.get('/test', (req, res) => res.json({ msg: 'Users Works' }));

// @route     POST api/users/register
// @desc      Register user
// @access    Public
router.post('/register', (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const { name, email, password } = req.body;

  User.findOne({ email })
    .then((user) => {
      if (user) {
        errors.email = 'Email already exists';
        return res.status(400).json(errors);
      }
      const avatar = gravatar.url(email, {
        s: '200', // size
        r: 'pg', // rating
        d: 'mm', // default
      });
      const newUser = new User({ name, email, avatar, password });
      bcrypt.genSalt(10, (err, salt) => { // what about this err? where it shall be handled?
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser.save()
            .then((user) => res.json(user))
            .catch((err) => console.log(err));
        });
      });
    });
});

// @route     GET api/users/login
// @desc      Login user / Returning JWT Token
// @access    Public
router.post('/login', (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const { email, password } = req.body;

  // Find user by email
  User.findOne({ email })
    .then((user) => {
      // Check for user
      if (!user) {
        errors.email = 'User not found';
        return res.status(404).json(errors);
      }

      // Check Password
      bcrypt.compare(password, user.password)
        .then((isMatch) => {
          if (isMatch) {
            // User Matched
            const payload = { id: user.id, name: user.name, avatar: user.avatar };

            // Sign Token
            jwt.sign(
              payload,
              keys.secretOrKey,
              { expiresIn: 3600 },
              (err, token) => {
                res.json({
                  success: true,
                  token: 'Bearer ' + token,
                })
              });
          } else {
            errors.password = 'Password incorrect';
            return res.status(400).json(errors);
          }
        });
    })
});

// @route     GET api/users/current
// @desc      Return current user
// @access    Private
router.get(
  '/current',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { id, name, email } = req.user;
    res.json({ id, name, email });
  }
);



module.exports = router;
