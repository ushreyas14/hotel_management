
export const createBooking = async (req, res, db) => {
    const { guest_id, room_id, check_in, check_out } = req.body;

    if (!guest_id || !room_id || !check_in || !check_out) {
        return res.status(400).json({ message: 'Missing required fields: guest_id, room_id, check_in, check_out.' });
    }
    if (isNaN(guest_id) || isNaN(room_id)) {
         return res.status(400).json({ message: 'Guest ID and Room ID must be numbers.' });
    }
    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);
    if (isNaN(checkInDate) || isNaN(checkOutDate) || checkOutDate <= checkInDate) {
        return res.status(400).json({ message: 'Invalid dates: Check-out must be after check-in.' });
    }
    const checkInSQL = checkInDate.toISOString().slice(0, 10);
    const checkOutSQL = checkOutDate.toISOString().slice(0, 10);


    try {
        
        const availabilitySql = `
            SELECT booking_id FROM bookings
            WHERE room_id = ?
            AND status != 'Cancelled' -- Adjust if your status column/values differ or if it doesn't exist
            AND (
                (check_in < ? AND check_out > ?) OR -- Overlaps the entire period
                (check_in >= ? AND check_in < ?) OR -- Starts within the period
                (check_out > ? AND check_out <= ?)   -- Ends within the period
            )
            LIMIT 1
        `;
        const [conflictingBookings] = await db.query(availabilitySql, [
            room_id,
            checkOutSQL, checkInSQL, // Overlaps entire period
            checkInSQL, checkOutSQL, // Starts within
            checkInSQL, checkOutSQL  // Ends within
        ]);

        if (conflictingBookings.length > 0) {
            return res.status(409).json({ message: 'Room is not available for the selected dates.' }); // 409 Conflict
        }


        const insertSql = `
            INSERT INTO bookings (guest_id, room_id, booking_date, check_in, check_out, status)
            VALUES (?, ?, CURDATE(), ?, ?, 'Confirmed') -- Use CURDATE() for booking_date, default status 'Confirmed'
        `;
        const [result] = await db.query(insertSql, [guest_id, room_id, checkInSQL, checkOutSQL]);

        res.status(201).json({
            message: 'Booking created successfully!',
            bookingId: result.insertId
        });

    } catch (error) {
        console.error('Error creating booking:', error);
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
             return res.status(400).json({ message: 'Invalid Guest ID or Room ID provided.' });
        }
        res.status(500).json({ message: 'Server error creating booking.' });
    }
};

// --- Get Bookings for a Specific Guest (Client Dashboard) ---
export const getBookingsByGuest = async (req, res, db) => {
    const { guestId } = req.params;

    if (!guestId || isNaN(guestId)) {
        return res.status(400).json({ message: 'Valid Guest ID is required.' });
    }

    try {
        const sql = `
            SELECT
                b.booking_id, b.room_id, b.booking_date, b.check_in, b.check_out, b.status,
                r.room_type, r.price
            FROM bookings b
            JOIN rooms r ON b.room_id = r.room_id
            WHERE b.guest_id = ?
            ORDER BY b.check_in DESC;
        `;
        const [bookings] = await db.query(sql, [guestId]);
        res.status(200).json({ bookings });

    } catch (error) {
        console.error(`Error fetching bookings for guest ${guestId}:`, error);
        res.status(500).json({ message: 'Server error fetching booking history.' });
    }
};


export const getAllBookings = async (req, res, db) => {
    const { guest_name, room_type, status, date_from, date_to } = req.query;
    console.log("Fetching admin bookings with filters:", req.query);

    try {
        let sql = `
            SELECT
                b.booking_id, b.guest_id, b.room_id, b.booking_date, b.check_in, b.check_out, b.status,
                CONCAT(g.first_name, ' ', g.last_name) AS guest_name,
                r.room_type
            FROM bookings b
            LEFT JOIN guests g ON b.guest_id = g.guest_id
            LEFT JOIN rooms r ON b.room_id = r.room_id
        `;
        const params = [];
        const whereClauses = [];

        if (guest_name) { whereClauses.push(`CONCAT(g.first_name, ' ', g.last_name) LIKE ?`); params.push(`%${guest_name}%`); }
        if (room_type) { whereClauses.push(`r.room_type = ?`); params.push(room_type); }
        if (status) { const validStatuses = ['Confirmed', 'Cancelled', 'Checked-out']; if (validStatuses.includes(status)) { whereClauses.push(`b.status = ?`); params.push(status); } }
        if (date_from) { whereClauses.push(`b.check_in >= ?`); params.push(date_from); }
        if (date_to) { whereClauses.push(`b.check_in <= ?`); params.push(date_to); }

        if (whereClauses.length > 0) { sql += ` WHERE ${whereClauses.join(' AND ')}`; }
        sql += ` ORDER BY b.check_in DESC, b.booking_date DESC`;

        console.log("Executing SQL:", db.format(sql, params));
        const [bookings] = await db.query(sql, params);
        res.status(200).json({ bookings });

    } catch (error) {
        console.error('Error fetching all bookings (admin):', error);
        res.status(500).json({ message: 'Server error fetching bookings.' });
    }
};

export const updateBookingStatus = async (req, res, db) => {
    const { id } = req.params; // booking_id
    const { status } = req.body;

    if (!id || isNaN(id)) { return res.status(400).json({ message: 'Valid Booking ID required.' }); }
    const validStatuses = ['Confirmed', 'Cancelled', 'Checked-out']; // Match schema
    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ message: `Invalid status. Use: ${validStatuses.join(', ')}.` });
    }

    try {
        const [existing] = await db.query('SELECT booking_id FROM bookings WHERE booking_id = ?', [id]);
        if (existing.length === 0) { return res.status(404).json({ message: 'Booking not found.' }); }

        const updateSql = 'UPDATE bookings SET status = ? WHERE booking_id = ?';
        const [result] = await db.query(updateSql, [status, id]);

        if (result.affectedRows === 0) { return res.status(404).json({ message: 'Booking not found or status not changed.' }); }

        console.log(`Booking ${id} status updated to ${status}`);

        res.status(200).json({ message: `Booking ${id} status updated successfully!` });

    } catch (error) {
        console.error(`Error updating status for booking ${id}:`, error);
        res.status(500).json({ message: 'Server error updating booking status.' });
    }
};