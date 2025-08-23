// backend/routes/staffRoutes.js
// NO CHANGES NEEDED HERE - Already correct

import express from 'express';
import {
    getAllStaff,
    createStaff,
    updateStaff,
    deleteStaff,
    getStaffById
} from '../controllers/staffController.js';

const isAdmin = (req, res, next) => {
    console.warn("TODO: Implement actual admin authentication in staffRoutes!");
    next();
};

export default (db) => {
    const router = express.Router();

    // This route handles both fetching all staff AND fetching filtered staff via query params
    router.get('/admin/all', isAdmin, (req, res) => getAllStaff(req, res, db));

    router.post('/admin', isAdmin, (req, res) => createStaff(req, res, db));
    router.get('/admin/:id', isAdmin, (req, res) => getStaffById(req, res, db)); // For Edit
    router.put('/admin/:id', isAdmin, (req, res) => updateStaff(req, res, db));
    router.delete('/admin/:id', isAdmin, (req, res) => deleteStaff(req, res, db));

    return router;
};