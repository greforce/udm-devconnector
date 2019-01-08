const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');

const router = express.Router();

// Load Input Validation
const validatePostInput = require('../../validation/post');
const validateCommentInput = require('../../validation/comment');

// Load Post model
const Post = require('../../models/Post');
// Load User model
const User = require('../../models/User');

// @route     GET api/users/test
// @desc      Tests posts route
// @access    Public
router.get('/test', (req, res) => res.json({ msg: 'Posts Works' }));

// @route     GET api/posts
// @desc      Get posts
// @access    Public
router.get('/', (req, res) => {
  Post.find()
    .sort({ date: -1 })
    .then(posts => res.json(posts))
    .catch(err =>
      res.status(404).json({ nopostsfound: 'No posts found' })
    );
});

// @route     GET api/posts/:post_id
// @desc      Get post by id
// @access    Public
router.get('/:post_id', (req, res) => {
  const { post_id } = req.params;
  Post.findById(post_id)
    .then(post => res.json(post))
    .catch(err =>
      res.status(404).json({ nopostfound: 'No post found with this id' })
    );
});

// @route     POST api/posts
// @desc      Create post
// @access    Private
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);
    if (!isValid) {
      return res.status(400).json(errors);
    }
    const { id, name, avatar } = req.user;
    const { text } = req.body;
    const newPost = new Post({ text, name, avatar, user: id }); // TODO - name, avatar from req.body or req.user?

    newPost.save().then(post => res.json(post));
  }
);

// @route     DELETE api/posts/:post_id
// @desc      Delete post
// @access    Private
router.delete(
  '/:post_id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const errors = {};
    const { id, name, avatar } = req.user;
    const { post_id } = req.params;

    Profile.findOne({ user: id })
      .then(profile => {
        if (!profile) {
          errors.noprofile = 'There is no profile for this user';
          return res.status(404).json(errors);
        }
        Post.findById(post_id)
          .then(post => {
            // Check for post owner
            if (post.user.toString() !== id) {
              return res.status(401).json({ notauthorized: 'User not authorized' });
            }

            // Delete
            post.remove().then(() => res.json({ success: true }));
          })
          .catch(err =>
            res.status(404).json({ nopostfound: 'No post found with this id' })
          );
      });
  }
);

// @route     POST api/posts/like/:post_id
// @desc      Like post
// @access    Private
router.post(
  '/like/:post_id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const errors = {};
    const { id, name, avatar } = req.user;
    const { post_id } = req.params;

    Profile.findOne({ user: id })
      .then(profile => {
        if (!profile) {
          errors.noprofile = 'There is no profile for this user';
          return res.status(404).json(errors);
        }
        Post.findById(post_id)
          .then(post => {
            // Check for post owner
            if (post.user.toString() === id) {
              return res.status(401).json({ notauthorized: 'User cannot like own post' });
            }
            if (post.likes.filter(like => like.user.toString() === id).length > 0) {
              return res.status(400).json({ alreadyliked: 'User already liked this post' });
            }
            // Add user id to likes array
            post.likes.unshift({ user: id });
            // Like
            post.save().then(post => res.json(post));
          })
          .catch(err =>
            res.status(404).json({ nopostfound: 'No post found with this id' })
          );
      });
  }
);

// @route     POST api/posts/unlike/:post_id
// @desc      Unlike post
// @access    Private
router.post(
  '/unlike/:post_id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const errors = {};
    const { id, name, avatar } = req.user;
    const { post_id } = req.params;

    Profile.findOne({ user: id })
      .then(profile => {
        if (!profile) {
          errors.noprofile = 'There is no profile for this user';
          return res.status(404).json(errors);
        }
        Post.findById(post_id)
          .then(post => {
            // Check for post owner
            if (post.user.toString() === id) {
              return res.status(401).json({ notauthorized: 'User cannot unlike own post' });
            }
            if (post.likes.filter(like => like.user.toString() === id).length === 0) {
              return res.status(400).json({ notliked: 'You have not yet liked this post' });
            }
            // Get remove index
            const removeIndex = post.likes
              .map(item => item.user.toString())
              .indexOf(id);

            // Splice out of likes array
            post.likes.splice(removeIndex, 1);
            // Like
            post.save().then(post => res.json(post));
          })
          .catch(err =>
            res.status(404).json({ nopostfound: 'No post found with this id' })
          );
      });
  }
);

// @route     POST api/posts/comment/:post_id
// @desc      Add comment to post
// @access    Private
router.post(
  '/comment/:post_id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { errors, isValid } = validateCommentInput(req.body);
    if (!isValid) {
      return res.status(400).json(errors);
    }
    const { id, name, avatar } = req.user;
    const { post_id } = req.params;
    const { text } = req.body;

    Post.findById(post_id)
      .then(post => {
        const newComment = { text, name, avatar, user: id };

        // Add to comments array
        post.comments.unshift(newComment);

        // Save
        post.save().then(post => res.json(post));
      })
      .catch(err =>
        res.status(404).json({ nopostfound: 'No post found with this id' })
      );
  }
);

// @route     DELETE api/posts/comment/:post_id/:comment_id
// @desc      Delete comment to post
// @access    Private
router.delete(
  '/comment/:post_id/:comment_id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const errors = {};
    const { id, name, avatar } = req.user;
    const { post_id, comment_id } = req.params;

    Post.findById(post_id)
      .then(post => {
        // Get remove index
        const removeIndex = post.comments
          .map(item => item.id)
          .indexOf(comment_id);

        if (removeIndex === -1) {
          errors.nocomment = 'There is no comment with such id';
          return res.status(404).json(errors);
        }

        // Check for comment owner
        if (post.comments[removeIndex].user.toString() !== id) {
          return res.status(400).json({ notcommenter: 'You cannot delete others comments' });
        }

        // Splice out of likes array
        post.comments.splice(removeIndex, 1);
        // Like
        post.save().then(post => res.json(post));
      })
      .catch(err =>
        res.status(404).json({ nopostfound: 'No post found with this id' })
      );
  }
);


module.exports = router;
