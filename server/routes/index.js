const express = require('express');
const router = express.Router();

const statusRoutes = require('./status');
const authRoutes = require('./auth');
const userRoutes = require('./user'); // register
const workplaceRoutes = require('./workplaces');
const courseRoutes = require('./courses');
const lessonRoutes = require('./lessons');
const commentsRoutes = require('./comments')


router.use('/status', statusRoutes);
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/workplaces', workplaceRoutes);
router.use('/courses', courseRoutes);
router.use('/lessons', lessonRoutes);
router.use('/comments', commentsRoutes);

module.exports = router;