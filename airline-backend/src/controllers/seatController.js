const seatStore = require('../utils/seatStore');

function getSeatsByFlight(req, res, next) {
  try {
    const flightId = req.params.flightId;
    if (!flightId) {
      return res.status(400).json({ success: false, message: 'A valid flight ID is required.' });
    }
    const seats = seatStore.getSeatsByFlight(flightId);
    return res.json({ success: true, count: seats.length, seats });
  } catch (err) {
    next(err);
  }
}

function getAvailableSeats(req, res, next) {
  try {
    const flightId = req.params.flightId;
    if (!flightId) {
      return res.status(400).json({ success: false, message: 'A valid flight ID is required.' });
    }
    const seats = seatStore.getAvailableSeats(flightId);
    return res.json({ success: true, count: seats.length, seats });
  } catch (err) {
    next(err);
  }
}

function getBookedSeats(req, res, next) {
  try {
    const flightId = req.params.flightId;
    if (!flightId) {
      return res.status(400).json({ success: false, message: 'A valid flight ID is required.' });
    }
    const seats = seatStore.getBookedSeats(flightId);
    return res.json({ success: true, count: seats.length, seats });
  } catch (err) {
    next(err);
  }
}

function createSeat(req, res, next) {
  try {
    const { flightId, seatNumber, seatClass } = req.body;
    if (!flightId || !seatNumber) {
      return res.status(400).json({ success: false, message: 'Flight ID and seat number are required.' });
    }
    const seats = seatStore.getSeatsByFlight(flightId);
    const existing = seats.find(s => s.seat_number.toUpperCase() === seatNumber.trim().toUpperCase());
    if (existing) {
      return res.status(409).json({ success: false, message: 'That seat already exists for this flight.' });
    }
    const newSeat = {
      id: Number(flightId) * 1000 + seats.length + 1,
      flight_id: Number(flightId),
      seat_number: seatNumber.trim().toUpperCase(),
      seat_class: seatClass || 'Economy',
      seat_status: 'AVAILABLE',
      is_occupied: false,
      is_blocked: false,
      created_at: new Date().toISOString()
    };
    return res.status(201).json({ success: true, seat: newSeat });
  } catch (err) {
    next(err);
  }
}

function releaseSeat(req, res, next) {
  try {
    const seatId = req.params.id;
    const { flightId, seatNumber } = req.body;
    if (flightId && seatNumber) {
      seatStore.releaseSeat(flightId, seatNumber);
    }
    return res.json({ success: true, message: 'Seat released successfully.' });
  } catch (err) {
    next(err);
  }
}

function updateSeatStatus(req, res, next) {
  try {
    const seatId = req.params.id;
    const { is_blocked, seat_status } = req.body;
    return res.json({
      success: true,
      message: 'Seat status updated successfully.',
      seat: { id: seatId, is_blocked: !!is_blocked, seat_status: seat_status || (is_blocked ? 'BLOCKED' : 'AVAILABLE') }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSeatsByFlight,
  getAvailableSeats,
  getBookedSeats,
  createSeat,
  releaseSeat,
  updateSeatStatus
};
