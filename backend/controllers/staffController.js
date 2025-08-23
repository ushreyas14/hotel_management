// backend/controllers/staffController.js
// Aligned with staff table: staff_id, first_name, last_name, role, email, phone, salary, shift, hired_date

export const getAllStaff = async (req, res, db) => {
    // Get potential filter query parameters from the request URL
    const { name, role, shift } = req.query; // Use specific filter names

    console.log("Fetching staff with filters:", req.query);

    try {
        // Base SQL query selecting all relevant columns from staff table
        let sql = `SELECT staff_id, first_name, last_name, role, email, phone, salary, shift, hired_date FROM staff`;
        const params = [];
        const whereClauses = [];

        // --- Build WHERE clauses dynamically ---
        if (name) {
            // Use LIKE to search within combined first and last names
            whereClauses.push(`(first_name LIKE ? OR last_name LIKE ?)`);
            params.push(`%${name}%`, `%${name}%`);
        }
        if (role) {
            // Assuming exact match for role dropdown
            whereClauses.push(`role = ?`);
            params.push(role);
        }
        if (shift) {
            // Assuming exact match for shift dropdown
            whereClauses.push(`shift = ?`);
            params.push(shift);
        }
        // Add more filters here if needed

        // Append WHERE clauses if any filters were provided
        if (whereClauses.length > 0) {
            sql += ` WHERE ${whereClauses.join(' AND ')}`;
        }
        sql += ` ORDER BY last_name, first_name`; // Order results

        console.log("Executing SQL:", db.format(sql, params)); // Log the final query
        const [staffMembers] = await db.query(sql, params); // Execute query
        res.status(200).json({ staff: staffMembers }); // Send results

    } catch (error) {
        console.error("Error fetching staff:", error);
        res.status(500).json({ message: "Server error fetching staff." });
    }
};

export const getStaffById = async (req, res, db) => {
    const { id } = req.params;
    if (!id || isNaN(id)) { return res.status(400).json({ message: "Valid Staff ID required." }); }
    try {
        const sql = `SELECT staff_id, first_name, last_name, role, email, salary, shift, hired_date FROM staff WHERE staff_id = ?`;
        const [staff] = await db.query(sql, [id]);
        if (staff.length === 0) { return res.status(404).json({ message: "Staff member not found." }); }
        res.status(200).json({ staff: staff[0] });
    } catch (error) {
        console.error(`Error fetching staff ${id}:`, error);
        res.status(500).json({ message: "Server error fetching staff details." });
    }
};

export const createStaff = async (req, res, db) => {
    const { first_name, last_name, role, email, phone, salary, shift, hired_date } = req.body;
    // Basic validation aligned with schema (assuming role, shift can be text for now)
    if (!first_name || !last_name || !role || !email || !phone || !hired_date) {
        return res.status(400).json({ message: "Required fields: first_name, last_name, role, email, phone, hired_date." });
    }
    // TODO: Add validation for email, phone, date formats, ENUMs/VARCHAR lengths if needed
    try {
        const [existing] = await db.query('SELECT staff_id FROM staff WHERE email = ? OR phone = ? LIMIT 1', [email, phone]);
        if (existing.length > 0) return res.status(409).json({ message: 'Email or Phone already exists for another staff member.' });

        const sql = `INSERT INTO staff (first_name, last_name, role, email, phone, salary, shift, hired_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await db.query(sql, [first_name, last_name, role, email, phone, salary || null, shift || null, hired_date]);
        res.status(201).json({ message: "Staff member created!", staffId: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') { return res.status(409).json({ message: 'Email or Phone already exists.' }); }
        console.error("Error creating staff:", error); res.status(500).json({ message: "Server error creating staff member." });
    }
};

export const updateStaff = async (req, res, db) => {
    const { id } = req.params;
    const { first_name, last_name, role, email, phone, salary, shift, hired_date } = req.body;
    if (!id || isNaN(id)) return res.status(400).json({ message: "Valid Staff ID required." });
    if (first_name === undefined && last_name === undefined && role === undefined && email === undefined && phone === undefined && salary === undefined && shift === undefined && hired_date === undefined) { return res.status(400).json({ message: "At least one field required." }); }
    // TODO: Add validation for provided fields
    try {
        const [existing] = await db.query('SELECT staff_id FROM staff WHERE staff_id = ?', [id]);
        if (existing.length === 0) return res.status(404).json({ message: 'Staff member not found.' });

        // Check for conflicts if email or phone are being updated
        if (email || phone) {
            const checkConflictSql = 'SELECT staff_id FROM staff WHERE (email = ? OR phone = ?) AND staff_id != ? LIMIT 1';
            const [conflicts] = await db.query(checkConflictSql, [email || null, phone || null, id]); // Pass null if not updating
            if (conflicts.length > 0) return res.status(409).json({ message: 'Updated Email or Phone already exists for another staff member.' });
        }

        let sql = 'UPDATE staff SET '; const params = []; const fields = [];
        if (first_name !== undefined) { fields.push('first_name = ?'); params.push(first_name); }
        if (last_name !== undefined) { fields.push('last_name = ?'); params.push(last_name); }
        if (role !== undefined) { fields.push('role = ?'); params.push(role); }
        if (email !== undefined) { fields.push('email = ?'); params.push(email); }
        if (phone !== undefined) { fields.push('phone = ?'); params.push(phone); }
        if (salary !== undefined) { fields.push('salary = ?'); params.push(salary); }
        if (shift !== undefined) { fields.push('shift = ?'); params.push(shift); }
        if (hired_date !== undefined) { fields.push('hired_date = ?'); params.push(hired_date); }
        if (fields.length === 0) return res.status(400).json({ message: "No valid fields to update." });
        sql += fields.join(', ') + ' WHERE staff_id = ?'; params.push(id);

        const [result] = await db.query(sql, params);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Staff not found or no changes made." });
        res.status(200).json({ message: `Staff member ${id} updated!` });
    } catch (error) { console.error(`Error updating staff ${id}:`, error); res.status(500).json({ message: "Server error updating staff." }); }
};

export const deleteStaff = async (req, res, db) => {
    const { id } = req.params;
    if (!id || isNaN(id)) return res.status(400).json({ message: "Valid Staff ID required." });
    try {
        const [existing] = await db.query('SELECT staff_id FROM staff WHERE staff_id = ?', [id]);
        if (existing.length === 0) return res.status(404).json({ message: 'Staff member not found.' });
        // Assumes ON DELETE CASCADE/SET NULL handles relationships
        const sql = 'DELETE FROM staff WHERE staff_id = ?';
        const [result] = await db.query(sql, [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Staff not found." });
        res.status(200).json({ message: `Staff member ${id} deleted.` });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') { return res.status(409).json({ message: 'Cannot delete staff: Referenced in other records (complaints, etc.). Update FK constraints or remove references.' }); }
        console.error(`Error deleting staff ${id}:`, error); res.status(500).json({ message: "Server error deleting staff." });
    }
};