const express = require("express");
const router = express.Router();
const upload = require('../../middalware/fileUploads');
const {authController,imageUpload} = require('../../controller/authController');
router.get('/login', (req, res) => {
    res.send('Login route');
});
router.post('/register',authController);

router.post('/image',upload.single('avatar'),imageUpload);

module.exports = router;