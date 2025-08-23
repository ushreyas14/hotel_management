

export const createComplaint = async (req, res, db) => {
    const { guest_id, staff_info, complaint_text } = req.body;
    let staff_id_to_insert = null; 

    console.log("--- createComplaint ---");
    console.log("Received Body:", JSON.stringify(req.body, null, 2)); // Log incoming data


    if (!guest_id || isNaN(guest_id)) {
         console.error("Validation Failed: Missing or invalid guest_id");
         return res.status(400).json({ message: 'Missing or invalid required field: guest_id.' });
     }
    if (!complaint_text || typeof complaint_text !== 'string' || complaint_text.trim().length === 0) {
         console.error("Validation Failed: Missing or empty complaint_text");
         return res.status(400).json({ message: 'Missing required field: complaint_text.' });
     }

    try {
        console.log(`Verifying guest ID: ${guest_id}`);
        const [guestCheck] = await db.query('SELECT guest_id FROM guests WHERE guest_id = ?', [guest_id]);
        if (guestCheck.length === 0) {
             console.error(`Guest ID ${guest_id} not found.`);
             return res.status(404).json({ message: 'Associated guest account not found.' });
         }
         console.log(`Guest ID ${guest_id} verified.`);

        if (staff_info && typeof staff_info === 'string' && staff_info.trim().length > 0) {
            const trimmedStaffInfo = staff_info.trim();
            console.warn(`Attempting to find staff based on info: "${trimmedStaffInfo}" - Requires robust matching logic.`);
            try {
                let staffResult = [];
                if (!isNaN(trimmedStaffInfo)) {
                    const findByIdSql = "SELECT staff_id FROM staff WHERE staff_id = ? LIMIT 1";
                     [staffResult] = await db.query(findByIdSql, [parseInt(trimmedStaffInfo)]);
                }
                 if (staffResult.length === 0) {
                     const findByNameSql = "SELECT staff_id FROM staff WHERE CONCAT(first_name, ' ', last_name) LIKE ? LIMIT 1";
                     [staffResult] = await db.query(findByNameSql, [`%${trimmedStaffInfo}%`]); // Use LIKE for partial match
                 }

                if (staffResult.length > 0) {
                    staff_id_to_insert = staffResult[0].staff_id;
                    console.log(`Found potential staff ID: ${staff_id_to_insert} for info "${trimmedStaffInfo}"`);
                } else {
                     console.warn(`Could not find staff matching info: "${trimmedStaffInfo}". Proceeding without staff_id.`);
                 }
            } catch (staffLookupError) {
                console.error("Error during optional staff lookup:", staffLookupError);

            }
        }
        const insertSql = `
            INSERT INTO complaints (guest_id, staff_id, complaint_text, complaint_date, status)
            VALUES (?, ?, ?, CURDATE(), 'Pending')
        `;
        console.log("Executing Insert SQL:", db.format(insertSql, [guest_id, staff_id_to_insert, complaint_text])); // Log the query

        const [result] = await db.query(insertSql, [
            guest_id,
            staff_id_to_insert,
            complaint_text
        ]);

        console.log("Insert Result:", result);

        res.status(201).json({
            message: 'Complaint submitted successfully. We will review it shortly.',
            complaintId: result.insertId
        });

    } catch (error) { // Catch block for the main try
        console.error('Error submitting complaint:', error); 
         if (error.code === 'ER_NO_REFERENCED_ROW_2') {
             return res.status(400).json({ message: 'Invalid Guest ID provided.' });
        }
         if (error.code === 'ER_BAD_NULL_ERROR' && error.sqlMessage && error.sqlMessage.includes("'staff_id'")) {
             console.error("Database schema error: 'staff_id' column in 'complaints' table likely does not allow NULL values.");
             return res.status(500).json({ message: 'Server configuration error submitting complaint.' });
         }
        res.status(500).json({ message: 'Server error submitting complaint.' });
    }
};

export const getAllComplaints = async (req, res, db) => {
    const { guest_name, staff_name, status, date_from, date_to } = req.query;

    console.log("Fetching admin complaints with filters:", req.query);

    try {
        let sql = `
            SELECT
                c.complaint_id, c.complaint_text, c.complaint_date, c.status,
                g.guest_id, CONCAT(g.first_name, ' ', g.last_name) AS guest_name,
                s.staff_id, CONCAT(s.first_name, ' ', s.last_name) AS staff_name
            FROM complaints c
            LEFT JOIN guests g ON c.guest_id = g.guest_id -- Use LEFT JOIN in case guest deleted
            LEFT JOIN staff s ON c.staff_id = s.staff_id -- Use LEFT JOIN as staff_id can be NULL
        `;
        const params = [];
        const whereClauses = [];

        if (guest_name) {
            whereClauses.push(`CONCAT(g.first_name, ' ', g.last_name) LIKE ?`);
            params.push(`%${guest_name}%`);
        }
        if (staff_name) {
            whereClauses.push(`CONCAT(s.first_name, ' ', s.last_name) LIKE ?`);
            params.push(`%${staff_name}%`);
        }
        if (status) {
            const validStatuses = ['Pending', 'Resolved', 'Unresolved']; // Match schema
            if (validStatuses.includes(status)) {
                whereClauses.push(`c.status = ?`);
                params.push(status);
            } else {
                 console.warn(`Invalid status filter ignored: ${status}`);
            }
        }
        if (date_from) {
            whereClauses.push(`c.complaint_date >= ?`);
            params.push(date_from);
        }
        if (date_to) {
            whereClauses.push(`c.complaint_date <= ?`);
            params.push(date_to);
        }

        if (whereClauses.length > 0) {
            sql += ` WHERE ${whereClauses.join(' AND ')}`;
        }

        sql += ` ORDER BY c.complaint_date DESC`;

        console.log("Executing SQL:", db.format(sql, params));

        const [complaints] = await db.query(sql, params);
        res.status(200).json({ complaints });

    } catch (error) {
        console.error('Error fetching complaints:', error);
        res.status(500).json({ message: 'Server error fetching complaints.' });
    }
};

export const updateComplaintStatus = async (req, res, db) => {
    const { id } = req.params; // complaint_id
    const { status } = req.body;

    if (!id || isNaN(id)) { return res.status(400).json({ message: 'Valid Complaint ID required.' }); }
    const validStatuses = ['Pending', 'Resolved', 'Unresolved']; // Match schema
    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}.` });
    }

    try {
        const [existing] = await db.query('SELECT complaint_id FROM complaints WHERE complaint_id = ?', [id]);
        if (existing.length === 0) { return res.status(404).json({ message: 'Complaint not found.' }); }

        const updateSql = 'UPDATE complaints SET status = ? WHERE complaint_id = ?';
        const [result] = await db.query(updateSql, [status, id]);

        if (result.affectedRows === 0) { return res.status(404).json({ message: 'Complaint not found or status not changed.' }); }

        res.status(200).json({ message: `Complaint ${id} status updated successfully!` });

    } catch (error) {
        console.error(`Error updating status for complaint ${id}:`, error);
        res.status(500).json({ message: 'Server error updating complaint status.' });
    }
};