
export const getAllEvents = async (req, res, db) => {
    const { event_type, date_from, date_to } = req.query;

    console.log("Fetching admin events with filters:", req.query);

    try {

        let sql = `
            SELECT eb.event_id, eb.event_type, eb.event_date, eb.details,
                   g.guest_id, CONCAT(g.first_name, ' ', g.last_name) as guest_name,
                   s.staff_id, CONCAT(s.first_name, ' ', s.last_name) as staff_name
            FROM eventbookings eb
            LEFT JOIN guests g ON eb.guest_id = g.guest_id
            LEFT JOIN staff s ON eb.staff_id = s.staff_id
        `;
        const params = [];
        const whereClauses = [];

        if (event_type) {
            whereClauses.push(`eb.event_type = ?`);
            params.push(event_type);
        }
        if (date_from) {
            whereClauses.push(`eb.event_date >= ?`);
            params.push(date_from);
        }
        if (date_to) {
            whereClauses.push(`eb.event_date <= ?`);
            params.push(date_to);
        }

        if (whereClauses.length > 0) {
            sql += ` WHERE ${whereClauses.join(' AND ')}`;
        }

        sql += ` ORDER BY eb.event_date DESC`;

        console.log("Executing SQL:", db.format(sql, params));

        const [events] = await db.query(sql, params);
        res.status(200).json({ events: events });

    } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({ message: "Server error fetching events." });
    }
};

export const createEvent = async (req, res, db) => {
    const { event_type, event_date } = req.body;

    console.log("--- createEvent (Simplified) ---");
    console.log("Received Body:", JSON.stringify(req.body, null, 2));

    if (!event_type || !event_date) {
        console.error("Validation Failed: Missing event_type or event_date");
        return res.status(400).json({ message: "Event type and date are required." });
    }

    try {
        const insertSql = `
            INSERT INTO eventbookings (event_type, event_date)
            VALUES (?, ?)
        `;
        const params = [ event_type, event_date ];

        console.log("Executing Insert SQL:", db.format(insertSql, params));
        const [result] = await db.query(insertSql, params);
        console.log("Insert Result:", result);

        res.status(201).json({
            message: "Event created successfully!",
            eventId: result.insertId
        });

    } catch (error) {
        console.error('Error creating event booking:', error);
         res.status(500).json({ message: "Server error creating event booking." });
    }
};

 export const updateEvent = async (req, res, db) => {
     const { id } = req.params;
     const { event_type, event_date } = req.body;

      if (!id || isNaN(id)) return res.status(400).json({ message: "Valid Event ID required." });
      if (event_type === undefined && event_date === undefined) {
         return res.status(400).json({ message: "At least one field (event_type, event_date) must be provided for update." });
     }

     try {
         const [existing] = await db.query('SELECT event_id FROM eventbookings WHERE event_id = ?', [id]);
         if (existing.length === 0) return res.status(404).json({ message: 'Event booking not found.' });

         let sql = 'UPDATE eventbookings SET ';
         const params = [];
         const fields = [];
         if (event_type !== undefined) { fields.push('event_type = ?'); params.push(event_type); }
         if (event_date !== undefined) { fields.push('event_date = ?'); params.push(event_date); }

         if (fields.length === 0) return res.status(400).json({ message: "No valid fields to update." });

         sql += fields.join(', ');
         sql += ' WHERE event_id = ?';
         params.push(id);

         console.log("Executing Update SQL:", db.format(sql, params));
         const [result] = await db.query(sql, params);
         if (result.affectedRows === 0) return res.status(404).json({ message: "Event not found or no changes made." });
         res.status(200).json({ message: `Event booking ${id} updated successfully!` });
     } catch (error) {
         console.error(`Error updating event ${id}:`, error);
         res.status(500).json({ message: "Server error updating event booking." });
     }
 };

export const getEventById = async (req, res, db) => {
    const { id } = req.params;
    if (!id || isNaN(id)) { return res.status(400).json({ message: 'Valid Event ID is required.' }); }
    try {
        // Fetch only the fields needed for the simplified edit modal
        const sql = `SELECT event_id, event_type, event_date FROM eventbookings WHERE event_id = ?`;
        const [events] = await db.query(sql, [id]);
        if (events.length === 0) { return res.status(404).json({ message: 'Event booking not found.' }); }
        res.status(200).json({ event: events[0] });
    } catch (error) { console.error(`Error fetching event ${id}:`, error); res.status(500).json({ message: 'Server error fetching event details.' }); }
};


export const deleteEvent = async (req, res, db) => {
     const { id } = req.params;
     if (!id || isNaN(id)) return res.status(400).json({ message: "Valid Event ID required." });
     try {
         const [existing] = await db.query('SELECT event_id FROM eventbookings WHERE event_id = ?', [id]);
         if (existing.length === 0) return res.status(404).json({ message: 'Event booking not found.' });
         const sql = 'DELETE FROM eventbookings WHERE event_id = ?';
         const [result] = await db.query(sql, [id]);
         if (result.affectedRows === 0) return res.status(404).json({ message: "Event booking not found." });
         res.status(200).json({ message: `Event booking ${id} deleted successfully.` });
     } catch (error) { console.error(`Error deleting event booking ${id}:`, error); res.status(500).json({ message: "Server error deleting event booking." }); }
 };