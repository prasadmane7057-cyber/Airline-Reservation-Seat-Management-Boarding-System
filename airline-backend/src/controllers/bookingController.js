const bookingStore = require('../utils/bookingStore');
const flightStore = require('../utils/flightStore');
const seatStore = require('../utils/seatStore');

async function createBooking(req, res, next) {
  try {
    const {
      flightId,
      passengerId,
      seatId,
      seatNumber,
      travelClass,
      passengers,
      passenger,
      fare
    } = req.body;

    if (!flightId) {
      return res.status(400).json({ success: false, message: 'A valid flight ID is required.' });
    }

    const legacyPassenger = Array.isArray(passengers) && passengers.length > 0 ? passengers[0] : (passenger || {});
    const pName = legacyPassenger.fullName || legacyPassenger.full_name || req.user?.name || 'Aarav Sharma';
    const pEmail = legacyPassenger.email || req.user?.email || 'passenger@skywings.com';
    const pPhone = legacyPassenger.phone || req.user?.phone || '+91-9876543211';

    let resolvedSeatNumber = seatNumber || legacyPassenger.seatNumber || legacyPassenger.seat_number;
    if (!resolvedSeatNumber && seatId) {
      const seats = seatStore.getSeatsByFlight(flightId);
      const matched = seats.find(s => Number(s.id) === Number(seatId));
      if (matched) resolvedSeatNumber = matched.seat_number;
    }
    if (!resolvedSeatNumber) {
      // Find first available seat in the travel class
      const available = seatStore.getAvailableSeats(flightId);
      const matched = available.find(s => s.seat_class === (travelClass || 'Economy')) || available[0];
      resolvedSeatNumber = matched ? matched.seat_number : '12A';
    }

    const booking = bookingStore.createBooking({
      userId: req.user ? req.user.id : 'usr-passenger-001',
      flightId: Number(flightId),
      travelClass: travelClass || 'Economy',
      passengerName: pName,
      passengerEmail: pEmail,
      passengerPhone: pPhone,
      seatNumber: resolvedSeatNumber,
      fare
    });

    return res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully.',
      booking
    });
  } catch (err) {
    next(err);
  }
}

async function getUserBookings(req, res, next) {
  try {
    const userId = req.user ? req.user.id : 'usr-passenger-001';
    let bookings = bookingStore.getUserBookings(userId);

    // If this user has no bookings yet, return the default bookings so user can see sample data
    if (!bookings.length) {
      bookings = bookingStore.getAllBookings();
    }

    return res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    next(err);
  }
}

async function getBookingById(req, res, next) {
  try {
    const identifier = (req.params.pnr || req.params.id || '').trim();
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'PNR or ID is required.' });
    }

    let booking = null;
    if (/^\d+$/.test(identifier)) {
      booking = bookingStore.getBookingById(identifier) || bookingStore.getBookingByPnr(identifier);
    } else {
      booking = bookingStore.getBookingByPnr(identifier) || bookingStore.getBookingById(identifier);
    }

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    return res.json({ success: true, booking });
  } catch (err) {
    next(err);
  }
}

async function cancelBooking(req, res, next) {
  try {
    const identifier = (req.params.id || req.params.pnr || '').trim();
    let booking = null;
    if (/^\d+$/.test(identifier)) {
      booking = bookingStore.getBookingById(identifier) || bookingStore.getBookingByPnr(identifier);
    } else {
      booking = bookingStore.getBookingByPnr(identifier) || bookingStore.getBookingById(identifier);
    }

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const cancelled = bookingStore.cancelBooking(booking.id, req.user?.id);
    return res.json({
      success: true,
      message: 'Booking cancelled and its seat released.',
      booking: cancelled
    });
  } catch (err) {
    next(err);
  }
}

async function getAllBookings(req, res, next) {
  try {
    let bookings = bookingStore.getAllBookings();

    if (req.query.status) {
      bookings = bookings.filter(b => b.booking_status === req.query.status);
    }

    if (req.query.pnr) {
      const q = req.query.pnr.trim().toUpperCase();
      bookings = bookings.filter(b => b.pnr.toUpperCase().includes(q));
    }

    if (req.query.flightNumber) {
      const q = req.query.flightNumber.trim().toLowerCase();
      bookings = bookings.filter(b => b.flight_number && b.flight_number.toLowerCase().includes(q));
    }

    return res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    next(err);
  }
}

async function updateBookingStatus(req, res, next) {
  try {
    const id = req.params.id;
    const { status, booking_status } = req.body;
    const newStatus = status || booking_status;

    const booking = bookingStore.getBookingById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    booking.booking_status = newStatus;
    return res.json({
      success: true,
      message: `Booking status updated to ${newStatus}.`,
      booking
    });
  } catch (err) {
    next(err);
  }
}

async function enrichBookings(client, bookings) {
  return bookings;
}

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  getAllBookings,
  updateBookingStatus,
  enrichBookings
};
