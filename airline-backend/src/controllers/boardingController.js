const { pool, memoryDB, isConnectedToMySQL } = require('../config/db');

// Valid state transitions for Boarding Lifecycle
const VALID_TRANSITIONS = {
  'NOT_CHECKED_IN': ['CHECKED_IN'],
  'CHECKED_IN': ['BOARDING', 'NOT_CHECKED_IN'],
  'BOARDING': ['BOARDED', 'CHECKED_IN'],
  'BOARDED': ['BOARDING']
};

/**
 * Get boarding manifest for a specific flight (Admin / Staff)
 */
async function getBoardingByFlight(req, res, next) {
  try {
    const flightId = parseInt(req.params.flightId, 10);

    if (isConnectedToMySQL() && pool) {
      const query = `
        SELECT 
          bd.id AS boarding_id,
          bd.booking_id,
          bd.seat_number,
          bd.gate,
          bd.boarding_group,
          bd.boarding_time,
          bd.check_in_status,
          bd.boarding_status,
          b.pnr,
          bp.full_name AS passenger_name,
          bp.gender,
          bp.age,
          bp.travel_class,
          f.flight_number,
          f.departure_time,
          a_from.airport_code AS from_code,
          a_to.airport_code AS to_code
        FROM boarding bd
        JOIN bookings b ON bd.booking_id = b.id
        JOIN booking_passengers bp ON bd.passenger_id = bp.id
        JOIN flights f ON bd.flight_id = f.id
        JOIN airports a_from ON f.from_airport_id = a_from.id
        JOIN airports a_to ON f.to_airport_id = a_to.id
        WHERE bd.flight_id = ? AND b.booking_status != 'CANCELLED'
        ORDER BY bd.seat_number ASC
      `;
      const [rows] = await pool.query(query, [flightId]);
      return res.json({ success: true, count: rows.length, manifest: rows });
    } else {
      const manifest = memoryDB.boarding
        .filter(bd => bd.flight_id === flightId)
        .map(bd => {
          const booking = memoryDB.bookings.find(b => b.id === bd.booking_id) || {};
          if (booking.booking_status === 'CANCELLED') return null;

          const bp = memoryDB.booking_passengers.find(p => p.id === bd.passenger_id) || {};
          const flight = memoryDB.flights.find(f => f.id === flightId) || {};
          const a_from = memoryDB.airports.find(a => a.id === flight.from_airport_id) || {};
          const a_to = memoryDB.airports.find(a => a.id === flight.to_airport_id) || {};

          return {
            boarding_id: bd.id,
            booking_id: bd.booking_id,
            seat_number: bd.seat_number,
            gate: bd.gate || 'Gate 3B',
            boarding_group: bd.boarding_group || 'Group 2',
            boarding_time: bd.boarding_time,
            check_in_status: bd.check_in_status,
            boarding_status: bd.boarding_status,
            pnr: booking.pnr,
            passenger_name: bp.full_name || 'Passenger',
            gender: bp.gender,
            age: bp.age,
            travel_class: bp.travel_class || 'Economy',
            flight_number: flight.flight_number,
            departure_time: flight.departure_time,
            from_code: a_from.airport_code,
            to_code: a_to.airport_code
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.seat_number.localeCompare(b.seat_number, undefined, { numeric: true }));

      return res.json({ success: true, count: manifest.length, manifest });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Get Boarding Pass for a booking
 */
async function getBoardingPass(req, res, next) {
  try {
    const identifier = req.params.identifier; // Can be PNR or bookingId

    if (isConnectedToMySQL() && pool) {
      const isPnr = isNaN(identifier);
      const condition = isPnr ? 'b.pnr = ?' : 'b.id = ?';
      const param = isPnr ? identifier.toUpperCase() : parseInt(identifier, 10);

      const query = `
        SELECT 
          bd.id AS boarding_id,
          bd.gate,
          bd.boarding_group,
          bd.boarding_time,
          bd.check_in_status,
          bd.boarding_status,
          b.id AS booking_id,
          b.pnr,
          b.travel_class,
          bp.id AS passenger_id,
          bp.full_name AS passenger_name,
          bp.seat_number,
          f.flight_number,
          f.airline,
          f.departure_time,
          f.arrival_time,
          a_from.airport_code AS from_code,
          a_from.airport_name AS from_name,
          a_from.city AS from_city,
          a_to.airport_code AS to_code,
          a_to.airport_name AS to_name,
          a_to.city AS to_city
        FROM boarding bd
        JOIN bookings b ON bd.booking_id = b.id
        JOIN booking_passengers bp ON bd.passenger_id = bp.id
        JOIN flights f ON bd.flight_id = f.id
        JOIN airports a_from ON f.from_airport_id = a_from.id
        JOIN airports a_to ON f.to_airport_id = a_to.id
        WHERE ${condition} AND b.booking_status != 'CANCELLED'
      `;
      const [rows] = await pool.query(query, [param]);

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Active boarding pass not found for this booking reference.'
        });
      }

      // Add encoded QR payload for each pass
      const passes = rows.map(pass => ({
        ...pass,
        qrPayload: `AEROPASS:${pass.pnr}|PAX:${pass.passenger_name.replace(/\s+/g, '_')}|FLT:${pass.flight_number}|SEAT:${pass.seat_number}|GATE:${pass.gate}|CLASS:${pass.travel_class}`
      }));

      return res.json({ success: true, count: passes.length, boardingPasses: passes });
    } else {
      let booking = null;
      if (isNaN(identifier)) {
        booking = memoryDB.bookings.find(b => b.pnr.toUpperCase() === identifier.toUpperCase());
      } else {
        booking = memoryDB.bookings.find(b => b.id === parseInt(identifier, 10));
      }

      if (!booking || booking.booking_status === 'CANCELLED') {
        return res.status(404).json({
          success: false,
          message: 'Active boarding pass not found for this booking reference.'
        });
      }

      const flight = memoryDB.flights.find(f => f.id === booking.flight_id) || {};
      const a_from = memoryDB.airports.find(a => a.id === flight.from_airport_id) || {};
      const a_to = memoryDB.airports.find(a => a.id === flight.to_airport_id) || {};
      const bds = memoryDB.boarding.filter(bd => bd.booking_id === booking.id);

      const passes = bds.map(bd => {
        const bp = memoryDB.booking_passengers.find(p => p.id === bd.passenger_id) || {};
        return {
          boarding_id: bd.id,
          gate: bd.gate || 'Gate 3B',
          boarding_group: bd.boarding_group || 'Group 2',
          boarding_time: bd.boarding_time || flight.departure_time,
          check_in_status: bd.check_in_status,
          boarding_status: bd.boarding_status,
          booking_id: booking.id,
          pnr: booking.pnr,
          travel_class: booking.travel_class,
          passenger_id: bp.id,
          passenger_name: bp.full_name || 'Passenger',
          seat_number: bd.seat_number,
          flight_number: flight.flight_number,
          airline: flight.airline,
          departure_time: flight.departure_time,
          arrival_time: flight.arrival_time,
          from_code: a_from.airport_code,
          from_name: a_from.airport_name,
          from_city: a_from.city,
          to_code: a_to.airport_code,
          to_name: a_to.airport_name,
          to_city: a_to.city,
          qrPayload: `AEROPASS:${booking.pnr}|PAX:${(bp.full_name || 'Passenger').replace(/\s+/g, '_')}|FLT:${flight.flight_number}|SEAT:${bd.seat_number}|GATE:${bd.gate || 'Gate 3B'}|CLASS:${booking.travel_class}`
        };
      });

      return res.json({ success: true, count: passes.length, boardingPasses: passes });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Update Boarding / Check-in Status
 * Enforces strict valid state transitions
 */
async function updateBoardingStatus(req, res, next) {
  try {
    const boardingId = parseInt(req.params.id, 10);
    const { status } = req.body; // 'CHECKED_IN', 'BOARDING', 'BOARDED', 'NOT_CHECKED_IN'

    if (!status) {
      return res.status(400).json({ success: false, message: 'Target status is required.' });
    }

    if (isConnectedToMySQL() && pool) {
      const [rows] = await pool.query('SELECT * FROM boarding WHERE id = ?', [boardingId]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Boarding record not found.' });
      }

      const current = rows[0];
      const allowedNext = VALID_TRANSITIONS[current.boarding_status] || [];

      if (!allowedNext.includes(status) && current.boarding_status !== status) {
        return res.status(400).json({
          success: false,
          message: `Invalid state transition: Cannot transition from '${current.boarding_status}' to '${status}'. Allowed: ${allowedNext.join(', ')}`
        });
      }

      const checkInStatus = (status === 'NOT_CHECKED_IN') ? 'NOT_CHECKED_IN' : 'CHECKED_IN';

      await pool.query(
        'UPDATE boarding SET boarding_status = ?, check_in_status = ? WHERE id = ?',
        [status, checkInStatus, boardingId]
      );

      return res.json({
        success: true,
        message: `Boarding status successfully updated to '${status}'.`,
        boardingId,
        newStatus: status
      });
    } else {
      const bd = memoryDB.boarding.find(item => item.id === boardingId);
      if (!bd) {
        return res.status(404).json({ success: false, message: 'Boarding record not found.' });
      }

      const allowedNext = VALID_TRANSITIONS[bd.boarding_status] || [];
      if (!allowedNext.includes(status) && bd.boarding_status !== status) {
        return res.status(400).json({
          success: false,
          message: `Invalid state transition: Cannot transition from '${bd.boarding_status}' to '${status}'. Allowed: ${allowedNext.join(', ')}`
        });
      }

      bd.boarding_status = status;
      bd.check_in_status = (status === 'NOT_CHECKED_IN') ? 'NOT_CHECKED_IN' : 'CHECKED_IN';

      return res.json({
        success: true,
        message: `Boarding status successfully updated to '${status}'.`,
        boardingId,
        newStatus: status
      });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Passenger Self Check-in
 */
async function selfCheckIn(req, res, next) {
  try {
    const { pnr } = req.body;

    if (!pnr) {
      return res.status(400).json({ success: false, message: 'PNR reference code is required for check-in.' });
    }

    if (isConnectedToMySQL() && pool) {
      const [bookingRows] = await pool.query('SELECT id, booking_status FROM bookings WHERE pnr = ?', [pnr.toUpperCase().trim()]);
      if (bookingRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Booking reference not found.' });
      }

      const booking = bookingRows[0];
      if (booking.booking_status === 'CANCELLED') {
        return res.status(400).json({ success: false, message: 'Cannot check in for a cancelled booking.' });
      }

      await pool.query(
        "UPDATE boarding SET check_in_status = 'CHECKED_IN', boarding_status = 'CHECKED_IN' WHERE booking_id = ? AND boarding_status = 'NOT_CHECKED_IN'",
        [booking.id]
      );

      return res.json({
        success: true,
        message: 'Check-in completed successfully! Boarding pass is now ready.'
      });
    } else {
      const booking = memoryDB.bookings.find(b => b.pnr.toUpperCase() === pnr.toUpperCase().trim());
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking reference not found.' });
      }

      if (booking.booking_status === 'CANCELLED') {
        return res.status(400).json({ success: false, message: 'Cannot check in for a cancelled booking.' });
      }

      memoryDB.boarding
        .filter(bd => bd.booking_id === booking.id && bd.boarding_status === 'NOT_CHECKED_IN')
        .forEach(bd => {
          bd.check_in_status = 'CHECKED_IN';
          bd.boarding_status = 'CHECKED_IN';
        });

      return res.json({
        success: true,
        message: 'Check-in completed successfully! Boarding pass is now ready.'
      });
    }
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getBoardingByFlight,
  getBoardingPass,
  updateBoardingStatus,
  selfCheckIn
};
