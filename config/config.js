const mongoose = require('mongoose');
const db_url = process.env.DB_URL;


const DB_config = async () => {
    mongoose.connect(`${db_url}`).then(() => {
        console.log('Database Connected Successfully');
    }).catch((error) => {
        console.error('DB Error:', error);
    })

};

module.exports = DB_config;