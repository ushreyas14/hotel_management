// backend/routes/eventRoutes.js
import express from 'express';
import {
    getAllEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventById
} from '../controllers/eventController.js';

const isAdmin = (req, res, next) => { console.warn("Admin auth needed"); next(); };

export default (db) => {
    const router = express.Router();

    router.get('/admin/all', isAdmin, (req, res) => getAllEvents(req, res, db));
    router.post('/admin', isAdmin, (req, res) => createEvent(req, res, db));
    router.get('/admin/:id', isAdmin, (req, res) => getEventById(req, res, db)); // For fetching data for edit
    router.put('/admin/:id', isAdmin, (req, res) => updateEvent(req, res, db));
    router.delete('/admin/:id', isAdmin, (req, res) => deleteEvent(req, res, db));

    return router;
};