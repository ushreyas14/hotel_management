// backend/config/db.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ MySQL Connected (Single Connection)');
        return connection;
    } catch (error) {
        // --- SIMPLIFIED ERROR LOGGING ---
        console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        console.error("!!! DATABASE CONNECTION FAILED IN db.js !!!");
        console.error("Error Details:", error); // Log the whole error object
        console.error("Error Message:", error.message); // Log just the message
        console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        // TEMPORARILY REMOVE process.exit(1) to see logs
        // process.exit(1);
        // Re-throw the error so the await in server.js catches it
        throw error; // IMPORTANT: Re-throw the error
    }
};