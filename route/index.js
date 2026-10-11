const express = require("express");
const router = express.Router();
const api = process.env.BASE_URL || '/api/v1';
const apiRoute = require('./api')

router.use(api,apiRoute)

router.use((req, res) => {
   res.send("no api found in this route");
});

module.exports = router