async function getPassengers(req, res, next) {
  try {
    const { data: users, error } = await req.supabase
      .from('users')
      .select('id, name, email, phone, status, created_at, bookings(id, booking_status)')
      .eq('role', 'passenger')
      .order('created_at', { ascending: false });
    if (error) throw error;

    const passengers = users.map(user => ({
      user_id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      status: user.status,
      created_at: user.created_at,
      total_bookings: user.bookings.length,
      active_bookings: user.bookings.filter(booking => booking.booking_status === 'CONFIRMED').length
    }));
    return res.json({ success: true, count: passengers.length, passengers });
  } catch (err) {
    next(err);
  }
}

async function updatePassengerStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be ACTIVE, INACTIVE, or SUSPENDED.'
      });
    }

    const { data, error } = await req.supabase
      .from('users')
      .update({ status })
      .eq('id', req.params.id)
      .eq('role', 'passenger')
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: 'Passenger not found.' });
    return res.json({ success: true, message: `Passenger account status updated to ${status}.` });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPassengers,
  updatePassengerStatus
};
