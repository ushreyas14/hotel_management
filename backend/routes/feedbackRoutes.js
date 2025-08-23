// backend/routes/feedbackRoutes.js
import express from 'express';
import {
    createFeedback,
    getAllFeedback
} from '../controllers/feedbackController.js';

// Placeholder for authentication middleware
const isClient = (req, res, next) => { /* TODO: Verify client token */ console.warn("Client auth needed"); next(); };
const isAdmin = (req, res, next) => { /* TODO: Verify admin token */ console.warn("Admin auth needed"); next(); };

export default (db) => {
    const router = express.Router();

    // --- Client Route ---
    // POST /api/feedback - Client submits feedback
    router.post('/', isClient, (req, res) => createFeedback(req, res, db));

    // --- Admin Route ---
    // GET /api/feedback/admin/all - Admin views all feedback
    router.get('/admin/all', isAdmin, (req, res) => getAllFeedback(req, res, db));

    return router;
};