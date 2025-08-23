// backend/controllers/roomController.js
// CORRECTED: Removed duplicate function definitions

// --- Get All Rooms (Admin View - WITH FILTERING) ---
export const getAllRooms = async (req, res, db) => {
    const { room_id, room_type, min_price, max_price, available, capacity, description } = req.query;
    console.log("Fetching admin rooms with filters:", req.query);
    try {
        let sql = `SELECT room_id, room_type, description, available, price, capacity FROM rooms`;
        const params = [];
        const whereClauses = [];
        if (room_id && !isNaN(room_id)) { whereClauses.push(`room_id = ?`); params.push(parseInt(room_id)); }
        if (room_type) { whereClauses.push(`room_type = ?`); params.push(room_type); }
        if (min_price && !isNaN(min_price)) { whereClauses.push(`price >= ?`); params.push(parseFloat(min_price)); }
        if (max_price && !isNaN(max_price)) { whereClauses.push(`price <= ?`); params.push(parseFloat(max_price)); }
        if (available !== undefined && available !== '') { const availableStatus = Number(available) === 0 ? 0 : 1; whereClauses.push(`available = ?`); params.push(availableStatus); }
        if (capacity && !isNaN(capacity)) { whereClauses.push(`capacity = ?`); params.push(parseInt(capacity)); }
        if (description) { whereClauses.push(`description LIKE ?`); params.push(`%${description}%`); }
        if (whereClauses.length > 0) { sql += ` WHERE ${whereClauses.join(' AND ')}`; }
        sql += ` ORDER BY room_id ASC`;
        console.log("Executing SQL:", db.format(sql, params));
        const [rooms] = await db.query(sql, params);
        const formattedRooms = rooms.map(room => ({ ...room, available: !!room.available }));
        res.status(200).json({ rooms: formattedRooms });
    } catch (error) { console.error('Error fetching all rooms (admin):', error); res.status(500).json({ message: 'Server error fetching rooms.' }); }
};

// --- Get Available Rooms (for Client booking dropdown, potentially) ---
// This function remains separate as it serves a different purpose
export const getAvailableRooms = async (req, res, db) => {
     try {
         const sql = `SELECT room_id, room_type, description, price, capacity FROM rooms WHERE available = 1 ORDER BY room_type, price ASC`;
         const [rooms] = await db.query(sql);
         res.status(200).json({ rooms });
     } catch (error) { console.error('Error fetching available rooms:', error); res.status(500).json({ message: 'Server error fetching available rooms.' }); }
 };

// --- Get Single Room by ID (Admin edit form) ---
export const getRoomById = async (req, res, db) => {
    const { id } = req.params;
    if (!id || isNaN(id)) { return res.status(400).json({ message: 'Valid Room ID is required.' }); }
    try {
        const sql = `SELECT room_id, room_type, description, available, price, capacity FROM rooms WHERE room_id = ?`;
        const [rooms] = await db.query(sql, [id]);
        if (rooms.length === 0) { return res.status(404).json({ message: 'Room not found.' }); }
        const formattedRoom = { ...rooms[0], available: !!rooms[0].available };
        res.status(200).json({ room: formattedRoom });
    } catch (error) { console.error(`Error fetching room ${id}:`, error); res.status(500).json({ message: 'Server error fetching room details.' }); }
};

// --- Create New Room (Admin add form) ---
export const createRoom = async (req, res, db) => {
    const { room_type, description, available, price, capacity } = req.body;
    if (room_type === undefined || price === undefined || available === undefined || capacity === undefined) { return res.status(400).json({ message: 'Room type, price, available status (0 or 1), and capacity are required.' }); }
    const priceNum = parseFloat(price); if (isNaN(priceNum) || priceNum < 0) { return res.status(400).json({ message: 'Price must be a valid non-negative number.' }); }
    const capacityNum = parseInt(capacity, 10); if (isNaN(capacityNum) || capacityNum <= 0) { return res.status(400).json({ message: 'Capacity must be a valid positive integer.' }); }
    const availableNum = parseInt(available); if (availableNum !== 0 && availableNum !== 1) { return res.status(400).json({ message: 'Available status must be 0 or 1.' }); }
    const availableStatus = availableNum;
    try {
        const insertSql = `INSERT INTO rooms (room_type, description, available, price, capacity) VALUES (?, ?, ?, ?, ?)`;
        const [result] = await db.query(insertSql, [room_type, description || null, availableStatus, priceNum, capacityNum]);
        res.status(201).json({ message: 'Room created successfully!', roomId: result.insertId });
    } catch (error) { console.error('Error creating room:', error); res.status(500).json({ message: 'Server error creating room.' }); }
};

