const dns = require('node:dns');
const express = require('express');
const app  = express();
const cors = require('cors')

app.use(cors())
require ('dotenv').config();

dns.setServers(['8.8.8.8', '0.0.0.0'])
const port = process.env.PORT || 3000;

const DB_config = require('./config/config.js');
DB_config();

app.use(express.json());
const routes = require('./route')
app.use(routes)

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
})

