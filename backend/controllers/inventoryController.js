

export const getAllInventory = async (req, res, db) => {
    // Get potential filter query parameters
    const { item_name, min_quantity, max_quantity } = req.query;

    console.log("Fetching inventory with filters:", req.query);

    try {
        // Base SQL query
        let sql = `SELECT item_id, item_name, quantity, description FROM inventory`; // Removed last_updated for simplicity
        const params = [];
        const whereClauses = [];

        // --- Build WHERE clauses dynamically ---
        if (item_name) {
            whereClauses.push(`item_name LIKE ?`);
            params.push(`%${item_name}%`); // Search for name containing the term
        }
        if (min_quantity && !isNaN(min_quantity)) {
            whereClauses.push(`quantity >= ?`);
            params.push(parseInt(min_quantity, 10));
        }
        if (max_quantity && !isNaN(max_quantity)) {
            whereClauses.push(`quantity <= ?`);
            params.push(parseInt(max_quantity, 10));
        }
        // Add more filters if needed

        // Append WHERE clauses if any exist
        if (whereClauses.length > 0) {
            sql += ` WHERE ${whereClauses.join(' AND ')}`;
        }

        // Add ordering
        sql += ` ORDER BY item_name ASC`; // Order by name

        console.log("Executing SQL:", db.format(sql, params));

        const [items] = await db.query(sql, params);
        res.status(200).json({ inventory: items });

    } catch (error) {
        console.error("Error fetching inventory:", error);
        res.status(500).json({ message: "Server error fetching inventory." });
    }
};
export const createInventoryItem = async (req, res, db) => {
    const { item_name, quantity, description } = req.body;
    if (!item_name || quantity === undefined) {
        return res.status(400).json({ message: "Item name and quantity are required." });
    }
    const qtyNum = parseInt(quantity, 10);
    if (isNaN(qtyNum) || qtyNum < 0) {
         return res.status(400).json({ message: "Quantity must be a non-negative integer." });
    }

    try {
        const sql = `INSERT INTO inventory (item_name, quantity, description) VALUES (?, ?, ?)`;
        const [result] = await db.query(sql, [item_name, qtyNum, description || null]);
        res.status(201).json({ message: "Inventory item created successfully!", itemId: result.insertId });
    } catch (error) {
        console.error("Error creating inventory item:", error);
        res.status(500).json({ message: "Server error creating inventory item." });
    }
};

export const updateInventoryItem = async (req, res, db) => {
     const { id } = req.params;
     const { item_name, quantity, description } = req.body;

     if (!id || isNaN(id)) return res.status(400).json({ message: "Valid Item ID required." });
     if (item_name === undefined && quantity === undefined && description === undefined) {
         return res.status(400).json({ message: "At least one field (item_name, quantity, description) is required." });
     }
     let qtyNum;
     if (quantity !== undefined) {
         qtyNum = parseInt(quantity, 10);
         if (isNaN(qtyNum) || qtyNum < 0) {
             return res.status(400).json({ message: "Quantity must be a non-negative integer." });
         }
     }

    try {
         const [existing] = await db.query('SELECT item_id FROM inventory WHERE item_id = ?', [id]);
         if (existing.length === 0) return res.status(404).json({ message: 'Inventory item not found.' });

        let sql = 'UPDATE inventory SET ';
        const params = [];
        const fields = [];
        if (item_name !== undefined) { fields.push('item_name = ?'); params.push(item_name); }
        if (qtyNum !== undefined) { fields.push('quantity = ?'); params.push(qtyNum); }
        if (description !== undefined) { fields.push('description = ?'); params.push(description); }
        // last_updated updates automatically via ON UPDATE CURRENT_TIMESTAMP

        if (fields.length === 0) return res.status(400).json({ message: "No valid fields to update." });

        sql += fields.join(', ');
        sql += ' WHERE item_id = ?';
        params.push(id);

        const [result] = await db.query(sql, params);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Item not found or no changes made." });
        res.status(200).json({ message: `Inventory item ${id} updated successfully!` });
    } catch (error) {
        console.error(`Error updating inventory item ${id}:`, error);
        res.status(500).json({ message: "Server error updating inventory item." });
    }
};

 export const deleteInventoryItem = async (req, res, db) => {
     const { id } = req.params;
     if (!id || isNaN(id)) return res.status(400).json({ message: "Valid Item ID required." });

     try {
         const [existing] = await db.query('SELECT item_id FROM inventory WHERE item_id = ?', [id]);
         if (existing.length === 0) return res.status(404).json({ message: 'Inventory item not found.' });

         const sql = 'DELETE FROM inventory WHERE item_id = ?';
         const [result] = await db.query(sql, [id]);
         if (result.affectedRows === 0) return res.status(404).json({ message: "Item not found." });
         res.status(200).json({ message: `Inventory item ${id} deleted successfully.` });
     } catch (error) {
         console.error(`Error deleting inventory item ${id}:`, error);
         res.status(500).json({ message: "Server error deleting inventory item." });
     }
 };