const { supabase } = require('../lib/supabaseClient');

const VALID_CLASSES = new Set(['Economy', 'Business', 'First Class']);
const SEAT_COLUMNS = 'id, flight_id, seat_number, seat_class, seat_status, created_at';

function validId(value) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0;
}

function rpcErrorResponse(error, res) {
  if (error.code !== 'P0001') return false;
  const message = error.message || 'Seat operation could not be completed.';
  const status = /administrator privileges|not authorized/i.test(message)
    ? 403
    : /not found/i.test(message)
      ? 404
      : 409;
  res.status(status).json({ success: false, message });
  return true;
}

async function getSeats(req, res, next, status) {
  try {
    const client = req.supabase || supabase;
    const flightId = Number(req.params.flightId);
    if (!Number.isSafeInteger(flightId) || flightId <= 0) {
      return res.status(400).json({ success: false, message: 'A valid flight ID is required.' });
    }

    let query = client
      .from('seats')
      .select(SEAT_COLUMNS)
      .eq('flight_id', flightId)
      .order('seat_number');
    if (status) query = query.eq('seat_status', status);
    const { data, error } = await query;
    if (error) throw error;
    const seats = (data || []).map(seat => ({
      ...seat,
      is_occupied: seat.seat_status === 'BOOKED',
      is_blocked: seat.seat_status === 'BLOCKED'
    }));
    return res.json({ success: true, count: seats.length, seats });
  } catch (err) {
    next(err);
  }
}

function getSeatsByFlight(req, res, next) {
  return getSeats(req, res, next, null);
}

function getAvailableSeats(req, res, next) {
  return getSeats(req, res, next, 'AVAILABLE');
}

function getBookedSeats(req, res, next) {
  return getSeats(req, res, next, 'BOOKED');
}

async function createSeat(req, res, next) {
  try {
    const { flightId, seatNumber, seatClass } = req.body;
    if (!validId(flightId)) {
      return res.status(400).json({ success: false, message: 'A valid flight ID is required.' });
    }
    if (typeof seatNumber !== 'string' || !/^[0-9]{1,3}[A-Za-z]{1,2}$/.test(seatNumber.trim())) {
      return res.status(400).json({ success: false, message: 'Seat number must use a valid row and letter format.' });
    }
    if (!VALID_CLASSES.has(seatClass)) {
      return res.status(400).json({ success: false, message: 'Seat class must be Economy, Business, or First Class.' });
    }

    const { data: flight, error: flightError } = await req.supabase
      .from('flights')
      .select('id')
      .eq('id', Number(flightId))
      .maybeSingle();
    if (flightError) throw flightError;
    if (!flight) return res.status(404).json({ success: false, message: 'Flight not found.' });

    const { data, error } = await req.supabase
      .from('seats')
      .insert({
        flight_id: Number(flightId),
        seat_number: seatNumber.trim().toUpperCase(),
        seat_class: seatClass
      })
      .select(SEAT_COLUMNS)
      .single();
    if (error?.code === '23505') {
      return res.status(409).json({ success: false, message: 'That seat already exists for this flight.' });
    }
    if (error) throw error;
    return res.status(201).json({ success: true, seat: data });
  } catch (err) {
    next(err);
  }
}

async function releaseSeat(req, res, next) {
  try {
    const { bookingId } = req.body;
    if (!validId(req.params.id) || !validId(bookingId)) {
      return res.status(400).json({ success: false, message: 'Valid seat and booking IDs are required.' });
    }
    const { data: booking, error: lookupError } = await req.supabase
      .from('bookings')
      .select('id, seat_id')
      .eq('id', Number(bookingId))
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (Number(booking.seat_id) !== Number(req.params.id)) {
      return res.status(400).json({ success: false, message: 'The booking does not own this seat.' });
    }

    const { data, error } = await req.supabase.rpc('cancel_airline_booking', {
      p_booking_id: booking.id
    });
    if (error) {
      if (rpcErrorResponse(error, res)) return;
      throw error;
    }
    return res.json({
      success: true,
      message: 'Booking cancelled and seat released.',
      booking: Array.isArray(data) ? data[0] : data
    });
  } catch (err) {
    next(err);
  }
}

async function updateSeatStatus(req, res, next) {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'A valid seat ID is required.' });
    }
    if (req.body.is_occupied !== undefined) {
      return res.status(400).json({
        success: false,
        message: 'Booked status is managed by booking and cancellation operations.'
      });
    }

    let status = req.body.seat_status;
    if (req.body.is_blocked !== undefined) {
      if (typeof req.body.is_blocked !== 'boolean') {
        return res.status(400).json({ success: false, message: 'is_blocked must be a boolean.' });
      }
      status = req.body.is_blocked ? 'BLOCKED' : 'AVAILABLE';
    }
    if (!['AVAILABLE', 'BLOCKED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Seat status may only be set to AVAILABLE or BLOCKED.'
      });
    }

    const { data, error } = await req.supabase.rpc('set_airline_seat_blocked', {
      p_seat_id: Number(req.params.id),
      p_blocked: status === 'BLOCKED'
    });
    if (error) {
      if (rpcErrorResponse(error, res)) return;
      throw error;
    }
    return res.json({ success: true, seat: Array.isArray(data) ? data[0] : data });
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
