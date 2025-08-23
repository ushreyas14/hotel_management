// backend/routes/authRoutes.js
import express from 'express';
import { registerClient, loginClient, loginAdmin } from '../controllers/authController.js';

export default (db) => {
    const router = express.Router();
    // Client
    router.post('/client/register', (req, res) => registerClient(req, res, db));
    router.post('/client/login', (req, res) => loginClient(req, res, db));
    // Admin
    router.post('/admin/login', (req, res) => loginAdmin(req, res, db));
    return router;
};