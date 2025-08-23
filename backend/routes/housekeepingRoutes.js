// backend/routes/housekeepingRoutes.js
import express from 'express';
import { getAllTasks, createTask, updateTaskStatus, deleteTask } from '../controllers/housekeepingController.js';

const isAdmin = (req, res, next) => { console.warn("Admin auth needed"); next(); };

export default (db) => {
    const router = express.Router();
     // Prefix all with /admin
    router.get('/admin/tasks', isAdmin, (req, res) => getAllTasks(req, res, db));
    router.post('/admin/tasks', isAdmin, (req, res) => createTask(req, res, db));
    router.put('/admin/tasks/:id', isAdmin, (req, res) => updateTaskStatus(req, res, db));
    router.delete('/admin/tasks/:id', isAdmin, (req, res) => deleteTask(req, res, db));
    return router;
};