
export const registerClient = async (req, res, db) => {
    const { first_name, last_name, email, phone, password } = req.body;
    if (!first_name || !last_name || !email || !phone || !password) {
        return res.status(400).json({ message: 'Missing required fields: first_name, last_name, email, phone, password.' });
    }
    console.warn(`🚨 REGISTER CLIENT: Storing PLAIN TEXT password for ${email}. Add hashing!`);
    const plainPasswordToStore = password;
    try {
        const checkUserSql = 'SELECT guest_id FROM guests WHERE email = ? OR phone = ? LIMIT 1';
        const [existingUsers] = await db.query(checkUserSql, [email, phone]);
        if (existingUsers.length > 0) { return res.status(409).json({ message: 'Email or phone number is already registered.' }); }

        // Assumes 'password' column exists in 'guests' table
        const insertSql = `INSERT INTO guests (first_name, last_name, email, phone, password) VALUES (?, ?, ?, ?, ?)`;
        const [result] = await db.query(insertSql, [first_name, last_name, email, phone, plainPasswordToStore]);
        res.status(201).json({ message: 'Client registered successfully!', guestId: result.insertId });
    } catch (error) { console.error('Error during client registration:', error); res.status(500).json({ message: 'Server error during registration process.' }); }
};

export const loginClient = async (req, res, db) => {
    const { email, password } = req.body;
    if (!email || !password) { return res.status(400).json({ message: 'Please provide both email and password.' }); }
    console.warn(`🚨 LOGIN CLIENT: Comparing PLAIN TEXT password for ${email}. Add hashing!`);
    const plainPasswordToCheck = password;
    try {
        // Assumes 'password' column exists
        const findUserSql = 'SELECT guest_id, first_name, last_name, email, password FROM guests WHERE email = ?';
        const [users] = await db.query(findUserSql, [email]);
        if (users.length === 0) { return res.status(401).json({ message: 'Invalid email or password.' }); }
        const user = users[0];
        if (plainPasswordToCheck !== user.password) { return res.status(401).json({ message: 'Invalid email or password.' }); }
        res.status(200).json({
            message: 'Login successful!',
            user: { guestId: user.guest_id, firstName: user.first_name, lastName: user.last_name, email: user.email }
        });
    } catch (error) { console.error('Error during client login:', error); res.status(500).json({ message: 'Server error during login process.' }); }
};

export const loginAdmin = async (req, res, db) => {
    const { username, password } = req.body;
    if (!username || !password) { return res.status(400).json({ message: 'Please provide both admin username and password.' }); }
    console.warn(`🚨 LOGIN ADMIN: Comparing PLAIN TEXT password for ${username}. Add hashing!`);
    const plainPasswordToCheck = password;
    try {
        const findAdminSql = 'SELECT admin_id, username, password FROM admin WHERE username = ?';
        const [admins] = await db.query(findAdminSql, [username]);
        if (admins.length === 0) { return res.status(401).json({ message: 'Invalid admin username or password.' }); }
        const adminUser = admins[0];
        if (plainPasswordToCheck !== adminUser.password) { return res.status(401).json({ message: 'Invalid admin username or password.' }); }
        console.log(`Admin login successful for ${username}`);
        res.status(200).json({
            message: 'Admin login successful!',
            admin: { adminId: adminUser.admin_id, username: adminUser.username }
            // token: 'ADMIN_JWT_GOES_HERE' // Add later
        });
    } catch (error) { console.error('Error during admin login:', error); res.status(500).json({ message: 'Server error during admin login process.' }); }
};