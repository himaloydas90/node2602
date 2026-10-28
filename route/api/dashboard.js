const express = require('express');
const router = express.Router();
const { protect, requiedAdmin } = require('../../middalware/authMiddleware');
const { getAllUserController } = require('../../controller/dashbordController');

router.get('/admin', protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin dashboard',
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
    },
  });
});
router.get('/getAllUser',protect,requiedAdmin,getAllUserController);


module.exports = router;
