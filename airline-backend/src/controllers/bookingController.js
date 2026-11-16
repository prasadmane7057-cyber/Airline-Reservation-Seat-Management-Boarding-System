const VALID_STATUSES = new Set(['CONFIRMED', 'WAITLISTED', 'CANCELLED', 'BOARDED']);
const VALID_CLASSES = new Set(['Economy', 'Business', 'First Class']);
const BOOKING_LIMIT = 100;

function isPositiveId(value) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0;
}

function rpcErrorResponse(error, res) {
  if (error.code === 'P0001') {
    const message = error.message || 'Booking operation could not be completed.';
    const status = /not authorized|administrator privileges/i.test(message)
      ? 403
      : /not found/i.test(message)
        ? 404
        : 409;
    res.status(status).json({ success: false, message });
    return true;
  }
  if (error.code === '23505') {
    res.status(409).json({ success: false, message: 'A conflicting active booking already exists.' });
    return true;
  }
  return false;
}

async function enrichBookings(client, bookings) {
  if (!bookings.length) return [];
  const passengerIds = [...new Set(bookings.map(booking => booking.passenger_id))];
  const flightIds = [...new Set(bookings.map(booking => booking.flight_id))];
  const seatIds = [...new Set(bookings.map(booking => booking.seat_id))];

  const [passengerResult, flightResult, seatResult] = await Promise.all([
    client.from('passengers')
      .select('id, user_id, full_name, email, phone, created_at')
      .in('id', passengerIds),
    client.from('flights')
      .select('id, flight_number, destination, status, created_at')
      .in('id', flightIds),
    client.from('seats')
      .select('id, flight_id, seat_number, seat_class, seat_status, created_at')
      .in('id', seatIds)
  ]);
  for (const result of [passengerResult, flightResult, seatResult]) {
    if (result.error) throw result.error;
  }

  const passengers = new Map((passengerResult.data || []).map(row => [String(row.id), row]));
  const flights = new Map((flightResult.data || []).map(row => [String(row.id), row]));
  const seats = new Map((seatResult.data || []).map(row => [String(row.id), row]));

  return bookings.map(booking => {
    const passenger = passengers.get(String(booking.passenger_id)) || null;
    const flight = flights.get(String(booking.flight_id)) || null;
    const seat = seats.get(String(booking.seat_id)) || null;
    return {
      ...booking,
      passenger,
      flight,
      seat,
      passenger_name: passenger?.full_name || null,
      passenger_email: passenger?.email || null,
      flight_number: flight?.flight_number || null,
      destination: flight?.destination || null,
      seat_number: seat?.seat_number || null,
      seat_numbers: seat?.seat_number || '',
      passenger_summary: passenger && seat
        ? `${passenger.full_name} (${seat.seat_number})`
        : passenger?.full_name || ''
    };
  });
}

async function resolvePassengerId(req, requestedId) {
  if (requestedId !== undefined && requestedId !== null && requestedId !== '') {
    if (!isPositiveId(requestedId)) return { error: 'A valid passenger ID is required.' };
    return { id: Number(requestedId) };
  }

  const { data, error } = await req.supabase
    .from('passengers')
    .select('id')
    .eq('user_id', req.user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { error: 'No passenger profile is linked to this account.' };
  return { id: data.id };
}

async function resolveSeat(req, flightId, seatId, passengerSeatNumber) {
  let query = req.supabase
    .from('seats')
    .select('id, flight_id, seat_number, seat_class, seat_status');

  if (seatId !== undefined && seatId !== null && seatId !== '') {
    if (!isPositiveId(seatId)) return { error: 'A valid seat ID is required.' };
    query = query.eq('id', Number(seatId)).eq('flight_id', flightId);
  } else if (passengerSeatNumber?.trim()) {
    query = query.eq('seat_number', passengerSeatNumber.trim().toUpperCase())
      .eq('flight_id', flightId);
  } else {
    return { error: 'A seat ID or seat number is required.' };
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data) return { notFound: true };
  return { seat: data };
}

async function createBooking(req, res, next) {
  try {
    const { flightId, passengerId, seatId, travelClass, passengers } = req.body;
    if (!isPositiveId(flightId)) {
      return res.status(400).json({ success: false, message: 'A valid flight ID is required.' });
    }
    if (Array.isArray(passengers) && passengers.length !== 1) {
      return res.status(400).json({
        success: false,
        message: 'Create one booking per passenger so each passenger receives a unique PNR and seat allocation.'
      });
    }

    const legacyPassenger = Array.isArray(passengers) ? passengers[0] : null;
    if (legacyPassenger && !legacyPassenger.fullName?.trim()) {
      return res.status(400).json({ success: false, message: 'Passenger name is required.' });
    }
    const passenger = await resolvePassengerId(req, passengerId);
    if (passenger.error) {
      return res.status(400).json({ success: false, message: passenger.error });
    }
    const resolvedSeat = await resolveSeat(
      req,
      Number(flightId),
      seatId,
      legacyPassenger?.seatNumber
    );
    if (resolvedSeat.error) {
      return res.status(400).json({ success: false, message: resolvedSeat.error });
    }
    if (resolvedSeat.notFound) {
      return res.status(404).json({ success: false, message: 'Seat not found for this flight.' });
    }

    const selectedClass = travelClass || resolvedSeat.seat.seat_class;
    if (!VALID_CLASSES.has(selectedClass)) {
      return res.status(400).json({ success: false, message: 'Invalid travel class.' });
    }
    if (resolvedSeat.seat.seat_status !== 'AVAILABLE') {
      return res.status(409).json({ success: false, message: 'Seat is not available.' });
    }
    const { data, error } = await req.supabase.rpc('create_airline_booking', {
      p_passenger_id: passenger.id,
      p_flight_id: Number(flightId),
      p_seat_id: resolvedSeat.seat.id,
      p_travel_class: selectedClass
    });
    if (error) {
      if (rpcErrorResponse(error, res)) return;
      throw error;
    }
    const booking = Array.isArray(data) ? data[0] : data;
    const [enrichedBooking] = await enrichBookings(req.supabase, booking ? [booking] : []);
    return res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully.',
      booking: enrichedBooking
    });
  } catch (err) {
    next(err);
  }
}

