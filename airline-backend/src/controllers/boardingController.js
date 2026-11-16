function validId(value) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0;
}

function rpcErrorResponse(error, res) {
  if (error.code !== 'P0001') return false;
  const message = error.message || 'Boarding operation could not be completed.';
  const status = /not authorized|administrator privileges/i.test(message)
    ? 403
    : /not found/i.test(message)
      ? 404
      : 409;
  res.status(status).json({ success: false, message });
  return true;
}

async function enrichBooking(client, booking) {
  const [passengerResult, seatResult, flightResult] = await Promise.all([
    client.from('passengers')
      .select('id, full_name, email, phone')
      .eq('id', booking.passenger_id)
      .maybeSingle(),
    client.from('seats')
      .select('id, flight_id, seat_number, seat_class, seat_status')
      .eq('id', booking.seat_id)
      .maybeSingle(),
    client.from('flights')
      .select('id, flight_number, destination, status, created_at')
      .eq('id', booking.flight_id)
      .maybeSingle()
  ]);
  for (const result of [passengerResult, seatResult, flightResult]) {
    if (result.error) throw result.error;
  }
  return {
    ...booking,
    passenger: passengerResult.data,
    seat: seatResult.data,
    flight: flightResult.data
  };
}

function createPass(booking) {
  const passenger = booking.passenger || {};
  const seat = booking.seat || {};
  const flight = booking.flight || {};
  const checkedIn = Boolean(booking.checked_in_at);
  const pass = {
    booking_id: booking.id,
    pnr: booking.pnr,
    booking_status: booking.booking_status,
    passenger_id: passenger.id,
    passenger_name: passenger.full_name || null,
    passenger_email: passenger.email || null,
    seat_id: seat.id,
    seat_number: seat.seat_number || null,
    travel_class: booking.travel_class,
    flight_id: flight.id,
    flight_number: flight.flight_number || null,
    destination: flight.destination || null,
    flight_status: flight.status || null,
    check_in_status: checkedIn ? 'CHECKED_IN' : 'NOT_CHECKED_IN',
    boarding_status: booking.booking_status === 'BOARDED'
      ? 'BOARDED'
      : checkedIn ? 'CHECKED_IN' : 'NOT_CHECKED_IN',
    checked_in_at: booking.checked_in_at || null,
    boarding_time: null,
    gate: null,
    boarding_group: null
  };
  pass.qrPayload = `AIRLINE:${pass.pnr}|PAX:${pass.passenger_name || ''}|FLT:${pass.flight_number || ''}|SEAT:${pass.seat_number || ''}`;
  return pass;
}

async function getBoardingByFlight(req, res, next) {
  try {
    if (!validId(req.params.flightId)) {
      return res.status(400).json({ success: false, message: 'A valid flight ID is required.' });
    }
    const { data, error } = await req.supabase
      .from('bookings')
      .select('*')
      .eq('flight_id', Number(req.params.flightId))
      .in('booking_status', ['CONFIRMED', 'BOARDED'])
      .order('booking_date', { ascending: true })
      .limit(250);
    if (error) throw error;

    const manifest = [];
    for (const booking of data || []) {
      manifest.push(createPass(await enrichBooking(req.supabase, booking)));
    }
    manifest.sort((left, right) => String(left.seat_number || '')
      .localeCompare(String(right.seat_number || ''), undefined, { numeric: true }));
    return res.json({ success: true, count: manifest.length, manifest });
  } catch (err) {
    next(err);
  }
}

async function getBoardingPass(req, res, next) {
  try {
    const identifier = req.params.identifier;
    let query = req.supabase
      .from('bookings')
      .select('*')
      .in('booking_status', ['CONFIRMED', 'BOARDED']);
    if (/^\d+$/.test(identifier)) query = query.eq('id', Number(identifier));
    else query = query.eq('pnr', identifier.toUpperCase());
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'A confirmed booking was not found for this reference.'
      });
    }
    const boardingPass = createPass(await enrichBooking(req.supabase, data));
    return res.json({ success: true, boardingPass });
  } catch (err) {
    next(err);
  }
}

async function verifyBoarding(req, res, next) {
  try {
    const pnr = typeof req.body.pnr === 'string' ? req.body.pnr.trim().toUpperCase() : '';
    const seatNumber = typeof req.body.seatNumber === 'string'
      ? req.body.seatNumber.trim().toUpperCase()
      : '';
    if (!pnr || !seatNumber) {
      return res.status(400).json({ success: false, message: 'PNR and seat number are required.' });
    }

    const { data: booking, error: lookupError } = await req.supabase
      .from('bookings')
      .select('*')
      .eq('pnr', pnr)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    const { data: seat, error: seatError } = await req.supabase
      .from('seats')
      .select('id, seat_number')
      .eq('id', booking.seat_id)
      .eq('flight_id', booking.flight_id)
      .maybeSingle();
    if (seatError) throw seatError;
    if (!seat || seat.seat_number !== seatNumber) {
      return res.status(409).json({ success: false, message: 'PNR and seat allocation do not match.' });
    }

    const { data, error } = await req.supabase.rpc('board_airline_booking', {
      p_pnr: pnr,
      p_seat_id: seat.id
    });
    if (error) {
      if (rpcErrorResponse(error, res)) return;
      throw error;
    }
    const result = Array.isArray(data) ? data[0] : data;
    return res.json({
      success: true,
      message: 'Confirmed booking and seat verified; passenger is boarded.',
      booking: result
    });
  } catch (err) {
    next(err);
  }
}

async function updateBoardingStatus(req, res, next) {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'A valid booking ID is required.' });
    }
    const { status } = req.body;
    if (!['CHECKED_IN', 'BOARDED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be CHECKED_IN or BOARDED.' });
    }

    const { data: booking, error: lookupError } = await req.supabase
      .from('bookings')
      .select('id, pnr, seat_id')
      .eq('id', Number(req.params.id))
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    const { data, error } = status === 'CHECKED_IN'
      ? await req.supabase.rpc('checkin_airline_booking', { p_pnr: booking.pnr })
      : await req.supabase.rpc('board_airline_booking', {
        p_pnr: booking.pnr,
        p_seat_id: booking.seat_id
      });
    if (error) {
      if (rpcErrorResponse(error, res)) return;
      throw error;
    }
    return res.json({
      success: true,
      message: status === 'CHECKED_IN' ? 'Check-in completed.' : 'Passenger boarded.',
      booking: Array.isArray(data) ? data[0] : data
    });
  } catch (err) {
    next(err);
  }
}

async function selfCheckIn(req, res, next) {
  try {
    const pnr = typeof req.body.pnr === 'string' ? req.body.pnr.trim().toUpperCase() : '';
    if (!pnr) {
      return res.status(400).json({ success: false, message: 'PNR reference code is required.' });
    }
    const { data, error } = await req.supabase.rpc('checkin_airline_booking', {
      p_pnr: pnr
    });
    if (error) {
      if (rpcErrorResponse(error, res)) return;
      throw error;
    }
    return res.json({
      success: true,
      message: 'Check-in completed.',
      booking: Array.isArray(data) ? data[0] : data
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getBoardingByFlight,
  getBoardingPass,
  verifyBoarding,
  updateBoardingStatus,
  selfCheckIn
};
