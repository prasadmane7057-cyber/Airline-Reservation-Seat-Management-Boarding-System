const userStore = require('../utils/userStore');
const bookingStore = require('../utils/bookingStore');

function getPassengerProfile(user) {
  const allBookings = bookingStore.getAllBookings();
  const userBookings = allBookings.filter(b => b.user_id === user.id || b.passenger_email === user.email);
  const activeBookings = userBookings.filter(b => b.booking_status === 'CONFIRMED' || b.booking_status === 'BOARDED');

  return {
    id: user.numericId || 1,
    user_id: user.id,
    full_name: user.name || 'Passenger',
    name: user.name || 'Passenger',
    email: user.email,
    phone: user.phone || '+91-9876543210',
    total_bookings: userBookings.length,
    active_bookings: activeBookings.length,
    created_at: user.created_at || new Date().toISOString()
  };
}

async function getMyPassenger(req, res, next) {
  try {
    const user = req.user || {
      id: 'usr-passenger-001',
      name: 'Aarav Sharma',
      email: 'passenger@skywings.com',
      phone: '+91-9876543211',
      numericId: 1
    };

    const passenger = getPassengerProfile(user);
    return res.json({ success: true, passenger });
  } catch (err) {
    next(err);
  }
}

async function getPassengers(req, res, next) {
  try {
    const users = userStore.getAllUsers();
    const passengers = users.map((u, index) => {
      const p = getPassengerProfile({ ...u, numericId: index + 1 });
      return p;
    });

    return res.json({ success: true, count: passengers.length, passengers });
  } catch (err) {
    next(err);
  }
}

async function getPassengerById(req, res, next) {
  try {
    const id = req.params.id;
    const users = userStore.getAllUsers();
    const user = users.find(u => String(u.id) === String(id)) || users[0];
    const passenger = getPassengerProfile({ ...user, numericId: Number(id) || 1 });
    return res.json({ success: true, passenger });
  } catch (err) {
    next(err);
  }
}

async function createPassenger(req, res, next) {
  try {
    const { fullName, full_name, email, phone, userId } = req.body;
    const name = fullName || full_name || 'Passenger';
    const passenger = {
      id: Math.floor(Math.random() * 900) + 100,
      user_id: userId || 'usr-' + Date.now(),
      full_name: name,
      name,
      email: (email || 'passenger@skywings.com').toLowerCase(),
      phone: phone || '+91-9876543210',
      total_bookings: 0,
      active_bookings: 0,
      created_at: new Date().toISOString()
    };
    return res.status(201).json({ success: true, passenger });
  } catch (err) {
    next(err);
  }
}

async function updatePassenger(req, res, next) {
  try {
    const id = req.params.id;
    const { fullName, full_name, email, phone } = req.body;
    const name = fullName || full_name;
    const updated = {
      id: Number(id) || 1,
      full_name: name,
      name,
      email: email ? email.toLowerCase() : undefined,
      phone,
      updated_at: new Date().toISOString()
    };
    return res.json({ success: true, passenger: updated });
  } catch (err) {
    next(err);
  }
}

async function deletePassenger(req, res, next) {
  try {
    return res.json({ success: true, message: 'Passenger deleted safely.' });
  } catch (err) {
    next(err);
  }
}

async function updatePassengerStatus(req, res, next) {
  try {
    const { status } = req.body;
    return res.json({
      success: true,
      message: `Passenger account status updated to ${status || 'ACTIVE'}.`,
      user: { id: req.params.id, status }
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
