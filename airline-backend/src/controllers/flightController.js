const { supabase } = require('../lib/supabaseClient');
const { throwIfError, flightSelect, normalizeFlight } = require('../lib/query');

async function getFlights(req, res, next) {
  try {
    const { from, to, date, travelClass = 'Economy', sortBy = 'departure', maxPrice, status } = req.query;
    let query = supabase.from('flights').select(flightSelect());

    if (from) query = query.eq('from_airport.airport_code', from.toUpperCase());
    if (to) query = query.eq('to_airport.airport_code', to.toUpperCase());
    if (date) {
      const start = new Date(`${date.split('T')[0]}T00:00:00.000Z`);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);
      query = query.gte('departure_time', start.toISOString()).lt('departure_time', end.toISOString());
    }
    if (status) query = query.eq('status', status);
    if (maxPrice) {
      const priceColumn = travelClass === 'Business'
        ? 'business_fare'
        : travelClass === 'First Class' ? 'first_class_fare' : 'economy_fare';
      query = query.lte(priceColumn, Number(maxPrice));
    }
    query = query.order(sortBy === 'price_asc' || sortBy === 'price_desc' ? 'economy_fare' : 'departure_time', {
      ascending: sortBy !== 'price_desc'
    });

    const flights = throwIfError(await query);
    const normalized = flights
      .filter(flight => flight.departure_time && flight.arrival_time)
      .map(normalizeFlight);
    return res.json({ success: true, count: normalized.length, flights: normalized });
  } catch (err) {
    next(err);
  }
}

async function getFlightById(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('flights')
      .select(flightSelect())
      .eq('id', req.params.id)
      .maybeSingle();
    if (error) throw error;
    if (!data || !data.departure_time) {
      return res.status(404).json({ success: false, message: 'Flight not found.' });
    }
    return res.json({ success: true, flight: normalizeFlight(data) });
  } catch (err) {
    next(err);
  }
}

async function createFlight(req, res, next) {
  try {
    const {
      flight_number,
      airline = 'SkyWings Airlines',
      aircraft_id,
      from_airport_id,
      to_airport_id,
      departure_time,
      arrival_time,
      duration = '2h 00m',
      economy_fare = 4500,
      business_fare,
      first_class_fare,
      total_seats = 116,
      status = 'SCHEDULED'
    } = req.body;

    if (!flight_number || !aircraft_id || !from_airport_id || !to_airport_id || !departure_time || !arrival_time) {
      return res.status(400).json({
        success: false,
        message: 'Flight number, aircraft, origin, destination, and timings are required.'
      });
    }
    if (String(from_airport_id) === String(to_airport_id)) {
      return res.status(400).json({
        success: false,
        message: 'Origin and destination airports cannot be the same.'
      });
    }

    const flight = throwIfError(await req.supabase.from('flights').insert({
      flight_number: flight_number.toUpperCase().trim(),
      airline,
      aircraft_id,
      from_airport_id,
      to_airport_id,
      departure_time,
      arrival_time,
      duration,
      economy_fare,
      business_fare: business_fare ?? Number(economy_fare) * 2.5,
      first_class_fare: first_class_fare ?? Number(economy_fare) * 4.5,
      total_seats,
      available_seats: total_seats,
      status
    }).select('id').single());
    throwIfError(await req.supabase.rpc('ensure_flight_seats', { p_flight_id: flight.id }));
    return res.status(201).json({
      success: true,
      message: 'Flight created successfully with configured seat map.',
      flightId: flight.id
    });
  } catch (err) {
    next(err);
  }
}

async function updateFlight(req, res, next) {
  try {
    const allowed = [
      'flight_number', 'airline', 'aircraft_id', 'from_airport_id', 'to_airport_id',
      'departure_time', 'arrival_time', 'duration', 'economy_fare', 'business_fare',
      'first_class_fare', 'total_seats', 'available_seats', 'status'
    ];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key, value]) => allowed.includes(key) && value !== undefined)
    );
    if (updates.flight_number) updates.flight_number = updates.flight_number.toUpperCase().trim();
    const { data, error } = await req.supabase
      .from('flights')
      .update(updates)
      .eq('id', req.params.id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: 'Flight not found.' });
    return res.json({ success: true, message: 'Flight updated successfully.' });
  } catch (err) {
    next(err);
  }
}

async function deleteFlight(req, res, next) {
  try {
    const { data, error } = await req.supabase
      .from('flights')
      .delete()
      .eq('id', req.params.id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: 'Flight not found.' });
    return res.json({ success: true, message: 'Flight removed successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getFlights,
  getFlightById,
  createFlight,
  updateFlight,
  deleteFlight
};
