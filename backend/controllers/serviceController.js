// backend/controllers/serviceController.js
// Interacts with 'services' and 'servicerequests' tables

// --- Get All Services (for client dropdowns) ---
export const getAllServices = async (req, res, db) => {
    try {
        const sql = 'SELECT service_id, service_name, description, price FROM services ORDER BY service_name';
        const [services] = await db.query(sql);
        res.status(200).json({ services });
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({ message: 'Server error fetching services.' });
    }
};

// --- Create Service Request (Client Action) ---
// backend/controllers/serviceController.js

// --- Create Service Request (Client Action) ---
// Accepts 'db' connection as the third argument
export const createServiceRequest = async (req, res, db) => {
    console.log("<<<<< INSIDE createServiceRequest Controller >>>>>"); // Log entry
    console.log("Received Body:", JSON.stringify(req.body, null, 2)); // Log incoming data
    const { guest_id, service_id } = req.body;
    console.log(`Parsed IDs: guest_id=${guest_id}, service_id=${service_id}`); // Log parsed IDs

    // --- Validation ---
    console.log("Checking validation..."); // Log before validation
    if (!guest_id || !service_id || isNaN(guest_id) || isNaN(service_id)) {
        console.error("--> Validation FAILED: Missing or invalid IDs"); // Log validation failure
        return res.status(400).json({ message: 'Valid guest_id and service_id are required.' });
    }
    console.log("Basic validation passed."); // Log successful validation

    try {
        // --- Optional Guest/Service Existence Check ---
        console.log("Checking guest existence...");
        const [guestCheck] = await db.query('SELECT guest_id FROM guests WHERE guest_id = ?', [guest_id]);
        if(guestCheck.length === 0) {
             console.error(`--> Validation FAILED: Guest ID ${guest_id} not found.`);
             return res.status(404).json({ message: 'Guest not found.' });
        }
        console.log("Guest exists.");

        console.log("Checking service existence...");
        const [serviceCheck] = await db.query('SELECT service_id FROM services WHERE service_id = ?', [service_id]);
        if(serviceCheck.length === 0) {
             console.error(`--> Validation FAILED: Service ID ${service_id} not found.`);
             return res.status(404).json({ message: 'Service not found.' });
        }
        console.log("Service exists.");

        // --- Insert Attempt ---
        // SQL query to insert into servicerequests table
        const insertSql = `
            INSERT INTO servicerequests (guest_id, service_id, request_date, status)
            VALUES (?, ?, CURDATE(), 'Pending')
        `; // Uses two placeholders '?' and provides direct values for date and status

        console.log("Attempting INSERT into servicerequests with guest_id:", guest_id, "and service_id:", service_id); // Log before insert

        // ** FIX: Corrected parameters array - only provide values for the '?' placeholders **
        const [result] = await db.query(insertSql, [guest_id, service_id]); // Only pass guest_id and service_id

        console.log("INSERT successful! Result:", result); // Log on success

        // --- Success Response ---
        res.status(201).json({ // Send 201 Created status
            message: 'Service requested successfully!',
            requestId: result.insertId // Include the ID of the new request
        });

    } catch (error) {
        // --- Error Handling ---
        console.error('--- ERROR in createServiceRequest TRY block ---'); // Log inside catch
        console.error('Error Details:', error); // Log the full error object

        // Check for specific foreign key errors if needed (though existence check should prevent most)
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
             return res.status(400).json({ message: 'Invalid Guest ID or Service ID provided (database constraint).' });
        }
        // Send a generic server error response
        res.status(500).json({ message: 'Server error creating service request.' });
    }
};

// Keep other functions like getAllServices, getAllServiceRequests, updateServiceRequestStatus in this file if they exist
// export const getAllServices = async (req, res, db) => { ... };
// export const getAllServiceRequests = async (req, res, db) => { ... };
// export const updateServiceRequestStatus = async (req, res, db) => { ... };
// --- Get All Service Requests (Admin View) ---
export const getAllServiceRequests = async (req, res, db) => {
     try {
        const sql = `
            SELECT
                sr.request_id, sr.request_date, sr.status,
                g.guest_id, CONCAT(g.first_name, ' ', g.last_name) AS guest_name,
                s.service_id, s.service_name
            FROM servicerequests sr
            JOIN guests g ON sr.guest_id = g.guest_id
            JOIN services s ON sr.service_id = s.service_id
            ORDER BY sr.request_date DESC;
        `;
        const [requests] = await db.query(sql);
        res.status(200).json({ serviceRequests: requests });
    } catch (error) {
        console.error('Error fetching service requests:', error);
        res.status(500).json({ message: 'Server error fetching service requests.' });
    }
};

// --- Update Service Request Status (Admin Action) ---
export const updateServiceRequestStatus = async (req, res, db) => {
    const { id } = req.params; // request_id
    const { status } = req.body;

    if (!id || isNaN(id)) { return res.status(400).json({ message: 'Valid Request ID required.' }); }
    const validStatuses = ['Pending', 'Completed', 'Cancelled']; // Matches schema example
    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}.` });
    }

    try {
        const [existing] = await db.query('SELECT request_id FROM servicerequests WHERE request_id = ?', [id]);
        if (existing.length === 0) { return res.status(404).json({ message: 'Service request not found.' }); }

        const updateSql = 'UPDATE servicerequests SET status = ? WHERE request_id = ?';
        const [result] = await db.query(updateSql, [status, id]);

        if (result.affectedRows === 0) { return res.status(404).json({ message: 'Request not found or status not changed.' }); }

        res.status(200).json({ message: `Service request ${id} status updated successfully!` });

    } catch (error) {
        console.error(`Error updating status for service request ${id}:`, error);
        res.status(500).json({ message: 'Server error updating service request status.' });
    }
};