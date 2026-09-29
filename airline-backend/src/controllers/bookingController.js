const { pool, memoryDB, isConnectedToMySQL } = require('../config/db');
const { generateUniquePNR } = require('../utils/pnrGenerator');
const { calculateFareBreakdown } = require('../utils/fareCalculator');

/**
 * Create a new booking with transactional seat allocation & simulated payment
 */
async function createBooking(req, res, next) {
  try {
    const userId = req.user.id;
    const {
      flightId,
      travelClass = 'Economy',
      passengers = [],
      paymentMethod = 'Credit Card',
      customDiscount = 0
    } = req.body;

    if (!flightId || !passengers || passengers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Flight ID and at least one passenger are required.'
      });
    }

    // Validate passenger entries
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.fullName || !p.seatNumber) {
        return res.status(400).json({
          success: false,
          message: `Passenger #${i + 1} must have a valid full name and selected seat number.`
        });
      }
    }

    const selectedSeatNumbers = passengers.map(p => p.seatNumber);
    // Check for duplicate seat selections in current request
    const uniqueSeatCheck = new Set(selectedSeatNumbers);
    if (uniqueSeatCheck.size !== selectedSeatNumbers.length) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate seats selected in the same booking request.'
      });
    }

    if (isConnectedToMySQL() && pool) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // 1. Fetch flight
        const [flightRows] = await connection.query('SELECT * FROM flights WHERE id = ? FOR UPDATE', [flightId]);
        if (flightRows.length === 0) {
          await connection.rollback();
          return res.status(404).json({ success: false, message: 'Flight not found.' });
        }
        const flight = flightRows[0];

        // 2. Fetch and check seats
        const [seatRows] = await connection.query(
          'SELECT * FROM seats WHERE flight_id = ? AND seat_number IN (?) FOR UPDATE',
          [flightId, selectedSeatNumbers]
        );

        if (seatRows.length !== selectedSeatNumbers.length) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: 'One or more selected seats do not exist on this flight.'
          });
        }

        // Check if any seat is already occupied or blocked
        const occupiedSeats = seatRows.filter(s => s.is_occupied || s.is_blocked);
        if (occupiedSeats.length > 0) {
          await connection.rollback();
          const occNumbers = occupiedSeats.map(s => s.seat_number).join(', ');
          return res.status(409).json({
            success: false,
            message: `Seat(s) ${occNumbers} are already occupied. Please select different seats.`
          });
        }

        // 3. Calculate authoritative fare
        let baseFareUnit = flight.economy_fare;
        if (travelClass === 'Business') baseFareUnit = flight.business_fare;
        else if (travelClass === 'First Class') baseFareUnit = flight.first_class_fare;

        const fareBreakdown = calculateFareBreakdown(baseFareUnit, passengers.length, customDiscount);

        // 4. Generate unique PNR
        const pnr = await generateUniquePNR();

        // 5. Insert Booking
        const [bookingResult] = await connection.query(
          `INSERT INTO bookings 
          (pnr, user_id, flight_id, total_fare, base_fare, tax_amount, discount_amount, booking_status, payment_status, travel_class)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', 'PAID', ?)`,
          [
            pnr,
            userId,
            flightId,
            fareBreakdown.totalFare,
            fareBreakdown.baseFare,
            fareBreakdown.taxAmount,
            fareBreakdown.discountAmount,
            travelClass
          ]
        );

        const bookingId = bookingResult.insertId;

        // 6. Insert Passengers and Lock Seats
        for (const p of passengers) {
          const matchingSeat = seatRows.find(s => s.seat_number === p.seatNumber);
          const [bpResult] = await connection.query(
            `INSERT INTO booking_passengers 
            (booking_id, seat_id, full_name, age, gender, passport_id, seat_number, travel_class)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              bookingId,
              matchingSeat.id,
              p.fullName.trim(),
              parseInt(p.age, 10) || 30,
              p.gender || 'Male',
              p.passportId || '',
              p.seatNumber,
              travelClass
            ]
          );

          const passengerRecordId = bpResult.insertId;

          // Lock seat
          await connection.query('UPDATE seats SET is_occupied = TRUE WHERE id = ?', [matchingSeat.id]);

          // Create boarding record
          await connection.query(
            `INSERT INTO boarding 
            (booking_id, passenger_id, flight_id, seat_number, gate, boarding_group, boarding_time, check_in_status, boarding_status)
            VALUES (?, ?, ?, ?, 'Gate 3B', 'Group 2', DATE_SUB(?, INTERVAL 45 MINUTE), 'NOT_CHECKED_IN', 'NOT_CHECKED_IN')`,
            [bookingId, passengerRecordId, flightId, p.seatNumber, flight.departure_time]
          );
        }

        // 7. Insert Payment record
        const txnId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        await connection.query(
          `INSERT INTO payments (booking_id, transaction_id, payment_method, amount, payment_status)
          VALUES (?, ?, ?, ?, 'SUCCESS')`,
          [bookingId, txnId, paymentMethod, fareBreakdown.totalFare]
        );

        // 8. Insert PNR Record
        await connection.query(
          `INSERT INTO pnr_records (pnr, booking_id, is_active) VALUES (?, ?, TRUE)`,
          [pnr, bookingId]
        );

        // 9. Update available seats on flight
        await connection.query(
          'UPDATE flights SET available_seats = GREATEST(0, available_seats - ?) WHERE id = ?',
          [passengers.length, flightId]
        );

        await connection.commit();

        return res.status(201).json({
          success: true,
          message: 'Booking confirmed successfully!',
          booking: {
            id: bookingId,
            pnr,
            flightId,
            flightNumber: flight.flight_number,
            travelClass,
            passengers: passengers,
            fare: fareBreakdown,
            transactionId: txnId,
            paymentMethod,
            paymentStatus: 'PAID',
            bookingStatus: 'CONFIRMED'
          }
        });
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    } else {
      // Memory DB Implementation
      const flight = memoryDB.flights.find(f => f.id === flightId);
      if (!flight) {
        return res.status(404).json({ success: false, message: 'Flight not found.' });
      }

      // Check seats in memory DB
      const flightSeats = memoryDB.seats.filter(s => s.flight_id === flightId && selectedSeatNumbers.includes(s.seat_number));
      const occupied = flightSeats.filter(s => s.is_occupied || s.is_blocked);
      if (occupied.length > 0) {
        const occNumbers = occupied.map(s => s.seat_number).join(', ');
        return res.status(409).json({
          success: false,
          message: `Seat(s) ${occNumbers} are already occupied. Please select different seats.`
        });
      }

      let baseFareUnit = flight.economy_fare;
      if (travelClass === 'Business') baseFareUnit = flight.business_fare;
      else if (travelClass === 'First Class') baseFareUnit = flight.first_class_fare;

      const fareBreakdown = calculateFareBreakdown(baseFareUnit, passengers.length, customDiscount);
      const pnr = await generateUniquePNR();
      const bookingId = memoryDB.bookings.length + 1;

      const newBooking = {
        id: bookingId,
        pnr,
        user_id: userId,
        flight_id: flightId,
        total_fare: fareBreakdown.totalFare,
        base_fare: fareBreakdown.baseFare,
        tax_amount: fareBreakdown.taxAmount,
        discount_amount: fareBreakdown.discountAmount,
        booking_status: 'CONFIRMED',
        payment_status: 'PAID',
        travel_class: travelClass,
        booking_date: new Date().toISOString()
      };
      memoryDB.bookings.push(newBooking);

      passengers.forEach((p, idx) => {
        // Mark seat occupied
        const targetSeat = memoryDB.seats.find(s => s.flight_id === flightId && s.seat_number === p.seatNumber);
        if (targetSeat) targetSeat.is_occupied = true;

        const bpId = memoryDB.booking_passengers.length + 1;
        memoryDB.booking_passengers.push({
          id: bpId,
          booking_id: bookingId,
          seat_id: targetSeat ? targetSeat.id : 100 + idx,
          full_name: p.fullName.trim(),
          age: parseInt(p.age, 10) || 30,
          gender: p.gender || 'Male',
          passport_id: p.passportId || '',
          seat_number: p.seatNumber,
          travel_class: travelClass
        });

        // Boarding record
        memoryDB.boarding.push({
          id: memoryDB.boarding.length + 1,
          booking_id: bookingId,
          passenger_id: bpId,
          flight_id: flightId,
          seat_number: p.seatNumber,
          gate: 'Gate 3B',
          boarding_group: 'Group 2',
          boarding_time: new Date(new Date(flight.departure_time).getTime() - 45 * 60000).toISOString(),
          check_in_status: 'NOT_CHECKED_IN',
          boarding_status: 'NOT_CHECKED_IN'
        });
      });

      const txnId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      memoryDB.payments.push({
        id: memoryDB.payments.length + 1,
        booking_id: bookingId,
        transaction_id: txnId,
        payment_method: paymentMethod,
        amount: fareBreakdown.totalFare,
        payment_status: 'SUCCESS',
        payment_date: new Date().toISOString()
      });

      memoryDB.pnr_records.push({
        id: memoryDB.pnr_records.length + 1,
        pnr,
        booking_id: bookingId,
        is_active: true,
        generated_at: new Date().toISOString()
      });

      flight.available_seats = Math.max(0, flight.available_seats - passengers.length);

      return res.status(201).json({
        success: true,
        message: 'Booking confirmed successfully!',
        booking: {
          id: bookingId,
          pnr,
          flightId,
          flightNumber: flight.flight_number,
          travelClass,
          passengers,
          fare: fareBreakdown,
          transactionId: txnId,
          paymentMethod,
          paymentStatus: 'PAID',
          bookingStatus: 'CONFIRMED'
        }
      });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Get all bookings for the authenticated user
 */
async function getUserBookings(req, res, next) {
  try {
    const userId = req.user.id;

    if (isConnectedToMySQL() && pool) {
      const query = `
        SELECT 
          b.*,
          f.flight_number,
          f.departure_time,
          f.arrival_time,
          f.duration,
          a_from.airport_code AS from_code,
          a_from.city AS from_city,
          a_to.airport_code AS to_code,
          a_to.city AS to_city,
          GROUP_CONCAT(CONCAT(bp.full_name, ' (', bp.seat_number, ')') SEPARATOR ', ') AS passenger_summary,
          GROUP_CONCAT(bp.seat_number SEPARATOR ', ') AS seat_numbers,
          p.payment_method,
          p.transaction_id
        FROM bookings b
        JOIN flights f ON b.flight_id = f.id
        JOIN airports a_from ON f.from_airport_id = a_from.id
        JOIN airports a_to ON f.to_airport_id = a_to.id
        LEFT JOIN booking_passengers bp ON b.id = bp.booking_id
        LEFT JOIN payments p ON b.id = p.booking_id
        WHERE b.user_id = ?
        GROUP BY b.id
        ORDER BY b.booking_date DESC
      `;
      const [rows] = await pool.query(query, [userId]);
      return res.json({ success: true, count: rows.length, bookings: rows });
    } else {
      const userBookings = memoryDB.bookings
        .filter(b => b.user_id === userId)
        .map(b => {
          const flight = memoryDB.flights.find(f => f.id === b.flight_id) || {};
          const a_from = memoryDB.airports.find(a => a.id === flight.from_airport_id) || {};
          const a_to = memoryDB.airports.find(a => a.id === flight.to_airport_id) || {};
          const bps = memoryDB.booking_passengers.filter(bp => bp.booking_id === b.id);
          const payment = memoryDB.payments.find(p => p.booking_id === b.id) || {};

          return {
            ...b,
            flight_number: flight.flight_number || 'AI000',
            departure_time: flight.departure_time,
            arrival_time: flight.arrival_time,
            duration: flight.duration,
            from_code: a_from.airport_code,
            from_city: a_from.city,
            to_code: a_to.airport_code,
            to_city: a_to.city,
            passenger_summary: bps.map(bp => `${bp.full_name} (${bp.seat_number})`).join(', '),
            seat_numbers: bps.map(bp => bp.seat_number).join(', '),
            payment_method: payment.payment_method || 'Credit Card',
            transaction_id: payment.transaction_id || ''
          };
        })
        .sort((a, b) => new Date(b.booking_date) - new Date(a.booking_date));

      return res.json({ success: true, count: userBookings.length, bookings: userBookings });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Get detailed booking information by ID or PNR
 */
async function getBookingById(req, res, next) {
  try {
    const identifier = req.params.id; // Can be numeric ID or 6-char PNR

    if (isConnectedToMySQL() && pool) {
      const isPnr = isNaN(identifier);
      const condition = isPnr ? 'b.pnr = ?' : 'b.id = ?';
      const param = isPnr ? identifier.toUpperCase() : parseInt(identifier, 10);

      const [bookingRows] = await pool.query(
        `SELECT 
          b.*,
          f.flight_number,
          f.airline,
          f.departure_time,
          f.arrival_time,
          f.duration,
          a_from.airport_code AS from_code,
          a_from.airport_name AS from_name,
          a_from.city AS from_city,
          a_to.airport_code AS to_code,
          a_to.airport_name AS to_name,
          a_to.city AS to_city,
          p.transaction_id,
          p.payment_method,
          p.payment_date,
          u.name AS booked_by_name,
          u.email AS booked_by_email
        FROM bookings b
        JOIN flights f ON b.flight_id = f.id
        JOIN airports a_from ON f.from_airport_id = a_from.id
        JOIN airports a_to ON f.to_airport_id = a_to.id
        JOIN users u ON b.user_id = u.id
        LEFT JOIN payments p ON b.id = p.booking_id
        WHERE ${condition}`,
        [param]
      );

      if (bookingRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Booking not found.' });
      }

      const booking = bookingRows[0];

      // Fetch passenger and boarding details
      const [passengers] = await pool.query(
        `SELECT bp.*, bd.check_in_status, bd.boarding_status, bd.gate, bd.boarding_group, bd.boarding_time
        FROM booking_passengers bp
        LEFT JOIN boarding bd ON bp.id = bd.passenger_id
        WHERE bp.booking_id = ?`,
        [booking.id]
      );

      booking.passengers = passengers;

      return res.json({ success: true, booking });
    } else {
      let b = null;
      if (isNaN(identifier)) {
        b = memoryDB.bookings.find(item => item.pnr.toUpperCase() === identifier.toUpperCase());
      } else {
        b = memoryDB.bookings.find(item => item.id === parseInt(identifier, 10));
      }

      if (!b) {
        return res.status(404).json({ success: false, message: 'Booking not found.' });
      }

      const flight = memoryDB.flights.find(f => f.id === b.flight_id) || {};
      const a_from = memoryDB.airports.find(a => a.id === flight.from_airport_id) || {};
      const a_to = memoryDB.airports.find(a => a.id === flight.to_airport_id) || {};
      const u = memoryDB.users.find(usr => usr.id === b.user_id) || {};
      const p = memoryDB.payments.find(pay => pay.booking_id === b.id) || {};

      const passengers = memoryDB.booking_passengers
        .filter(bp => bp.booking_id === b.id)
        .map(bp => {
          const bd = memoryDB.boarding.find(brd => brd.passenger_id === bp.id) || {};
          return {
            ...bp,
            check_in_status: bd.check_in_status || 'NOT_CHECKED_IN',
            boarding_status: bd.boarding_status || 'NOT_CHECKED_IN',
            gate: bd.gate || 'Gate 3B',
            boarding_group: bd.boarding_group || 'Group 2',
            boarding_time: bd.boarding_time || flight.departure_time
          };
        });

      const bookingDetails = {
        ...b,
        flight_number: flight.flight_number,
        airline: flight.airline,
        departure_time: flight.departure_time,
        arrival_time: flight.arrival_time,
        duration: flight.duration,
        from_code: a_from.airport_code,
        from_name: a_from.airport_name,
        from_city: a_from.city,
        to_code: a_to.airport_code,
        to_name: a_to.airport_name,
        to_city: a_to.city,
        transaction_id: p.transaction_id,
        payment_method: p.payment_method,
        payment_date: p.payment_date,
        booked_by_name: u.name,
        booked_by_email: u.email,
        passengers
      };

      return res.json({ success: true, booking: bookingDetails });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Cancel Booking (Releases Seats, Updates Status, Refunds Payment)
 */
async function cancelBooking(req, res, next) {
  try {
    const bookingId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (isConnectedToMySQL() && pool) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        const [bookingRows] = await connection.query('SELECT * FROM bookings WHERE id = ? FOR UPDATE', [bookingId]);
        if (bookingRows.length === 0) {
          await connection.rollback();
          return res.status(404).json({ success: false, message: 'Booking not found.' });
        }

        const booking = bookingRows[0];
        if (!isAdmin && booking.user_id !== userId) {
          await connection.rollback();
          return res.status(403).json({ success: false, message: 'Unauthorized to cancel this booking.' });
        }

        if (booking.booking_status === 'CANCELLED') {
          await connection.rollback();
          return res.status(400).json({ success: false, message: 'This booking is already cancelled.' });
        }

        // Fetch seat IDs for this booking
        const [bpRows] = await connection.query('SELECT seat_id FROM booking_passengers WHERE booking_id = ?', [bookingId]);
        const seatIds = bpRows.map(bp => bp.seat_id);

        // 1. Release the seats (mark is_occupied = FALSE)
        if (seatIds.length > 0) {
          await connection.query('UPDATE seats SET is_occupied = FALSE WHERE id IN (?)', [seatIds]);
        }

        // 2. Restore flight available seats count
        await connection.query('UPDATE flights SET available_seats = available_seats + ? WHERE id = ?', [
          seatIds.length,
          booking.flight_id
        ]);

        // 3. Update booking status
        await connection.query(
          "UPDATE bookings SET booking_status = 'CANCELLED', payment_status = 'REFUNDED' WHERE id = ?",
          [bookingId]
        );

        // 4. Update payment status to REFUNDED
        await connection.query("UPDATE payments SET payment_status = 'REFUNDED' WHERE booking_id = ?", [bookingId]);

        // 5. Invalidate PNR record
        await connection.query('UPDATE pnr_records SET is_active = FALSE WHERE booking_id = ?', [bookingId]);

        // 6. Update boarding records
        await connection.query(
          "UPDATE boarding SET boarding_status = 'NOT_CHECKED_IN', check_in_status = 'NOT_CHECKED_IN' WHERE booking_id = ?",
          [bookingId]
        );

        await connection.commit();

        return res.json({
          success: true,
          message: 'Booking cancelled successfully. Allocated seats have been released and refund initiated.'
        });
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    } else {
      const b = memoryDB.bookings.find(item => item.id === bookingId);
      if (!b) return res.status(404).json({ success: false, message: 'Booking not found.' });

      if (!isAdmin && b.user_id !== userId) {
        return res.status(403).json({ success: false, message: 'Unauthorized to cancel this booking.' });
      }

      if (b.booking_status === 'CANCELLED') {
        return res.status(400).json({ success: false, message: 'This booking is already cancelled.' });
      }

      // Release seats
      const bps = memoryDB.booking_passengers.filter(bp => bp.booking_id === bookingId);
      bps.forEach(bp => {
        const s = memoryDB.seats.find(seat => seat.id === bp.seat_id || (seat.flight_id === b.flight_id && seat.seat_number === bp.seat_number));
        if (s) s.is_occupied = false;
      });

      const flight = memoryDB.flights.find(f => f.id === b.flight_id);
      if (flight) {
        flight.available_seats += bps.length;
      }

      b.booking_status = 'CANCELLED';
      b.payment_status = 'REFUNDED';

      const p = memoryDB.payments.find(pay => pay.booking_id === bookingId);
      if (p) p.payment_status = 'REFUNDED';

      const pnrRec = memoryDB.pnr_records.find(rec => rec.booking_id === bookingId);
      if (pnrRec) pnrRec.is_active = false;

      return res.json({
        success: true,
        message: 'Booking cancelled successfully. Allocated seats have been released and refund initiated.'
      });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Get all bookings across the system
 */
async function getAllBookings(req, res, next) {
  try {
    const { status, pnr, flightNumber } = req.query;

    if (isConnectedToMySQL() && pool) {
      let query = `
        SELECT 
          b.*,
          f.flight_number,
          f.departure_time,
          a_from.airport_code AS from_code,
          a_from.city AS from_city,
          a_to.airport_code AS to_code,
          a_to.city AS to_city,
          u.name AS passenger_name,
          u.email AS passenger_email,
          GROUP_CONCAT(bp.seat_number SEPARATOR ', ') AS seats,
          p.payment_method
        FROM bookings b
        JOIN flights f ON b.flight_id = f.id
        JOIN airports a_from ON f.from_airport_id = a_from.id
        JOIN airports a_to ON f.to_airport_id = a_to.id
        JOIN users u ON b.user_id = u.id
        LEFT JOIN booking_passengers bp ON b.id = bp.booking_id
        LEFT JOIN payments p ON b.id = p.booking_id
        WHERE 1=1
      `;
      const params = [];

      if (status) {
        query += ` AND b.booking_status = ?`;
        params.push(status);
      }
      if (pnr) {
        query += ` AND b.pnr LIKE ?`;
        params.push(`%${pnr}%`);
      }
      if (flightNumber) {
        query += ` AND f.flight_number = ?`;
        params.push(flightNumber.toUpperCase());
      }

      query += ` GROUP BY b.id ORDER BY b.booking_date DESC`;

      const [rows] = await pool.query(query, params);
      return res.json({ success: true, count: rows.length, bookings: rows });
    } else {
      let results = memoryDB.bookings.map(b => {
        const flight = memoryDB.flights.find(f => f.id === b.flight_id) || {};
        const a_from = memoryDB.airports.find(a => a.id === flight.from_airport_id) || {};
        const a_to = memoryDB.airports.find(a => a.id === flight.to_airport_id) || {};
        const u = memoryDB.users.find(usr => usr.id === b.user_id) || {};
        const bps = memoryDB.booking_passengers.filter(bp => bp.booking_id === b.id);
        const p = memoryDB.payments.find(pay => pay.booking_id === b.id) || {};

        return {
          ...b,
          flight_number: flight.flight_number || 'AI000',
          departure_time: flight.departure_time,
          from_code: a_from.airport_code,
          from_city: a_from.city,
          to_code: a_to.airport_code,
          to_city: a_to.city,
          passenger_name: u.name,
          passenger_email: u.email,
          seats: bps.map(bp => bp.seat_number).join(', '),
          payment_method: p.payment_method || 'Credit Card'
        };
      });

      if (status) results = results.filter(b => b.booking_status === status);
      if (pnr) results = results.filter(b => b.pnr.toLowerCase().includes(pnr.toLowerCase()));
      if (flightNumber) results = results.filter(b => b.flight_number.toLowerCase() === flightNumber.toLowerCase());

      results.sort((a, b) => new Date(b.booking_date) - new Date(a.booking_date));

      return res.json({ success: true, count: results.length, bookings: results });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Update booking status
 */
async function updateBookingStatus(req, res, next) {
  try {
    const bookingId = parseInt(req.params.id, 10);
    const { booking_status, payment_status } = req.body;

    if (isConnectedToMySQL() && pool) {
      await pool.query(
        'UPDATE bookings SET booking_status = COALESCE(?, booking_status), payment_status = COALESCE(?, payment_status) WHERE id = ?',
        [booking_status, payment_status, bookingId]
      );
    } else {
      const b = memoryDB.bookings.find(item => item.id === bookingId);
      if (b) {
        if (booking_status) b.booking_status = booking_status;
        if (payment_status) b.payment_status = payment_status;
      }
    }

    res.json({ success: true, message: 'Booking status updated successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  getAllBookings,
  updateBookingStatus
};
