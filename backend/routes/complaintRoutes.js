// backend/routes/complaintRoutes.js
import express from 'express';
import {
    createComplaint,
    getAllComplaints,
    updateComplaintStatus
} from '../controllers/complaintController.js';

// Placeholder for authentication middleware
const isClient = (req, res, next) => { /* TODO: Verify client token */ console.warn("Client auth needed"); next(); };
const isAdmin = (req, res, next) => { /* TODO: Verify admin token */ console.warn("Admin auth needed"); next(); };

export default (db) => {
    const router = express.Router();

    // --- Client Route ---
    // POST /api/complaints - Client submits a complaint
    router.post('/', isClient, (req, res) => createComplaint(req, res, db));

    // --- Admin Routes ---
    // GET /api/complaints/admin/all - Admin views all complaints
    router.get('/admin/all', isAdmin, (req, res) => getAllComplaints(req, res, db));
    // PUT /api/complaints/admin/status/:id - Admin updates complaint status
    router.put('/admin/status/:id', isAdmin, (req, res) => updateComplaintStatus(req, res, db));

    return router;
};