async function getUserBookings(req, res, next) {
  try {
    const { data, error } = await req.supabase
      .from('bookings')
      .select('*')
      .order('booking_date', { ascending: false })
      .limit(BOOKING_LIMIT);
    if (error) throw error;
    const bookings = await enrichBookings(req.supabase, data || []);
    return res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    next(err);
  }
}

async function getBookingById(req, res, next) {
  try {
    const identifier = (req.params.pnr || req.params.id).trim();
    let query = req.supabase.from('bookings').select('*');
    if (/^\d+$/.test(identifier)) query = query.eq('id', Number(identifier));
    else query = query.eq('pnr', identifier.toUpperCase());
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: 'Booking not found.' });
    const [booking] = await enrichBookings(req.supabase, [data]);
    return res.json({ success: true, booking });
  } catch (err) {
    next(err);
  }
}

async function cancelBooking(req, res, next) {
  try {
    const identifier = req.params.id.trim();
    let query = req.supabase.from('bookings').select('id');
    if (/^\d+$/.test(identifier)) query = query.eq('id', Number(identifier));
    else query = query.eq('pnr', identifier.toUpperCase());
    const { data: existing, error: lookupError } = await query.maybeSingle();
    if (lookupError) throw lookupError;
    if (!existing) return res.status(404).json({ success: false, message: 'Booking not found.' });

    const { data, error } = await req.supabase.rpc('cancel_airline_booking', {
      p_booking_id: existing.id
    });
    if (error) {
      if (rpcErrorResponse(error, res)) return;
      throw error;
    }
    const booking = Array.isArray(data) ? data[0] : data;
    const [enrichedBooking] = await enrichBookings(req.supabase, booking ? [booking] : []);
    return res.json({
      success: true,
      message: 'Booking cancelled and its seat released.',
      booking: enrichedBooking
    });
  } catch (err) {
    next(err);
  }
}

async function getAllBookings(req, res, next) {
  try {
    let query = req.supabase
      .from('bookings')
      .select('*')
      .order('booking_date', { ascending: false })
      .limit(BOOKING_LIMIT);
    if (req.query.status) {
      if (!VALID_STATUSES.has(req.query.status)) {
        return res.status(400).json({ success: false, message: 'Invalid booking status filter.' });
      }
      query = query.eq('booking_status', req.query.status);
    }
    if (req.query.pnr) query = query.eq('pnr', String(req.query.pnr).trim().toUpperCase());
    if (req.query.flightNumber) {
      const { data: flights, error: flightError } = await req.supabase
        .from('flights')
        .select('id')
        .ilike('flight_number', String(req.query.flightNumber).trim());
      if (flightError) throw flightError;
      const flightIds = (flights || []).map(flight => flight.id);
      if (!flightIds.length) return res.json({ success: true, count: 0, bookings: [] });
      query = query.in('flight_id', flightIds);
    }

    const { data, error } = await query;
    if (error) throw error;
    const bookings = await enrichBookings(req.supabase, data || []);
    return res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    next(err);
  }
}

async function updateBookingStatus(req, res, next) {
  try {
    if (!isPositiveId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'A valid booking ID is required.' });
    }
    const status = req.body.booking_status || req.body.status;
    if (!VALID_STATUSES.has(status)) {
      return res.status(400).json({ success: false, message: 'Invalid booking status.' });
    }
    const { data, error } = await req.supabase.rpc('update_airline_booking_status', {
      p_booking_id: Number(req.params.id),
      p_status: status
    });
    if (error) {
      if (rpcErrorResponse(error, res)) return;
      throw error;
    }
    const booking = Array.isArray(data) ? data[0] : data;
    const [enrichedBooking] = await enrichBookings(req.supabase, booking ? [booking] : []);
    return res.json({
      success: true,
      message: `Booking status updated to ${status}.`,
      booking: enrichedBooking
    });
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
  updateBookingStatus,
  enrichBookings
};
