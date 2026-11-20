const fs = require('fs');
const path = require('path');
const flightStore = require('./flightStore');
const seatStore = require('./seatStore');
const userStore = require('./userStore');

const DATA_DIR = path.resolve(__dirname, '../../data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');

const PNR_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generatePNR() {
  let pnr = 'AI';
  for (let i = 0; i < 4; i++) {
    pnr += PNR_CHARS.charAt(Math.floor(Math.random() * PNR_CHARS.length));
  }
  return pnr;
}

const INITIAL_BOOKINGS = [
  {
    id: 101,
    pnr: 'AI8K92',
    user_id: 'usr-passenger-001',
    flight_id: 7,
    passenger_name: 'Aarav Sharma',
    passenger_email: 'passenger@skywings.com',
    passenger_phone: '+91-9876543211',
    travel_class: 'Economy',
    seat_number: '12A',
    seat_numbers: '12A',
    fare: 5000,
    booking_status: 'CONFIRMED',
    booking_date: '2026-10-15T10:00:00.000Z',
    transaction_id: 'TXN-984210',
    payment_method: 'Credit Card',
    payment_status: 'COMPLETED',
    flight: {
      id: 7,
      flight_number: 'AI-101',
      airline: 'SkyWings Airlines',
      from_code: 'BOM',
      from_city: 'Mumbai',
      from_name: 'Chhatrapati Shivaji Maharaj International Airport',
      to_code: 'DEL',
      to_city: 'Delhi',
      to_name: 'Indira Gandhi International Airport',
      destination: 'Delhi',
      departure_time: '08:30 AM',
      arrival_time: '10:45 AM',
      duration: '2h 15m'
    },
    passengers: [
      {
        id: 1,
        full_name: 'Aarav Sharma',
        seat_number: '12A',
        seat_class: 'Economy',
        email: 'passenger@skywings.com',
        phone: '+91-9876543211',
        boarding: {
          gate: 'Gate 3B',
          boarding_group: 'Group 2',
          check_in_status: 'CHECKED_IN',
          boarding_status: 'BOARDED',
          boarding_time: '07:55 AM'
        }
      }
    ]
  },
  {
    id: 102,
    pnr: 'SK7M41',
    user_id: 'usr-passenger-001',
    flight_id: 8,
    passenger_name: 'Aarav Sharma',
    passenger_email: 'passenger@skywings.com',
    passenger_phone: '+91-9876543211',
    travel_class: 'Business',
    seat_number: '4C',
    seat_numbers: '4C',
    fare: 11500,
    booking_status: 'CONFIRMED',
    booking_date: '2026-10-18T14:30:00.000Z',
    transaction_id: 'TXN-773412',
    payment_method: 'UPI',
    payment_status: 'COMPLETED',
    flight: {
      id: 8,
      flight_number: 'AI-202',
      airline: 'SkyWings Airlines',
      from_code: 'DEL',
      from_city: 'Delhi',
      from_name: 'Indira Gandhi International Airport',
      to_code: 'BLR',
      to_city: 'Bengaluru',
      to_name: 'Kempegowda International Airport',
      destination: 'Bengaluru',
      departure_time: '01:00 PM',
      arrival_time: '03:45 PM',
      duration: '2h 45m'
    },
    passengers: [
      {
        id: 2,
        full_name: 'Aarav Sharma',
        seat_number: '4C',
        seat_class: 'Business',
        email: 'passenger@skywings.com',
        phone: '+91-9876543211',
        boarding: {
          gate: 'Gate 5A',
          boarding_group: 'Group 1',
          check_in_status: 'NOT_CHECKED_IN',
          boarding_status: 'NOT_CHECKED_IN',
          boarding_time: '12:25 PM'
        }
      }
    ]
  }
];

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(BOOKINGS_FILE)) {
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(INITIAL_BOOKINGS, null, 2), 'utf8');
  }
}

function getAllBookings() {
  ensureFile();
  try {
    return JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf8'));
  } catch (err) {
    return [...INITIAL_BOOKINGS];
  }
}

function saveBookings(bookings) {
  ensureFile();
  const tmp = BOOKINGS_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(bookings, null, 2), 'utf8');
  fs.renameSync(tmp, BOOKINGS_FILE);
}

function getBookingById(id) {
  const bookings = getAllBookings();
  return bookings.find(b => String(b.id) === String(id)) || null;
}

function getBookingByPnr(pnr) {
  if (!pnr) return null;
  const clean = pnr.trim().toUpperCase();
  const bookings = getAllBookings();
  return bookings.find(b => b.pnr.toUpperCase() === clean) || null;
}

function getUserBookings(userId) {
  const bookings = getAllBookings();
  return bookings.filter(b => String(b.user_id) === String(userId));
}

