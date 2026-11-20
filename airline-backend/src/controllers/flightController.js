const flightStore = require('../utils/flightStore');
const airportStore = require('../utils/airportStore');
const { supabase } = require('../lib/supabaseClient');

async function getFlights(req, res, next) {
  try {
    const { from, to, date, maxPrice, status } = req.query;
    let flights = flightStore.getAllFlights();

    if (from && typeof from === 'string' && from.trim()) {
      const q = from.trim().toLowerCase();
      flights = flights.filter(f =>
        (f.from_code && f.from_code.toLowerCase().includes(q)) ||
        (f.from_city && f.from_city.toLowerCase().includes(q)) ||
        (f.from_name && f.from_name.toLowerCase().includes(q))
      );
    }

    if (to && typeof to === 'string' && to.trim()) {
      const q = to.trim().toLowerCase();
      flights = flights.filter(f =>
        (f.to_code && f.to_code.toLowerCase().includes(q)) ||
        (f.to_city && f.to_city.toLowerCase().includes(q)) ||
        (f.destination && f.destination.toLowerCase().includes(q)) ||
        (f.to_name && f.to_name.toLowerCase().includes(q))
      );
    }

    if (status && typeof status === 'string' && status.trim()) {
      const q = status.trim().toLowerCase();
      flights = flights.filter(f => f.status && f.status.toLowerCase() === q);
    }

    if (maxPrice && !isNaN(Number(maxPrice))) {
      const p = Number(maxPrice);
      flights = flights.filter(f => (f.economy_fare || 0) <= p);
    }

    return res.json({ success: true, count: flights.length, flights });
  } catch (err) {
    next(err);
  }
}

async function getFlightById(req, res, next) {
  try {
    const id = req.params.id;
    const flight = flightStore.getFlightById(id);
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Flight not found.' });
    }
    return res.json({ success: true, flight });
  } catch (err) {
    next(err);
  }
}

async function createFlight(req, res, next) {
  try {
    const { flight_number, destination, to_city } = req.body;
    if (!flight_number || (!destination && !to_city)) {
      return res.status(400).json({
        success: false,
        message: 'Flight number and destination are required.'
      });
    }

    const newFlight = flightStore.createFlight(req.body);

    // Optional background sync with Supabase
    try {
      if (supabase) {
        await supabase.from('flights').insert({
          flight_number: newFlight.flight_number,
          destination: newFlight.destination,
          status: newFlight.status
        });
      }
    } catch (e) {
      console.warn('[SUPABASE_SYNC] Flight insert notice:', e.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Flight created successfully.',
      flight: newFlight
    });
  } catch (err) {
    next(err);
  }
}

async function updateFlight(req, res, next) {
  try {
    const id = req.params.id;
    const updated = flightStore.updateFlight(id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Flight not found.' });
    }

    // Optional background sync with Supabase
    try {
      if (supabase && (req.body.status || req.body.destination || req.body.flight_number)) {
        const updates = {};
        if (req.body.status) updates.status = req.body.status;
        if (req.body.destination) updates.destination = req.body.destination;
        if (req.body.flight_number) updates.flight_number = req.body.flight_number;
        await supabase.from('flights').update(updates).eq('id', Number(id));
      }
    } catch (e) {
      console.warn('[SUPABASE_SYNC] Flight update notice:', e.message);
    }

    return res.json({
      success: true,
      message: 'Flight updated successfully.',
      flight: updated
    });
  } catch (err) {
    next(err);
  }
}

async function deleteFlight(req, res, next) {
  try {
    const id = req.params.id;
    const deleted = flightStore.deleteFlight(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Flight not found.' });
    }

    // Optional background sync with Supabase
    try {
      if (supabase) {
        await supabase.from('flights').delete().eq('id', Number(id));
      }
    } catch (e) {
      console.warn('[SUPABASE_SYNC] Flight delete notice:', e.message);
    }

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
