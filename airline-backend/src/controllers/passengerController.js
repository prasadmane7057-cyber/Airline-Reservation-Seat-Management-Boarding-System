function validId(value) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0;
}

function validEmail(value) {
  return typeof value === 'string'
    && value.length <= 320
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function passengerValues(body, allowUserId = false) {
  const values = {};
  const name = body.fullName !== undefined ? body.fullName : body.full_name;
  if (name !== undefined) values.full_name = name;
  if (body.email !== undefined) values.email = body.email;
  if (body.phone !== undefined) values.phone = body.phone;
  if (allowUserId && body.userId !== undefined) values.user_id = body.userId || null;
  return values;
}

function validatePassenger(values, partial) {
  const allowedFields = new Set(['full_name', 'email', 'phone', 'user_id']);
  if (Object.keys(values).some(key => !allowedFields.has(key))) {
    return 'Only full name, email, phone, and user ID can be changed.';
  }
  if (!partial && (!values.full_name || !values.email)) {
    return 'Full name and email are required.';
  }
  if (values.full_name !== undefined
      && (typeof values.full_name !== 'string'
        || !values.full_name.trim()
        || values.full_name.trim().length > 160)) {
    return 'Full name must be between 1 and 160 characters.';
  }
  if (values.email !== undefined && !validEmail(values.email)) {
    return 'A valid email address is required.';
  }
  if (values.phone !== undefined
      && (typeof values.phone !== 'string' || values.phone.length > 40)) {
    return 'Phone number must be 40 characters or fewer.';
  }
  if (values.user_id !== undefined
      && values.user_id !== null
      && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(values.user_id)) {
    return 'A valid user ID is required.';
  }
  return null;
}

async function getPassengers(req, res, next) {
  try {
    const { data: passengers, error } = await req.supabase
      .from('passengers')
      .select('id, user_id, full_name, email, phone, created_at')
      .order('created_at', { ascending: false })
      .limit(250);
    if (error) throw error;

    const ids = (passengers || []).map(passenger => passenger.id);
    let counts = new Map();
    if (ids.length) {
      const { data: bookings, error: bookingError } = await req.supabase
        .from('bookings')
        .select('passenger_id, booking_status')
        .in('passenger_id', ids);
      if (bookingError) throw bookingError;
      counts = (bookings || []).reduce((result, booking) => {
        const count = result.get(booking.passenger_id) || { total: 0, active: 0 };
        count.total += 1;
        if (['CONFIRMED', 'WAITLISTED', 'BOARDED'].includes(booking.booking_status)) {
          count.active += 1;
        }
        result.set(booking.passenger_id, count);
        return result;
      }, new Map());
    }

    const result = (passengers || []).map(passenger => ({
      ...passenger,
      name: passenger.full_name,
      total_bookings: counts.get(passenger.id)?.total || 0,
      active_bookings: counts.get(passenger.id)?.active || 0
    }));
    return res.json({ success: true, count: result.length, passengers: result });
  } catch (err) {
    next(err);
  }
}

async function createPassenger(req, res, next) {
  try {
    const acceptedKeys = new Set(['fullName', 'full_name', 'email', 'phone', 'userId']);
    if (Object.keys(req.body).some(key => !acceptedKeys.has(key))) {
      return res.status(400).json({ success: false, message: 'Unsupported passenger fields were provided.' });
    }
    const values = passengerValues(req.body, true);
    const validationError = validatePassenger(values, false);
    if (validationError) return res.status(400).json({ success: false, message: validationError });
    values.full_name = values.full_name.trim();
    values.email = values.email.trim().toLowerCase();
    if (values.phone !== undefined) values.phone = values.phone.trim();

    const { data, error } = await req.supabase
      .from('passengers')
      .insert(values)
      .select('id, user_id, full_name, email, phone, created_at')
      .single();
    if (error?.code === '23505') {
      return res.status(409).json({ success: false, message: 'A passenger is already linked to that user.' });
    }
    if (error) throw error;
    return res.status(201).json({ success: true, passenger: { ...data, name: data.full_name } });
  } catch (err) {
    next(err);
  }
}

async function getPassengerById(req, res, next) {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'A valid passenger ID is required.' });
    }
    const { data, error } = await req.supabase
      .from('passengers')
      .select('id, user_id, full_name, email, phone, created_at')
      .eq('id', Number(req.params.id))
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: 'Passenger not found.' });
    return res.json({ success: true, passenger: { ...data, name: data.full_name } });
  } catch (err) {
    next(err);
  }
}

async function getMyPassenger(req, res, next) {
  try {
    const { data, error } = await req.supabase
      .from('passengers')
      .select('id, user_id, full_name, email, phone, created_at')
      .eq('user_id', req.user.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: 'Passenger profile not found.' });
    return res.json({ success: true, passenger: { ...data, name: data.full_name } });
  } catch (err) {
    next(err);
  }
}

async function updatePassenger(req, res, next) {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'A valid passenger ID is required.' });
    }
    const acceptedKeys = new Set(['fullName', 'full_name', 'email', 'phone']);
    if (Object.keys(req.body).some(key => !acceptedKeys.has(key))) {
      return res.status(400).json({ success: false, message: 'Unsupported passenger fields were provided.' });
    }
    const values = passengerValues(req.body);
    if (values.full_name !== undefined && typeof values.full_name === 'string') {
      values.full_name = values.full_name.trim();
    }
    if (values.email !== undefined && typeof values.email === 'string') {
      values.email = values.email.trim().toLowerCase();
    }
    if (values.phone !== undefined && typeof values.phone === 'string') {
      values.phone = values.phone.trim();
    }
    if (!Object.keys(values).length) {
      return res.status(400).json({ success: false, message: 'Provide passenger fields to update.' });
    }
    const validationError = validatePassenger(values, true);
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    const { data, error } = await req.supabase
      .from('passengers')
      .update(values)
      .eq('id', Number(req.params.id))
      .select('id, user_id, full_name, email, phone, created_at')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: 'Passenger not found.' });
    return res.json({ success: true, passenger: { ...data, name: data.full_name } });
  } catch (err) {
    next(err);
  }
}

async function deletePassenger(req, res, next) {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'A valid passenger ID is required.' });
    }
    const { data, error } = await req.supabase
      .from('passengers')
      .delete()
      .eq('id', Number(req.params.id))
      .select('id')
      .maybeSingle();
    if (error?.code === '23503') {
      return res.status(409).json({
        success: false,
        message: 'Passenger cannot be deleted while bookings reference the passenger.'
      });
    }
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: 'Passenger not found.' });
    return res.json({ success: true, message: 'Passenger deleted safely.' });
  } catch (err) {
    next(err);
  }
}

async function updatePassengerStatus(req, res, next) {
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
      return res.status(400).json({ success: false, message: 'A valid user ID is required.' });
    }
    const { status } = req.body;
    if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be ACTIVE, INACTIVE, or SUSPENDED.'
      });
    }
    const { data, error } = await req.supabase.rpc('update_airline_user_status', {
      p_user_id: req.params.id,
      p_status: status
    });
    if (error?.code === 'P0001') {
      return res.status(/not found/i.test(error.message) ? 404 : 403)
        .json({ success: false, message: error.message });
    }
    if (error) throw error;
    return res.json({
      success: true,
      message: `Passenger account status updated to ${status}.`,
      user: data
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPassengers,
  createPassenger,
  getMyPassenger,
  getPassengerById,
  updatePassenger,
  deletePassenger,
  updatePassengerStatus
};
