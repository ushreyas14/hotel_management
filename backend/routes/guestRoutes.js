// backend/routes/guestRoutes.js
import express from 'express';
import { getAllGuestsAdmin } from '../controllers/guestController.js';

const isAdmin = (req, res, next) => { console.warn("Admin auth needed for guests"); next(); };

export default (db) => {
    const router = express.Router();
    // Endpoint for admin to get guest list for dropdowns etc.
    router.get('/admin/all', isAdmin, (req, res) => getAllGuestsAdmin(req, res, db));
    // Add other guest routes later if needed
    return router;
};