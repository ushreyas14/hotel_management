// backend/routes/roomServiceRoutes.js
import express from 'express';
import {
    createRoomServiceOrder,
    getAllRoomServiceOrders,
    updateRoomServiceOrderStatus
} from '../controllers/roomServiceController.js';

// Placeholder for authentication middleware
const isClient = (req, res, next) => { /* TODO: Verify client token */ console.warn("Client auth needed"); next(); };
const isAdmin = (req, res, next) => { /* TODO: Verify admin token */ console.warn("Admin auth needed"); next(); };

export default (db) => {
    const router = express.Router();

    // --- Client Route ---
    // POST /api/roomservice/orders - Client places an order
    router.post('/orders', isClient, (req, res) => createRoomServiceOrder(req, res, db));

    // --- Admin Routes ---
    // GET /api/roomservice/admin/orders - Admin views all orders
    router.get('/admin/orders', isAdmin, (req, res) => getAllRoomServiceOrders(req, res, db));
    // PUT /api/roomservice/admin/orders/:id - Admin updates order status
    router.put('/admin/orders/:id', isAdmin, (req, res) => updateRoomServiceOrderStatus(req, res, db));

    return router;
};