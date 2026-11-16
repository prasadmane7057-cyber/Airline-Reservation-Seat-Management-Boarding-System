const { supabase } = require('../lib/supabaseClient');
const {
  throwIfError,
  flightSelect,
  enrichFlightDetails,
  normalizeFlight
} = require('../lib/query');

async function getFlights(req, res, next) {
  try {
    const { from, to, date, maxPrice, status } = req.query;
    if (from !== undefined || date !== undefined || maxPrice !== undefined) {
      return res.status(400).json({
        success: false,
        message: 'The current flight schema does not support origin, departure-date, or fare filtering.'
      });
    }
    if ((to !== undefined && typeof to !== 'string') ||
        (status !== undefined && typeof status !== 'string')) {
      return res.status(400).json({
        success: false,
        message: 'Flight destination and status filters must be single strings.'
      });
    }

    const query = supabase.from('flights').select(flightSelect());
    const flights = await enrichFlightDetails(supabase, throwIfError(await query));
    const normalized = flights
      .filter(flight => !status || flight.status === status)
      .filter(flight => !to || flight.destination?.toLowerCase() === to.toLowerCase())
      .map(normalizeFlight);
    return res.json({ success: true, count: normalized.length, flights: normalized });
  } catch (err) {
    next(err);
  }
}

async function getFlightById(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'A valid flight ID is required.' });
    }
    const { data, error } = await supabase
      .from('flights')
      .select(flightSelect())
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    const [flight] = await enrichFlightDetails(supabase, data);
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Flight not found.' });
    }
    return res.json({ success: true, flight: normalizeFlight(flight) });
  } catch (err) {
    next(err);
  }
}

async function createFlight(req, res, next) {
  try {
    const allowed = new Set(['flight_number', 'destination', 'status']);
    if (Object.keys(req.body).some(key => !allowed.has(key))) {
      return res.status(400).json({
        success: false,
        message: 'The current flight schema supports only flight_number, destination, and status.'
      });
    }
    const flightNumber = req.body.flight_number;
    const destination = req.body.destination;
    if (typeof flightNumber !== 'string' || !flightNumber.trim()
        || typeof destination !== 'string' || !destination.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Flight number and destination are required.'
      });
    }
    if (req.body.status !== undefined
        && (typeof req.body.status !== 'string' || !req.body.status.trim())) {
      return res.status(400).json({ success: false, message: 'Flight status must be a non-empty string.' });
    }

    const values = {
      flight_number: flightNumber.trim().toUpperCase(),
      destination: destination.trim()
    };
    if (req.body.status !== undefined) values.status = req.body.status.trim();
    const flight = throwIfError(await req.supabase.from('flights').insert(values)
      .select('id, flight_number, destination, status, created_at').single());
    return res.status(201).json({
      success: true,
      message: 'Flight created using fields supported by the current schema.',
      flight
    });
  } catch (err) {
    next(err);
  }
}

async function updateFlight(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'A valid flight ID is required.' });
    }
    const allowed = new Set(['flight_number', 'destination', 'status']);
    if (Object.keys(req.body).some(key => !allowed.has(key))) {
      return res.status(400).json({
        success: false,
        message: 'The current flight schema supports only flight_number, destination, and status.'
      });
    }
    const updates = { ...req.body };
    if (!Object.keys(updates).length) {
      return res.status(400).json({ success: false, message: 'Provide supported flight fields to update.' });
    }
    for (const [field, value] of Object.entries(updates)) {
      if (typeof value !== 'string' || !value.trim()) {
        return res.status(400).json({ success: false, message: `${field} must be a non-empty string.` });
      }
      updates[field] = field === 'flight_number' ? value.trim().toUpperCase() : value.trim();
    }
    const { data, error } = await req.supabase
      .from('flights')
      .update(updates)
      .eq('id', id)
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
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'A valid flight ID is required.' });
    }
    const { data, error } = await req.supabase
      .from('flights')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();
    if (error?.code === '23503') {
      return res.status(409).json({
        success: false,
        message: 'Flight cannot be deleted while reservation records reference it.'
      });
    }
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
