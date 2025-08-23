// backend/controllers/statsController.js
// Fetches counts for the admin dashboard

export const getDashboardStats = async (req, res, db) => {
    console.log("Fetching dashboard stats...");
    try {
        // Use Promise.all to run counts concurrently
        const [
            bookingResult,
            availableRoomResult,
            pendingComplaintResult,
            staffResult
        ] = await Promise.all([
            db.query("SELECT COUNT(*) as count FROM bookings WHERE status != 'Cancelled'"),
            db.query("SELECT COUNT(*) as count FROM rooms WHERE available = 1"),
            db.query("SELECT COUNT(*) as count FROM complaints WHERE status = 'Pending'"),
            db.query("SELECT COUNT(*) as count FROM staff")
        ]);

        // Extract counts, defaulting to 0 if query fails unexpectedly (though errors should be caught)
        const stats = {
            totalBookings: bookingResult[0][0]?.count ?? 0,
            roomsAvailable: availableRoomResult[0][0]?.count ?? 0,
            pendingComplaints: pendingComplaintResult[0][0]?.count ?? 0,
            activeStaff: staffResult[0][0]?.count ?? 0,
        };

        console.log("Dashboard Stats:", stats);
        res.status(200).json(stats);

    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ message: "Server error fetching dashboard statistics." });
    }
};