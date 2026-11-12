const { supabase } = require('../lib/supabaseClient');

async function getSeatsByFlight(req, res, next) {
  try {
    const client = req.supabase || supabase;
    const flightId = Number(req.params.flightId);
    if (!Number.isSafeInteger(flightId) || flightId <= 0) {
      return res.status(400).json({ success: false, message: 'A valid flight ID is required.' });
    }

    const { error: ensureError } = await client.rpc('ensure_flight_seats', {
      p_flight_id: flightId
    });
    if (ensureError) throw ensureError;

    const { data, error } = await client
      .from('seats')
      .select('*')
      .eq('flight_id', flightId)
      .order('row_number')
      .order('column_letter');
    if (error) throw error;
    return res.json({ success: true, count: data.length, seats: data });
  } catch (err) {
    next(err);
  }
}

async function updateSeatStatus(req, res, next) {
  try {
    const updates = {};
    for (const key of ['is_occupied', 'is_blocked']) {
      if (req.body[key] !== undefined) {
        if (typeof req.body[key] !== 'boolean') {
          return res.status(400).json({ success: false, message: `${key} must be a boolean.` });
        }
        updates[key] = req.body[key];
      }
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'Provide a seat status to update.' });
    }

    const { data, error } = await req.supabase
      .from('seats')
      .update(updates)
      .eq('id', req.params.id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: 'Seat not found.' });
    return res.json({ success: true, message: 'Seat status updated.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSeatsByFlight,
  updateSeatStatus
};
