// backend/routes/inventoryRoutes.js
import express from 'express';
import { getAllInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem } from '../controllers/inventoryController.js';

const isAdmin = (req, res, next) => { console.warn("Admin auth needed"); next(); };

export default (db) => {
    const router = express.Router();
    // Prefix all with /admin
    router.get('/admin/all', isAdmin, (req, res) => getAllInventory(req, res, db));
    router.post('/admin', isAdmin, (req, res) => createInventoryItem(req, res, db));
    router.put('/admin/:id', isAdmin, (req, res) => updateInventoryItem(req, res, db));
    router.delete('/admin/:id', isAdmin, (req, res) => deleteInventoryItem(req, res, db));
    return router;
};