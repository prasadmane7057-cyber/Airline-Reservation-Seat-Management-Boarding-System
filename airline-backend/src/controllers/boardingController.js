const { bookingSelect } = require('../lib/query');

const VALID_TRANSITIONS = {
  NOT_CHECKED_IN: ['CHECKED_IN'],
  CHECKED_IN: ['BOARDING', 'NOT_CHECKED_IN'],
  BOARDING: ['BOARDED', 'CHECKED_IN'],
  BOARDED: ['BOARDING']
};

function createPass(booking, passenger) {
  const boarding = Array.isArray(passenger.boarding)
    ? passenger.boarding[0] || {}
    : passenger.boarding || {};
  const flight = booking.flight;
  const from = flight.from_airport || {};
  const to = flight.to_airport || {};
  const pass = {
    boarding_id: boarding.id,
    gate: boarding.gate || 'Gate 3B',
    boarding_group: boarding.boarding_group || 'Group 2',
    boarding_time: boarding.boarding_time || flight.departure_time,
    check_in_status: boarding.check_in_status || 'NOT_CHECKED_IN',
    boarding_status: boarding.boarding_status || 'NOT_CHECKED_IN',
    booking_id: booking.id,
    pnr: booking.pnr,
    travel_class: booking.travel_class,
    passenger_id: passenger.id,
    passenger_name: passenger.full_name,
    gender: passenger.gender,
    age: passenger.age,
    seat_number: passenger.seat_number,
    flight_number: flight.flight_number,
    airline: flight.airline,
    departure_time: flight.departure_time,
    arrival_time: flight.arrival_time,
    from_code: from.airport_code,
    from_name: from.airport_name,
    from_city: from.city,
    to_code: to.airport_code,
    to_name: to.airport_name,
    to_city: to.city
  };
  pass.qrPayload = `AEROPASS:${pass.pnr}|PAX:${pass.passenger_name.replace(/\s+/g, '_')}|FLT:${pass.flight_number}|SEAT:${pass.seat_number}|GATE:${pass.gate}|CLASS:${pass.travel_class}`;
  return pass;
}

async function getBoardingByFlight(req, res, next) {
  try {
    const { data: bookings, error } = await req.supabase
      .from('bookings')
      .select(bookingSelect())
      .eq('flight_id', req.params.flightId)
      .neq('booking_status', 'CANCELLED');
    if (error) throw error;

    const manifest = bookings.flatMap(booking =>
      (booking.passengers || []).map(passenger => {
        const detail = createPass(booking, passenger);
        return {
          boarding_id: detail.boarding_id,
          booking_id: detail.booking_id,
          seat_number: detail.seat_number,
          gate: detail.gate,
          boarding_group: detail.boarding_group,
          boarding_time: detail.boarding_time,
          check_in_status: detail.check_in_status,
          boarding_status: detail.boarding_status,
          pnr: detail.pnr,
          passenger_name: detail.passenger_name,
          gender: detail.gender,
          age: detail.age,
          travel_class: detail.travel_class,
          flight_number: detail.flight_number,
          departure_time: detail.departure_time,
          from_code: detail.from_code,
          to_code: detail.to_code
        };
      })
    ).sort((a, b) => a.seat_number.localeCompare(b.seat_number, undefined, { numeric: true }));
    return res.json({ success: true, count: manifest.length, manifest });
  } catch (err) {
    next(err);
  }
}

async function getBoardingPass(req, res, next) {
  try {
    let query = req.supabase
      .from('bookings')
      .select(bookingSelect())
      .neq('booking_status', 'CANCELLED');
    if (/^\d+$/.test(req.params.identifier)) query = query.eq('id', req.params.identifier);
    else query = query.eq('pnr', req.params.identifier.toUpperCase());
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Active boarding pass not found for this booking reference.'
      });
    }

    const passes = (data.passengers || []).map(passenger => createPass(data, passenger));
    return res.json({ success: true, count: passes.length, boardingPasses: passes });
  } catch (err) {
    next(err);
  }
}

async function updateBoardingStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!VALID_TRANSITIONS[status] && status !== 'NOT_CHECKED_IN') {
      return res.status(400).json({ success: false, message: 'Invalid boarding status.' });
    }
    const { data: current, error: lookupError } = await req.supabase
      .from('boarding')
      .select('id, boarding_status')
      .eq('id', req.params.id)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!current) return res.status(404).json({ success: false, message: 'Boarding record not found.' });

    const allowed = VALID_TRANSITIONS[current.boarding_status] || [];
    if (!allowed.includes(status) && current.boarding_status !== status) {
      return res.status(400).json({
        success: false,
        message: `Invalid state transition from '${current.boarding_status}' to '${status}'.`
      });
    }
    const { error } = await req.supabase
      .from('boarding')
      .update({
        boarding_status: status,
        check_in_status: status === 'NOT_CHECKED_IN' ? 'NOT_CHECKED_IN' : 'CHECKED_IN',
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id);
    if (error) throw error;
    return res.json({
      success: true,
      message: `Boarding status successfully updated to '${status}'.`,
      boardingId: Number(req.params.id),
      newStatus: status
    });
  } catch (err) {
    next(err);
  }
}

async function selfCheckIn(req, res, next) {
  try {
    const { pnr } = req.body;
    if (!pnr?.trim()) {
      return res.status(400).json({ success: false, message: 'PNR reference code is required.' });
    }
    const { error } = await req.supabase.rpc('self_checkin_airline_booking', {
      p_pnr: pnr.trim().toUpperCase()
    });
    if (error) {
      if (error.code === 'P0001') {
        return res.status(error.message.includes('not found') ? 404 : 400)
          .json({ success: false, message: error.message });
      }
      throw error;
    }
    return res.json({
      success: true,
      message: 'Check-in completed successfully! Boarding pass is now ready.'
    });
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
