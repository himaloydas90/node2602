const express = require("express");
const router = express.Router();
const testRoute = require('./test');
const authRoute = require('./authRoute');
const dashboardRoute = require('./dashboard');
router.use('/test', testRoute);
router.use('/auth', authRoute);
router.use('/dashboard', dashboardRoute);

module.exports = router;