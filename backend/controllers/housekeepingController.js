

export const getAllTasks = async (req, res, db) => {
    const { room_id, staff_name, status, date_from, date_to } = req.query;

    console.log("Fetching housekeeping tasks with filters:", req.query);

    try {
        let sql = `
            SELECT hk.task_id, hk.task_date, hk.status, hk.task_description,
                   r.room_id, r.room_type,
                   s.staff_id, CONCAT(s.first_name, ' ', s.last_name) as staff_name
            FROM housekeeping hk
            LEFT JOIN rooms r ON hk.room_id = r.room_id
            LEFT JOIN staff s ON hk.staff_id = s.staff_id
        `; 
        const params = [];
        const whereClauses = [];

        if (room_id && !isNaN(room_id)) {
            whereClauses.push(`hk.room_id = ?`);
            params.push(parseInt(room_id));
        }
        if (staff_name) {
            whereClauses.push(`CONCAT(s.first_name, ' ', s.last_name) LIKE ?`);
            params.push(`%${staff_name}%`);
        }
        if (status) {
            const validStatuses = ['Pending', 'Done']; 
            if (validStatuses.includes(status)) {
                whereClauses.push(`hk.status = ?`);
                params.push(status);
            } else {
                 console.warn(`Invalid status filter ignored: ${status}`);
            }
        }
        if (date_from) {
            whereClauses.push(`hk.task_date >= ?`);
            params.push(date_from);
        }
        if (date_to) {
            whereClauses.push(`hk.task_date <= ?`);
            params.push(date_to);
        }

        if (whereClauses.length > 0) {
            sql += ` WHERE ${whereClauses.join(' AND ')}`;
        }

        sql += ` ORDER BY hk.task_date DESC, hk.status ASC`;

        console.log("Executing SQL:", db.format(sql, params));

        const [tasks] = await db.query(sql, params);
        res.status(200).json({ housekeepingTasks: tasks });

    } catch (error) {
        console.error("Error fetching housekeeping tasks:", error);
        res.status(500).json({ message: "Server error fetching tasks." });
    }
};
export const createTask = async (req, res, db) => {
    const { staff_id, room_id, task_description, status, task_date } = req.body;
    if (!staff_id || !room_id || !task_description || isNaN(staff_id) || isNaN(room_id)) { return res.status(400).json({ message: "Valid staff_id, room_id, and task_description required." }); }
    const validStatuses = ['Pending', 'Done']; // Matches schema example
    const taskStatus = status && validStatuses.includes(status) ? status : 'Pending';
    const taskDateToUse = task_date || new Date().toISOString().slice(0, 10);
    try {
         const [staffCheck] = await db.query('SELECT staff_id FROM staff WHERE staff_id = ?', [staff_id]); if(staffCheck.length === 0) return res.status(404).json({ message: 'Staff not found.' });
         const [roomCheck] = await db.query('SELECT room_id FROM rooms WHERE room_id = ?', [room_id]); if(roomCheck.length === 0) return res.status(404).json({ message: 'Room not found.' });
        // Using schema columns
        const sql = `INSERT INTO housekeeping (staff_id, room_id, task_description, task_date, status) VALUES (?, ?, ?, ?, ?)`;
        const [result] = await db.query(sql, [staff_id, room_id, task_description, taskDateToUse, taskStatus]);
        res.status(201).json({ message: "Housekeeping task created!", taskId: result.insertId });
    } catch (error) {
        console.error("Error creating task:", error);
        if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ message: 'Invalid Staff/Room ID.' });
        res.status(500).json({ message: "Server error creating task." });
    }
};

export const updateTaskStatus = async (req, res, db) => {
    const { id } = req.params; // task_id
    // Allow updating more than just status
    const { status, staff_id, room_id, task_description, task_date } = req.body;

    if (!id || isNaN(id)) return res.status(400).json({ message: "Valid Task ID required." });
     if (status === undefined && staff_id === undefined && room_id === undefined && task_description === undefined && task_date === undefined) {
        return res.status(400).json({ message: "At least one field required for update."});
    }
    const validStatuses = ['Pending', 'Done'];
    if (status && !validStatuses.includes(status)) { return res.status(400).json({ message: `Invalid status. Use: ${validStatuses.join(', ')}.` }); }

    try {
         const [existing] = await db.query('SELECT task_id FROM housekeeping WHERE task_id = ?', [id]);
         if (existing.length === 0) return res.status(404).json({ message: 'Task not found.' });

         let sql = 'UPDATE housekeeping SET '; const params = []; const fields = [];
         if (status !== undefined) { fields.push('status = ?'); params.push(status); }
         if (staff_id !== undefined) { fields.push('staff_id = ?'); params.push(staff_id); } // Verify staff exists if changing
         if (room_id !== undefined) { fields.push('room_id = ?'); params.push(room_id); } // Verify room exists if changing
         if (task_description !== undefined) { fields.push('task_description = ?'); params.push(task_description); }
         if (task_date !== undefined) { fields.push('task_date = ?'); params.push(task_date); }
         if (fields.length === 0) return res.status(400).json({ message: "No valid fields to update." });
         sql += fields.join(', ') + ' WHERE task_id = ?'; params.push(id);

        const [result] = await db.query(sql, params);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Task not found or no changes made." });
        res.status(200).json({ message: `Housekeeping task ${id} updated!` });
    } catch (error) {
        console.error(`Error updating task ${id}:`, error);
        if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ message: 'Invalid Staff/Room ID.' });
        res.status(500).json({ message: "Server error updating task." });
    }
};

 export const deleteTask = async (req, res, db) => {
     const { id } = req.params;
     if (!id || isNaN(id)) return res.status(400).json({ message: "Valid Task ID required." });
     try {
         const [existing] = await db.query('SELECT task_id FROM housekeeping WHERE task_id = ?', [id]);
         if (existing.length === 0) return res.status(404).json({ message: 'Task not found.' });
         const sql = 'DELETE FROM housekeeping WHERE task_id = ?';
         const [result] = await db.query(sql, [id]);
         if (result.affectedRows === 0) return res.status(404).json({ message: "Task not found." });
         res.status(200).json({ message: `Housekeeping task ${id} deleted.` });
     } catch (error) { console.error(`Error deleting task ${id}:`, error); res.status(500).json({ message: "Server error deleting task." }); }
 };