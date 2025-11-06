const express = require('express');
const router = express.Router();

const statusRoutes = require('./status');
const authRoutes = require('./auth');
const userRoutes = require('./user'); // register


router.use('/status', statusRoutes);
router.use('/auth', authRoutes);
router.use('/user', userRoutes);

module.exports = router;