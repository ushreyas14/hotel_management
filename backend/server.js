// backend/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';

// --- Import ALL route creators ---
import createAuthRoutes from './routes/authRoutes.js';
import createRoomRoutes from './routes/roomRoutes.js';
import createBookingRoutes from './routes/bookingRoutes.js';
import createServiceRoutes from './routes/serviceRoutes.js';
import createRoomServiceRoutes from './routes/roomServiceRoutes.js';
import createFeedbackRoutes from './routes/feedbackRoutes.js';
import createComplaintRoutes from './routes/complaintRoutes.js';
import createStaffRoutes from './routes/staffRoutes.js';
import createInventoryRoutes from './routes/inventoryRoutes.js';
import createHousekeepingRoutes from './routes/housekeepingRoutes.js';
import createEventRoutes from './routes/eventRoutes.js';


dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

(async () => {
    let db;
    try {
        console.log("Attempting database connection...");
        db = await connectDB();
        console.log("Database connection established for routing.");

        // --- Mount ALL Routers ---
        app.use('/api/auth', createAuthRoutes(db));
        app.use('/api/rooms', createRoomRoutes(db));
        app.use('/api/bookings', createBookingRoutes(db));
        app.use('/api/services', createServiceRoutes(db));
        app.use('/api/roomservice', createRoomServiceRoutes(db));
        app.use('/api/feedback', createFeedbackRoutes(db));
        app.use('/api/complaints', createComplaintRoutes(db));
        app.use('/api/staff', createStaffRoutes(db));
        app.use('/api/inventory', createInventoryRoutes(db));
        app.use('/api/housekeeping', createHousekeepingRoutes(db));
        app.use('/api/events', createEventRoutes(db));


        console.log("All API routes mounted.");

        app.get('/', (req, res) => {
            res.send('API is running... DB connection seems okay.');
        });

        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`✅ Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error("🚨 SERVER STARTUP FAILED:", error.message || error);
        console.error("Server will not start due to the error above.");
    }
})();

app.use((err, req, res, next) => {
    console.error("🚨 Global Request Error Handler:", err.stack || err);
    res.status(500).json({ message: err.message || 'An unexpected server error occurred during request.' });
});

