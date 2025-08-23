// backend/routes/statsRoutes.js
import express from 'express';
import { getDashboardStats } from '../controllers/statsController.js';

// Placeholder for admin authentication middleware
const isAdmin = (req, res, next) => {
    console.warn("TODO: Implement actual admin authentication in statsRoutes!");
    // Verify admin token/session here
    next();
};

export default (db) => {
    const router = express.Router();

    // GET /api/stats/admin/dashboard - Fetch all stats for admin dashboard
    router.get('/admin/dashboard', isAdmin, (req, res) => getDashboardStats(req, res, db));

    return router;
};