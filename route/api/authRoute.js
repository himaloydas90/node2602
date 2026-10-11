const express = require("express");
const router = express.Router();
const authController = require('../../controller/authController');

router.get('/login', (req, res) => {
    res.send('Login route');
});
router.post('/register', authController);

module.exports = router;