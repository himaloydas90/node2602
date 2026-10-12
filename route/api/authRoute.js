const express = require("express");
const router = express.Router();
const upload = require('../../middalware/fileUploads');
const {registrationController,imageUpload} = require('../../controller/authController');
router.get('/login', (req, res) => {
    res.send('Login route');
});
router.post('/register',registrationController);

router.post('/image',upload.single('avatar'),imageUpload);

module.exports = router;