// backend/routes/roomRoutes.js
import express from 'express';
import { getAllRooms, getAvailableRooms, getRoomById, createRoom, updateRoom, deleteRoom } from '../controllers/roomController.js';
const isAdmin = (req, res, next) => { console.warn("TODO: Implement ADMIN auth middleware!"); next(); }; // Placeholder
export default (db) => {
    const router = express.Router();
    // Public/Client
    router.get('/available', (req, res) => getAvailableRooms(req, res, db)); // Client might use this
    // Admin CRUD
    router.get('/admin/all', isAdmin, (req, res) => getAllRooms(req, res, db));
    router.get('/admin/:id', isAdmin, (req, res) => getRoomById(req, res, db));
    router.post('/admin', isAdmin, (req, res) => createRoom(req, res, db));
    router.put('/admin/:id', isAdmin, (req, res) => updateRoom(req, res, db));
    router.delete('/admin/:id', isAdmin, (req, res) => deleteRoom(req, res, db));
    return router;
};