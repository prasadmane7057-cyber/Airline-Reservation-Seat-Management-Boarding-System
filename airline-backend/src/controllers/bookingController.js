const { bookingSelect, flattenBooking } = require('../lib/query');

async function createBooking(req, res, next) {
  try {
    const {
      flightId,
      travelClass = 'Economy',
      passengers = [],
      paymentMethod = 'Credit Card',
      customDiscount = 0
    } = req.body;

    if (!flightId || !Array.isArray(passengers) || passengers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Flight ID and at least one passenger are required.'
      });
    }
    if (passengers.some(passenger => !passenger.fullName?.trim() || !passenger.seatNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Each passenger needs a full name and selected seat.'
      });
    }

    const { data, error } = await req.supabase.rpc('create_airline_booking', {
      p_flight_id: Number(flightId),
      p_travel_class: travelClass,
      p_passengers: passengers,
      p_payment_method: paymentMethod,
      p_custom_discount: Number(customDiscount) || 0
    });
    if (error) {
      if (error.code === 'P0001') {
        return res.status(409).json({ success: false, message: error.message });
      }
      throw error;
    }
    return res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully!',
      booking: data
    });
  } catch (err) {
    next(err);
  }
}

async function getUserBookings(req, res, next) {
  try {
    const { data, error } = await req.supabase
      .from('bookings')
      .select(bookingSelect())
      .order('booking_date', { ascending: false });
    if (error) throw error;
    const bookings = data.map(flattenBooking);
    return res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    next(err);
  }
}

async function getBookingById(req, res, next) {
  try {
    let query = req.supabase.from('bookings').select(bookingSelect());
    if (/^\d+$/.test(req.params.id)) query = query.eq('id', req.params.id);
    else query = query.eq('pnr', req.params.id.toUpperCase());
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: 'Booking not found.' });
    return res.json({ success: true, booking: flattenBooking(data) });
  } catch (err) {
    next(err);
  }
}

async function cancelBooking(req, res, next) {
  try {
    const { error } = await req.supabase.rpc('cancel_airline_booking', {
      p_booking_id: Number(req.params.id)
    });
    if (error) {
      if (error.code === 'P0001') {
        return res.status(error.message.includes('Not authorized') ? 403 : 400)
          .json({ success: false, message: error.message });
      }
      throw error;
    }
    return res.json({
      success: true,
      message: 'Booking cancelled successfully. Allocated seats have been released and refund initiated.'
    });
  } catch (err) {
    next(err);
  }
}

async function getAllBookings(req, res, next) {
  try {
    let query = req.supabase
      .from('bookings')
      .select(bookingSelect())
      .order('booking_date', { ascending: false });
    if (req.query.status) query = query.eq('booking_status', req.query.status);
    if (req.query.pnr) query = query.ilike('pnr', `%${req.query.pnr}%`);
    const { data, error } = await query;
    if (error) throw error;

    let bookings = data.map(flattenBooking);
    if (req.query.flightNumber) {
      const number = req.query.flightNumber.toUpperCase();
      bookings = bookings.filter(booking => booking.flight_number === number);
    }
    return res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    next(err);
  }
}

async function updateBookingStatus(req, res, next) {
  try {
    const updates = {};
    for (const key of ['booking_status', 'payment_status']) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'Provide a booking or payment status.' });
    }
    const { data, error } = await req.supabase
      .from('bookings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: 'Booking not found.' });
    return res.json({ success: true, message: 'Booking status updated successfully.' });
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
  updateBookingStatus
};
