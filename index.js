const dns = require('node:dns');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const DB_config = require('./config/config.js');
const errorHandler = require('./middalware/errorHandler');

const app = express();

dns.setServers(['8.8.8.8', '1.1.1.1']);

const port = process.env.PORT || 3000;

DB_config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

const routes = require('./route');
app.use(routes);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
