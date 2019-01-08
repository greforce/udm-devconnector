const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');

const router = express.Router();

// Load Input Validation
const validateProfileInput = require('../../validation/profile');
const validateExperienceInput = require('../../validation/experience');
const validateEducationInput = require('../../validation/education');

// Load Profile model
const Profile = require('../../models/Profile');
// Load User model
const User = require('../../models/User');

// @route     GET api/users/test
// @desc      Tests profile route
// @access    Public
router.get('/test', (req, res) => res.json({ msg: 'Profile Works' }));

// @route     GET api/profile
// @desc      Get current users profile
// @access    Private
router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const errors = {};

    const { id, name, email } = req.user;

    Profile.findOne({ user: id })
      .populate('user', ['name', 'avatar'])
      .then((profile) => {
        if (!profile) {
          errors.noprofile = 'There is no profile for this user';
          return res.status(404).json(errors);
        }
        res.json(profile);
      })
      .catch((err) => res.status(404).json(err));
  }
);

// @route     GET api/profile/all
// @desc      Get all profiles
// @access    Public
router.get('/all', (req, res) => {
  const errors = {};
  Profile.find()
    .populate('user', ['name', 'avatar'])
    .then(profiles => {
      if (!profiles) {
        errors.noprofile = 'There are no profiles';
        return res.status(404).json(errors);
      }
      res.json(profiles);
    })
    .catch(err =>
      res.status(404).json({ profile: 'There is no profile for this user' })
    );
});

// @route     GET api/profile/handle/:handle
// @desc      Get profile by handle
// @access    Public
router.get('/handle/:handle', (req, res) => {
  const errors = {};
  const { handle } = req.params;
  Profile.findOne({ handle })
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if (!profile) {
        errors.noprofile = 'There is no profile for this user';
        return res.status(404).json(errors);
      }
      res.json(profile);
    })
    .catch(err =>
      res.status(404).json({ profile: 'There is no profile for this user' })
    );
});

// @route     GET api/profile/user/:user_id
// @desc      Get profile by user ID
// @access    Public
router.get('/user/:user_id', (req, res) => {
  const errors = {};
  const { user_id } = req.params;
  Profile.findOne({ user: user_id })
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if (!profile) {
        errors.noprofile = 'There is no profile for this user';
        return res.status(404).json(errors);
      }
      res.json(profile);
    })
    .catch(err => res.status(404).json({ profile: 'There is no profile for this user' }));
});


// @route     POST api/profile
// @desc      Create or Update users profile
// @access    Private
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { errors, isValid } = validateProfileInput(req.body);
    if (!isValid) {
      return res.status(400).json(errors);
    }
    const { id, name, email } = req.user;
    const {
      handle, company, website, location, bio, status, githubusername,
      skills, youtube, twitter, linkedin, facebook, instagram,
    } = req.body;
    const profileFields = {};
    profileFields.user = id;
    if (handle) { profileFields.handle = handle; }
    if (company) { profileFields.company = company; }
    if (website) { profileFields.website = website; }
    if (location) { profileFields.location = location; }
    if (bio) { profileFields.bio = bio; }
    if (status) { profileFields.status = status; }
    if (githubusername) { profileFields.githubusername = githubusername; }
    // Skills - Split it into array
    if (typeof skills !== 'undefined') {
      profileFields.skills = skills.split(',');
    }
    // Social
    profileFields.social = {};
    if (youtube) { profileFields.social.youtube = youtube; }
    if (twitter) { profileFields.social.twitter = twitter; }
    if (linkedin) { profileFields.social.linkedin = linkedin; }
    if (facebook) { profileFields.social.facebook = facebook; }
    if (instagram) { profileFields.social.instagram = instagram; }

    Profile.findOne({ user: id })
      .then((profile) => {
        if (profile) {
          // Update
          Profile.findOneAndUpdate(
            { user: id },
            { $set: profileFields },
            { new: true },
          )
            .then((profile) => res.json(profile));
        } else {
          // Create

          // Check if handle exists
          Profile.findOne({ handle: profileFields.handle })
            .then((profile) => {
              if (profile) {
                errors.handle = 'This handle already exists';
                return res.status(400).json(errors); // TOFIX - was a bug, no return!
              }

              // Save profile
              new Profile(profileFields).save()
                .then((profile) => res.json(profile)); // TODO - catch err
            })
        }
      })

  }
);

