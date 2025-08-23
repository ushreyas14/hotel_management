// backend/routes/bookingRoutes.js
import express from 'express';
import {
    createBooking,
    getBookingsByGuest,
    getAllBookings,
    updateBookingStatus
} from '../controllers/bookingController.js';

// Placeholder for authentication middleware
const isClient = (req, res, next) => { /* TODO: Verify client token */ console.warn("Client auth needed"); next(); };
const isAdmin = (req, res, next) => { /* TODO: Verify admin token */ console.warn("Admin auth needed"); next(); };

export default (db) => {
    const router = express.Router();

    // --- Client Routes ---
    // POST /api/bookings/client - Create a booking
    router.post('/client', isClient, (req, res) => createBooking(req, res, db));
    // GET /api/bookings/client/my/:guestId - Get bookings for logged-in client
    router.get('/client/my/:guestId', isClient, (req, res) => getBookingsByGuest(req, res, db));

    // --- Admin Routes ---
    // GET /api/bookings/admin/all - Get all bookings
    router.get('/admin/all', isAdmin, (req, res) => getAllBookings(req, res, db));
    // PUT /api/bookings/admin/status/:id - Update booking status
    router.put('/admin/status/:id', isAdmin, (req, res) => updateBookingStatus(req, res, db));

    return router;
};