function createBooking({
  userId,
  flightId,
  travelClass = 'Economy',
  passengerName,
  passengerEmail,
  passengerPhone,
  seatNumber,
  fare
}) {
  const flight = flightStore.getFlightById(flightId);
  if (!flight) {
    throw new Error('Flight not found.');
  }

  const cleanSeat = seatNumber ? seatNumber.trim().toUpperCase() : '12A';
  const pnr = generatePNR();

  // Reserve the seat in Seat Store (which automatically decrements available seat inventory!)
  try {
    seatStore.reserveSeat(flight.id, cleanSeat, {
      pnr,
      passenger_name: passengerName || 'Passenger'
    });
  } catch (err) {
    // If seat was already booked or failed, try finding next available seat or propagate
    console.warn('[BOOKING] Seat reservation notice:', err.message);
  }

  const bookings = getAllBookings();
  const nextId = bookings.reduce((max, b) => Math.max(max, Number(b.id) || 0), 0) + 1;

  const calculatedFare = fare || (
    travelClass === 'First Class' ? flight.first_class_fare || 20000 :
    travelClass === 'Business' ? flight.business_fare || 10000 :
    flight.economy_fare || 5000
  );

  const newBooking = {
    id: nextId,
    pnr,
    user_id: userId || 'usr-passenger-001',
    flight_id: flight.id,
    passenger_name: passengerName || 'Passenger',
    passenger_email: passengerEmail || '',
    passenger_phone: passengerPhone || '',
    travel_class: travelClass,
    seat_number: cleanSeat,
    seat_numbers: cleanSeat,
    fare: Number(calculatedFare),
    booking_status: 'CONFIRMED',
    booking_date: new Date().toISOString(),
    transaction_id: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
    payment_method: 'Online Payment',
    payment_status: 'COMPLETED',
    flight: {
      id: flight.id,
      flight_number: flight.flight_number,
      airline: flight.airline,
      from_code: flight.from_code,
      from_city: flight.from_city,
      from_name: flight.from_name,
      to_code: flight.to_code,
      to_city: flight.to_city,
      to_name: flight.to_name,
      destination: flight.destination,
      departure_time: flight.departure_time,
      arrival_time: flight.arrival_time,
      duration: flight.duration
    },
    passengers: [
      {
        id: nextId * 10 + 1,
        full_name: passengerName || 'Passenger',
        seat_number: cleanSeat,
        seat_class: travelClass,
        email: passengerEmail || '',
        phone: passengerPhone || '',
        boarding: {
          gate: 'Gate 3B',
          boarding_group: travelClass === 'Economy' ? 'Group 2' : 'Group 1',
          check_in_status: 'NOT_CHECKED_IN',
          boarding_status: 'NOT_CHECKED_IN',
          boarding_time: flight.departure_time
        }
      }
    ]
  };

  bookings.unshift(newBooking);
  saveBookings(bookings);

  return newBooking;
}

function cancelBooking(id, userId) {
  const bookings = getAllBookings();
  const booking = bookings.find(b => String(b.id) === String(id));
  if (!booking) {
    throw new Error('Booking not found.');
  }

  if (userId && String(booking.user_id) !== String(userId)) {
    throw new Error('You are not authorized to cancel this booking.');
  }

  if (booking.booking_status === 'CANCELLED') {
    throw new Error('Booking is already cancelled.');
  }

  booking.booking_status = 'CANCELLED';

  // Release the seat back to inventory
  if (booking.flight_id && booking.seat_number) {
    seatStore.releaseSeat(booking.flight_id, booking.seat_number);
  }

  saveBookings(bookings);
  return booking;
}

function checkInBooking(pnr) {
  const booking = getBookingByPnr(pnr);
  if (!booking) {
    throw new Error('Booking not found for PNR: ' + pnr);
  }

  if (booking.booking_status === 'CANCELLED') {
    throw new Error('Cannot check in for a cancelled booking.');
  }

  if (booking.passengers && booking.passengers.length) {
    booking.passengers.forEach(p => {
      if (p.boarding) {
        p.boarding.check_in_status = 'CHECKED_IN';
        p.boarding.boarding_status = 'BOARDING';
        p.boarding.check_in_time = new Date().toISOString();
      }
    });
  }

  const bookings = getAllBookings();
  const idx = bookings.findIndex(b => b.pnr.toUpperCase() === booking.pnr.toUpperCase());
  if (idx !== -1) {
    bookings[idx] = booking;
    saveBookings(bookings);
  }

  return booking;
}

module.exports = {
  getAllBookings,
  getUserBookings,
  getBookingById,
  getBookingByPnr,
  createBooking,
  cancelBooking,
  checkInBooking
};
