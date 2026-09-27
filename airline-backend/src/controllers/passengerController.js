const { pool, memoryDB, isConnectedToMySQL } = require('../config/db');

/**
 * Admin: Get all registered passengers with booking counts
 */
async function getPassengers(req, res, next) {
  try {
    if (isConnectedToMySQL() && pool) {
      const query = `
        SELECT 
          u.id AS user_id,
          u.name,
          u.email,
          u.phone,
          u.status,
          u.created_at,
          COUNT(b.id) AS total_bookings,
          SUM(CASE WHEN b.booking_status = 'CONFIRMED' THEN 1 ELSE 0 END) AS active_bookings
        FROM users u
        LEFT JOIN bookings b ON u.id = b.user_id
        WHERE u.role = 'passenger'
        GROUP BY u.id
        ORDER BY u.created_at DESC
      `;
      const [rows] = await pool.query(query);
      return res.json({ success: true, count: rows.length, passengers: rows });
    } else {
      const list = memoryDB.users
        .filter(u => u.role === 'passenger')
        .map(u => {
          const userBookings = memoryDB.bookings.filter(b => b.user_id === u.id);
          const activeBookings = userBookings.filter(b => b.booking_status === 'CONFIRMED');
          return {
            user_id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone || '',
            status: u.status || 'ACTIVE',
            created_at: u.created_at,
            total_bookings: userBookings.length,
            active_bookings: activeBookings.length
          };
        });

      return res.json({ success: true, count: list.length, passengers: list });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Update Passenger Account Status (ACTIVE / INACTIVE)
 */
async function updatePassengerStatus(req, res, next) {
  try {
    const userId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required.' });
    }

    if (isConnectedToMySQL() && pool) {
      await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, userId]);
    } else {
      const u = memoryDB.users.find(usr => usr.id === userId);
      if (u) u.status = status;
    }

    res.json({ success: true, message: `Passenger account status updated to ${status}.` });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPassengers,
  updatePassengerStatus
};
