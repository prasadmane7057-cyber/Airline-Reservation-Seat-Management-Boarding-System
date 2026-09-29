const { pool, memoryDB, isConnectedToMySQL, generateSeatLayoutForFlight } = require('../config/db');

/**
 * Get all seats for a specific flight
 */
async function getSeatsByFlight(req, res, next) {
  try {
    const flightId = parseInt(req.params.flightId, 10);

    if (isConnectedToMySQL() && pool) {
      const [rows] = await pool.query(
        'SELECT * FROM seats WHERE flight_id = ? ORDER BY row_number ASC, column_letter ASC',
        [flightId]
      );

      if (rows.length === 0) {
        // If flight seats haven't been generated in DB yet, generate them dynamically
        const generated = [];
        for (let r = 1; r <= 2; r++) {
          ['A', 'B', 'E', 'F'].forEach(c => generated.push([flightId, `${r}${c}`, r, c, 'First Class', false]));
        }
        for (let r = 3; r <= 5; r++) {
          ['A', 'B', 'C', 'D', 'E', 'F'].forEach(c => generated.push([flightId, `${r}${c}`, r, c, 'Business', false]));
        }
        for (let r = 6; r <= 20; r++) {
          ['A', 'B', 'C', 'D', 'E', 'F'].forEach(c => generated.push([flightId, `${r}${c}`, r, c, 'Economy', false]));
        }

        await pool.query(
          'INSERT INTO seats (flight_id, seat_number, row_number, column_letter, seat_class, is_occupied) VALUES ?',
          [generated]
        );

        const [newRows] = await pool.query(
          'SELECT * FROM seats WHERE flight_id = ? ORDER BY row_number ASC, column_letter ASC',
          [flightId]
        );
        return res.json({ success: true, count: newRows.length, seats: newRows });
      }

      return res.json({ success: true, count: rows.length, seats: rows });
    } else {
      let flightSeats = memoryDB.seats.filter(s => s.flight_id === flightId);
      if (flightSeats.length === 0) {
        const generated = generateSeatLayoutForFlight(flightId);
        memoryDB.seats.push(...generated);
        flightSeats = generated;
      }

      return res.json({ success: true, count: flightSeats.length, seats: flightSeats });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Update seat status (block/unblock or manual override)
 */
async function updateSeatStatus(req, res, next) {
  try {
    const seatId = parseInt(req.params.id, 10);
    const { is_occupied, is_blocked } = req.body;

    if (isConnectedToMySQL() && pool) {
      await pool.query(
        'UPDATE seats SET is_occupied = COALESCE(?, is_occupied), is_blocked = COALESCE(?, is_blocked) WHERE id = ?',
        [is_occupied !== undefined ? is_occupied : null, is_blocked !== undefined ? is_blocked : null, seatId]
      );
    } else {
      const seat = memoryDB.seats.find(s => s.id === seatId);
      if (seat) {
        if (is_occupied !== undefined) seat.is_occupied = Boolean(is_occupied);
        if (is_blocked !== undefined) seat.is_blocked = Boolean(is_blocked);
      }
    }

    res.json({ success: true, message: 'Seat status updated.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSeatsByFlight,
  updateSeatStatus
};
