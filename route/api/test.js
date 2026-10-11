const express = require("express");
const router = express.Router();
router.get('/tasting', (req, res) => {
    res.send('Test route');
});

module.exports = router;