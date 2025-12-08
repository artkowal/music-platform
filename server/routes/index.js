const express = require('express');
const router = express.Router();

const statusRoutes = require('./status');
const authRoutes = require('./auth');
const userRoutes = require('./user');
const workplaceRoutes = require('./workplaces');
const courseRoutes = require('./courses');
const lessonRoutes = require('./lessons'); 
const commentsRoutes = require('./comments');
const meetingRoutes = require('./meetings');
const dashboardRoutes = require('./dashboard');
const financesRoutes = require('./finances');
const notificationRoutes = require('./notifications');

router.use('/status', statusRoutes);
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/workplaces', workplaceRoutes);
router.use('/courses', courseRoutes);
router.use('/lessons', lessonRoutes);
router.use('/comments', commentsRoutes);
router.use('/meetings', meetingRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/finances', financesRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;