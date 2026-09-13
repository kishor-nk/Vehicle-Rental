const mysql = require("mysql2");

const isLocal = process.env.DB_HOST === "127.0.0.1" || process.env.DB_HOST === "localhost";

const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

if (!isLocal) {
    dbConfig.ssl = {
        rejectUnauthorized: true
    };
}

const db = mysql.createPool(dbConfig);

module.exports = db.promise();