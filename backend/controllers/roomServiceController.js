// backend/controllers/roomServiceController.js
// UPDATED to use 'order_items' table storing name/price directly

// --- Create Room Service Order (Client Action) ---
export const createRoomServiceOrder = async (req, res, db) => {
    // Expect guest_id, room_id, total_amount (calculated by frontend), and ITEMS array
    // items array should look like: [ { itemName: "Club Sandwich", quantity: 1, price: 12.00 }, { itemName: "Cola", quantity: 2, price: 3.00 } ]
    const { guest_id, room_id, total_amount, items } = req.body;

    // --- Validation ---
    if (!guest_id || room_id === undefined || total_amount === undefined || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Missing required fields: guest_id, room_id, total_amount, and a non-empty items array.' });
    }
    if (isNaN(guest_id) || isNaN(room_id) || isNaN(total_amount) || total_amount < 0) {
        return res.status(400).json({ message: 'Guest ID, Room ID must be numbers, total_amount must be non-negative.' });
    }
    // Validate items array structure (expecting itemName, quantity, price)
    for (const item of items) {
        if (!item.itemName || typeof item.itemName !== 'string' || !item.quantity || isNaN(item.quantity) || item.quantity <= 0 || item.price === undefined || isNaN(item.price) || item.price < 0) {
             return res.status(400).json({ message: 'Each item in the order must have a valid itemName (string), quantity (positive number), and price (non-negative number).' });
        }
    }

    // Use a transaction for atomicity (assuming db connection object supports it)
    // NOTE: Single connection model doesn't reliably support transactions. Pool is better.
    // We'll proceed without explicit transaction commit/rollback assuming single connection,
    // but be aware this isn't fully robust against partial failures.
    let connection = db; // Use the passed single connection
    try {
        // await connection.beginTransaction(); // Cannot reliably use with single connection

        console.log("Processing Room Service Order...");

        // Step 1: Insert the main order record into roomserviceorders
        const insertOrderSql = `
            INSERT INTO roomserviceorders (guest_id, room_id, order_date, total_amount, order_status)
            VALUES (?, ?, CURDATE(), ?, 'Pending')
        `;
        const [orderResult] = await connection.query(insertOrderSql, [guest_id, room_id, total_amount]);
        const newOrderId = orderResult.insertId;

        if (!newOrderId) {
            // await connection.rollback();
            throw new Error("Failed to create main order record.");
        }
        console.log(`Created main order record with ID: ${newOrderId}`);

        // Step 2: Insert each item into the order_items table
        const insertItemSql = `
            INSERT INTO order_items (order_id, item_name, quantity, price_per_item)
            VALUES (?, ?, ?, ?)
        `;
        // Create an array of promises for inserting items
        const itemInsertPromises = items.map(item => {
            console.log(` > Inserting item: OrderID=${newOrderId}, Name=${item.itemName}, Qty=${item.quantity}, Price=${item.price}`);
            return connection.query(insertItemSql, [newOrderId, item.itemName, item.quantity, item.price]);
        });

        // Execute all item insert queries
        await Promise.all(itemInsertPromises);
        console.log("All order items inserted successfully.");

        // Step 3: Commit (Not applicable for single connection)
        // await connection.commit();

        res.status(201).json({
            message: 'Room service order placed successfully!',
            orderId: newOrderId
        });

    } catch (error) {
        // if (connection) await connection.rollback();
        console.error('Error creating room service order:', error);
        // Check for FK errors related to roomserviceorders table itself
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
             // This error now more likely relates to guest_id or room_id in roomserviceorders table
             return res.status(400).json({ message: 'Invalid Guest ID or Room ID provided for the order.' });
        }
        res.status(500).json({ message: 'Server error placing room service order.' });
    } finally {
        // If using a pool, release the connection:
        // if (connection && connection.release) connection.release();
    }
};

// --- Get All Room Service Orders (Admin View) ---
// This function remains largely the same, but we might want to fetch items too
export const getAllRoomServiceOrders = async (req, res, db) => {
    try {
        // Fetch main order details
        const ordersSql = `
            SELECT
                o.order_id, o.order_date, o.total_amount, o.order_status,
                g.guest_id, CONCAT(g.first_name, ' ', g.last_name) AS guest_name,
                r.room_id, r.room_type
            FROM roomserviceorders o
            JOIN guests g ON o.guest_id = g.guest_id
            JOIN rooms r ON o.room_id = r.room_id
            ORDER BY o.order_date DESC;
        `;
        const [orders] = await db.query(ordersSql);

        // ** Optional: Fetch items for each order **
        // This can lead to the N+1 query problem (inefficient for many orders)
        // A better approach might be a separate endpoint or frontend fetches
        for (let order of orders) {
            const itemsSql = `
                SELECT item_name, quantity, price_per_item
                FROM order_items
                WHERE order_id = ?
            `;
            const [items] = await db.query(itemsSql, [order.order_id]);
            order.items = items; // Attach items to the order object
        }

        res.status(200).json({ roomServiceOrders: orders });
    } catch (error) {
        console.error('Error fetching room service orders:', error);
        res.status(500).json({ message: 'Server error fetching room service orders.' });
    }
};

// --- Update Room Service Order Status (Admin Action) ---
// No changes needed here - it only updates the main order status
export const updateRoomServiceOrderStatus = async (req, res, db) => {
     const { id } = req.params; // order_id
     const { status } = req.body;
     const newStatus = status;

     if (!id || isNaN(id)) { return res.status(400).json({ message: 'Valid Order ID required.' }); }
     const validStatuses = ['Pending', 'Delivered', 'Cancelled'];
     if (!newStatus || !validStatuses.includes(newStatus)) {
         return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}.` });
     }

     try {
         const [existing] = await db.query('SELECT order_id FROM roomserviceorders WHERE order_id = ?', [id]);
         if (existing.length === 0) { return res.status(404).json({ message: 'Order not found.' }); }

         const updateSql = 'UPDATE roomserviceorders SET order_status = ? WHERE order_id = ?';
         const [result] = await db.query(updateSql, [newStatus, id]);

         if (result.affectedRows === 0) { return res.status(404).json({ message: 'Order not found or status not changed.' }); }

         res.status(200).json({ message: `Room service order ${id} status updated successfully!` });

     } catch (error) {
         console.error(`Error updating status for room service order ${id}:`, error);
         res.status(500).json({ message: 'Server error updating order status.' });
     }
 };