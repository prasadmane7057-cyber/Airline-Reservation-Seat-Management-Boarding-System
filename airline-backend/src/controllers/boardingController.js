const bookingStore = require('../utils/bookingStore');
const flightStore = require('../utils/flightStore');
const seatStore = require('../utils/seatStore');

function formatBoardingPass(booking) {
  const flight = booking.flight || flightStore.getFlightById(booking.flight_id) || {};
  const firstPax = (booking.passengers && booking.passengers.length > 0) ? booking.passengers[0] : {};
  const boardingInfo = firstPax.boarding || {};

  const isBoarded = booking.booking_status === 'BOARDED' || boardingInfo.boarding_status === 'BOARDED';
  const isCheckedIn = isBoarded || boardingInfo.check_in_status === 'CHECKED_IN' || !!booking.checked_in_at;

  const pnr = booking.pnr || 'AI0000';
  const flightNumber = flight.flight_number || booking.flight_number || 'AI-101';
  const seatNumber = booking.seat_number || firstPax.seat_number || '12A';
  const passengerName = booking.passenger_name || firstPax.full_name || 'Passenger';
  const fromCity = flight.from_city || 'Mumbai';
  const fromCode = flight.from_code || 'BOM';
  const toCity = flight.to_city || booking.destination || 'Delhi';
  const toCode = flight.to_code || 'DEL';

  return {
    booking_id: booking.id,
    pnr,
    passenger_id: firstPax.id || 1,
    passenger_name: passengerName,
    passenger_email: booking.passenger_email || firstPax.email || '',
    seat_id: booking.seat_id || 1,
    seat_number: seatNumber,
    travel_class: booking.travel_class || 'Economy',
    flight_id: flight.id || booking.flight_id,
    flight_number: flightNumber,
    airline: flight.airline || 'SkyWings Airlines',
    from_city: fromCity,
    from_code: fromCode,
    from_name: flight.from_name || `${fromCity} International Airport`,
    to_city: toCity,
    to_code: toCode,
    to_name: flight.to_name || `${toCity} Airport`,
    destination: toCity,
    departure_time: flight.departure_time || '08:30 AM',
    arrival_time: flight.arrival_time || '10:45 AM',
    duration: flight.duration || '2h 15m',
    flight_status: flight.status || 'On Time',
    booking_status: booking.booking_status,
    check_in_status: isCheckedIn ? 'CHECKED_IN' : 'NOT_CHECKED_IN',
    boarding_status: isBoarded ? 'BOARDED' : isCheckedIn ? 'CHECKED_IN' : 'NOT_CHECKED_IN',
    gate: boardingInfo.gate || 'Gate 3B',
    boarding_group: boardingInfo.boarding_group || (booking.travel_class === 'Economy' ? 'Group 2' : 'Group 1'),
    boarding_time: boardingInfo.boarding_time || flight.departure_time || '07:55 AM',
    checked_in_at: booking.checked_in_at || (isCheckedIn ? new Date().toISOString() : null),
    qrPayload: `AIRLINE:${pnr}|PAX:${passengerName}|FLT:${flightNumber}|SEAT:${seatNumber}|ROUTE:${fromCode}-${toCode}`
  };
}

async function getBoardingByFlight(req, res, next) {
  try {
    const flightId = req.params.flightId;
    if (!flightId) {
      return res.status(400).json({ success: false, message: 'A valid flight ID is required.' });
    }

    const allBookings = bookingStore.getAllBookings();
    const flightBookings = allBookings.filter(b => String(b.flight_id) === String(flightId) && b.booking_status !== 'CANCELLED');

    const manifest = flightBookings.map(b => formatBoardingPass(b));
    manifest.sort((a, b) => (a.seat_number || '').localeCompare(b.seat_number || '', undefined, { numeric: true }));

    return res.json({ success: true, count: manifest.length, manifest });
  } catch (err) {
    next(err);
  }
}

async function getBoardingPass(req, res, next) {
  try {
    const identifier = (req.params.identifier || '').trim();
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'PNR or ID reference is required.' });
    }

    let booking = null;
    if (/^\d+$/.test(identifier)) {
      booking = bookingStore.getBookingById(identifier) || bookingStore.getBookingByPnr(identifier);
    } else {
      booking = bookingStore.getBookingByPnr(identifier) || bookingStore.getBookingById(identifier);
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'A confirmed booking was not found for this reference.'
      });
    }

    const boardingPass = formatBoardingPass(booking);
    return res.json({ success: true, boardingPass });
  } catch (err) {
    next(err);
  }
}

async function verifyBoarding(req, res, next) {
  try {
    const pnr = typeof req.body.pnr === 'string' ? req.body.pnr.trim().toUpperCase() : '';
    const seatNumber = typeof req.body.seatNumber === 'string' ? req.body.seatNumber.trim().toUpperCase() : '';

    if (!pnr || !seatNumber) {
      return res.status(400).json({ success: false, message: 'PNR and seat number are required.' });
    }

    const booking = bookingStore.getBookingByPnr(pnr);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.seat_number.toUpperCase() !== seatNumber) {
      return res.status(409).json({ success: false, message: 'PNR and seat allocation do not match.' });
    }

    booking.booking_status = 'BOARDED';
    if (booking.passengers && booking.passengers[0] && booking.passengers[0].boarding) {
      booking.passengers[0].boarding.boarding_status = 'BOARDED';
      booking.passengers[0].boarding.check_in_status = 'CHECKED_IN';
    }

    return res.json({
      success: true,
      message: 'Confirmed booking and seat verified; passenger is boarded.',
      booking
    });
  } catch (err) {
    next(err);
  }
}

async function updateBoardingStatus(req, res, next) {
  try {
    const id = req.params.id;
    const { status } = req.body;
    const booking = bookingStore.getBookingById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (status === 'BOARDED') {
      booking.booking_status = 'BOARDED';
      if (booking.passengers?.[0]?.boarding) {
        booking.passengers[0].boarding.boarding_status = 'BOARDED';
        booking.passengers[0].boarding.check_in_status = 'CHECKED_IN';
      }
    } else if (status === 'CHECKED_IN') {
      booking.checked_in_at = new Date().toISOString();
      if (booking.passengers?.[0]?.boarding) {
        booking.passengers[0].boarding.check_in_status = 'CHECKED_IN';
        booking.passengers[0].boarding.boarding_status = 'BOARDING';
      }
    }

    return res.json({
      success: true,
      message: status === 'CHECKED_IN' ? 'Check-in completed.' : 'Passenger boarded.',
      booking
    });
  } catch (err) {
    next(err);
  }
}

async function selfCheckIn(req, res, next) {
  try {
    const pnr = typeof req.body.pnr === 'string' ? req.body.pnr.trim().toUpperCase() : '';
    if (!pnr) {
      return res.status(400).json({ success: false, message: 'PNR reference code is required.' });
    }

    const booking = bookingStore.checkInBooking(pnr);
    return res.json({
      success: true,
      message: 'Check-in completed successfully.',
      booking: formatBoardingPass(booking)
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getBoardingByFlight,
  getBoardingPass,
  verifyBoarding,
  updateBoardingStatus,
  selfCheckIn
};
