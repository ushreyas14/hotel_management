// backend/routes/serviceRoutes.js
import express from 'express';
import {
    getAllServices,
    createServiceRequest,
    getAllServiceRequests,
    updateServiceRequestStatus
} from '../controllers/serviceController.js';

// Placeholder for authentication middleware
const isClient = (req, res, next) => { /* TODO: Verify client token */ console.warn("Client auth needed"); next(); };
const isAdmin = (req, res, next) => { /* TODO: Verify admin token */ console.warn("Admin auth needed"); next(); };

export default (db) => {
    const router = express.Router();

    // --- Public/Client Routes ---
    // GET /api/services - Get list of available services
    router.get('/', (req, res) => getAllServices(req, res, db)); // Might be public or require client login
    // POST /api/services/request - Client requests a service
    router.post('/request', isClient, (req, res) => createServiceRequest(req, res, db));

    // --- Admin Routes ---
    // GET /api/services/admin/requests - Admin gets all service requests
    router.get('/admin/requests', isAdmin, (req, res) => getAllServiceRequests(req, res, db));
    // PUT /api/services/admin/requests/:id - Admin updates request status
    router.put('/admin/requests/:id', isAdmin, (req, res) => updateServiceRequestStatus(req, res, db));

    // Optional: Admin routes for managing services (CRUD for 'services' table)
    // router.post('/admin', isAdmin, (req, res) => createService(req, res, db)); // Need createService controller
    // router.put('/admin/:id', isAdmin, (req, res) => updateService(req, res, db)); // Need updateService controller
    // router.delete('/admin/:id', isAdmin, (req, res) => deleteService(req, res, db)); // Need deleteService controller


    return router;
};