// @route     POST api/profile/experience
// @desc      Add experience to profile
// @access    Private
router.post(
  '/experience',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { errors, isValid } = validateExperienceInput(req.body);
    if (!isValid) {
      return res.status(400).json(errors);
    }
    const { id, name, email } = req.user;
    const { title, company, location, from, to, current, description } = req.body;
    Profile.findOne({ user: id })
      .then(profile => {
        if (!profile) {
          errors.noprofile = 'There is no profile for this user';
          return res.status(404).json(errors);
        }
        const newExp = { title, company, location, from, to, current, description };

        // Add to exp array
        profile.experience.unshift(newExp);

        profile.save().then(profile => res.json(profile));
      });
  }
);

// @route     POST api/profile/education
// @desc      Add education to profile
// @access    Private
router.post(
  '/education',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { errors, isValid } = validateEducationInput(req.body);
    if (!isValid) {
      return res.status(400).json(errors);
    }
    const { id, name, email } = req.user;
    const { school, degree, fieldofstudy, from, to, current, description } = req.body;
    Profile.findOne({ user: id })
      .then(profile => {
        if (!profile) {
          errors.noprofile = 'There is no profile for this user';
          return res.status(404).json(errors);
        }
        const newEdu = { school, degree, fieldofstudy, from, to, current, description };

        // Add to edu array
        profile.education.unshift(newEdu);

        profile.save().then(profile => res.json(profile));
      });
  }
);

// @route     DELETE api/profile/experience/:exp_id
// @desc      Delete experience from profile
// @access    Private
router.delete(
  '/experience/:exp_id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const errors = {};
    const { id, name, email } = req.user;
    const { exp_id } = req.params;
    Profile.findOne({ user: id })
      .then(profile => {
        if (!profile) {
          errors.noprofile = 'There is no profile for this user';
          return res.status(404).json(errors);
        }
        // Get remove index
        const removeIndex = profile.experience
          .map(item => item.id)
          .indexOf(exp_id);

        if (removeIndex === -1) {
          errors.noexperience = 'There is no experience record with such id';
          return res.status(404).json(errors);
        }

        // Splice out of array
        profile.experience.splice(removeIndex, 1);

        // Save
        profile.save().then(profile => res.json(profile));
      })
      .catch(err => res.status(404).json(err));;
  }
);

// @route     DELETE api/profile/education/:edu_id
// @desc      Delete education from profile
// @access    Private
router.delete(
  '/education/:edu_id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const errors = {};
    const { id, name, email } = req.user;
    const { edu_id } = req.params;
    Profile.findOne({ user: id })
      .then(profile => {
        if (!profile) {
          errors.noprofile = 'There is no profile for this user';
          return res.status(404).json(errors);
        }
        // Get remove index
        const removeIndex = profile.education
          .map(item => item.id)
          .indexOf(edu_id);

        if (removeIndex === -1) {
          errors.noeducation = 'There is no education record with such id';
          return res.status(404).json(errors);
        }

        // Splice out of array
        profile.education.splice(removeIndex, 1);

        // Save
        profile.save().then(profile => res.json(profile));
      })
      .catch(err => res.status(404).json(err));;
  }
);

// @route     DELETE api/profile
// @desc      Delete user and profile
// @access    Private
router.delete(
  '/',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const errors = {};
    const { id, name, email } = req.user;
    Profile.findOneAndRemove({ user: id })
      .then(() => {
        User.findOneAndRemove({ _id: id })
          .then(() => res.json({ success: true }));
      })
  }
);


module.exports = router;