// --- Update Existing Room (Admin edit form save) ---
export const updateRoom = async (req, res, db) => {
    const { id } = req.params;
    const { room_type, description, available, price, capacity } = req.body;
    if (!id || isNaN(id)) { return res.status(400).json({ message: 'Valid Room ID is required for update.' }); }
    if (room_type === undefined && description === undefined && available === undefined && price === undefined && capacity === undefined) { return res.status(400).json({ message: 'At least one field must be provided for update.' }); }
    let availableStatus; let priceNum; let capacityNum;
    if (available !== undefined) { const aNum = parseInt(available); if (aNum !== 0 && aNum !== 1) return res.status(400).json({ message: 'Available must be 0 or 1.' }); availableStatus = aNum; }
    if (price !== undefined) { priceNum = parseFloat(price); if (isNaN(priceNum) || priceNum < 0) return res.status(400).json({ message: 'Price must be non-negative.' }); }
    if (capacity !== undefined) { capacityNum = parseInt(capacity, 10); if (isNaN(capacityNum) || capacityNum <= 0) return res.status(400).json({ message: 'Capacity must be positive.' }); }
    try {
        const [existing] = await db.query('SELECT room_id FROM rooms WHERE room_id = ?', [id]); if (existing.length === 0) { return res.status(404).json({ message: 'Room not found.' }); }
        let sql = 'UPDATE rooms SET '; const params = []; const fields = [];
        if (room_type !== undefined) { fields.push('room_type = ?'); params.push(room_type); }
        if (description !== undefined) { fields.push('description = ?'); params.push(description || null); }
        if (availableStatus !== undefined) { fields.push('available = ?'); params.push(availableStatus); }
        if (priceNum !== undefined) { fields.push('price = ?'); params.push(priceNum); }
        if (capacityNum !== undefined) { fields.push('capacity = ?'); params.push(capacityNum); }
        if (fields.length === 0) return res.status(400).json({ message: "No valid fields to update." });
        sql += fields.join(', ') + ' WHERE room_id = ?'; params.push(id);
        const [result] = await db.query(sql, params);
        if (result.affectedRows === 0 && result.changedRows === 0) { return res.status(404).json({ message: "Room not found or no changes made." }); }
        res.status(200).json({ message: `Room ${id} updated successfully!` });
    } catch (error) { console.error(`Error updating room ${id}:`, error); res.status(500).json({ message: 'Server error updating room.' }); }
};

// --- Delete Room (Admin delete button) ---
export const deleteRoom = async (req, res, db) => {
    const { id } = req.params;
    if (!id || isNaN(id)) { return res.status(400).json({ message: 'Valid Room ID is required.' }); }
    let connection = db;
    try {
        const [existing] = await connection.query('SELECT room_id FROM rooms WHERE room_id = ?', [id]);
        if (existing.length === 0) { return res.status(404).json({ message: 'Room not found.' }); }
        const deleteSql = 'DELETE FROM rooms WHERE room_id = ?';
        const [result] = await connection.query(deleteSql, [id]);
        if (result.affectedRows === 0) { return res.status(404).json({ message: "Delete failed unexpectedly." }); }
        res.status(200).json({ message: `Room ${id} deleted successfully.` });
    } catch (error) {
        console.error(`Error deleting room ${id}:`, error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') { return res.status(409).json({ message: 'Cannot delete room: It is referenced by other records (bookings, etc.). Check foreign key constraints or delete related records first.' }); }
        res.status(500).json({ message: 'Server error deleting room.' });
    }
};