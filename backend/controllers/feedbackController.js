
export const createFeedback = async (req, res, db) => {
    const { guest_id, booking_id, rating, comment } = req.body;

    if (!guest_id || rating === undefined || !comment) {
        return res.status(400).json({ message: 'Missing required fields: guest_id, rating, comment.' });
    }
    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
         return res.status(400).json({ message: 'Rating must be a number between 1 and 5.' });
    }
    const bookingId = booking_id ? parseInt(booking_id, 10) : null; // Allow null booking_id
     if (booking_id && isNaN(bookingId)) {
         return res.status(400).json({ message: 'Booking ID must be a number if provided.' });
     }


    try {
         const [guestCheck] = await db.query('SELECT guest_id FROM guests WHERE guest_id = ?', [guest_id]);
         if(guestCheck.length === 0) return res.status(404).json({ message: 'Guest not found.' });
         if(bookingId){
             const [bookingCheck] = await db.query('SELECT booking_id FROM bookings WHERE booking_id = ? AND guest_id = ?', [bookingId, guest_id]);
             if(bookingCheck.length === 0) return res.status(404).json({ message: 'Associated booking not found for this guest.' });
         }

        const insertSql = `
            INSERT INTO feedback (guest_id, booking_id, rating, comment, feedback_date)
            VALUES (?, ?, ?, ?, CURDATE()) -- Use CURDATE() for feedback_date
        `;
        const [result] = await db.query(insertSql, [guest_id, bookingId, ratingNum, comment]);

        res.status(201).json({
            message: 'Thank you for your feedback!',
            feedbackId: result.insertId
        });

    } catch (error) {
        console.error('Error saving feedback:', error);
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
             return res.status(400).json({ message: 'Invalid Guest ID or Booking ID provided.' });
        }
        res.status(500).json({ message: 'Server error saving feedback.' });
    }
};

export const getAllFeedback = async (req, res, db) => {
     try {
         const sql = `
             SELECT
                 f.feedback_id, f.rating, f.comment, f.feedback_date,
                 g.guest_id, CONCAT(g.first_name, ' ', g.last_name) AS guest_name,
                 b.booking_id, r.room_type
             FROM feedback f
             JOIN guests g ON f.guest_id = g.guest_id
             LEFT JOIN bookings b ON f.booking_id = b.booking_id -- Left join in case booking_id is NULL
             LEFT JOIN rooms r ON b.room_id = r.room_id
             ORDER BY f.feedback_date DESC;
         `;
         const [feedback] = await db.query(sql);
         res.status(200).json({ feedback });
     } catch (error) {
         console.error('Error fetching feedback:', error);
         res.status(500).json({ message: 'Server error fetching feedback.' });
     }
 };