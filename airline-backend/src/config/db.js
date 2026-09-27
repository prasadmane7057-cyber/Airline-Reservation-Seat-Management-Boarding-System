/**
 * Database Configuration & Connection Pool
 * Supports MySQL connection with automatic fallback to initialized relational data
 */
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

let pool = null;
let isConnectedToMySQL = false;

// Initialize MySQL pool
try {
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'airline_reservation',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  });
} catch (err) {
  console.warn('⚠️ Warning: MySQL pool creation failed. Initializing memory fallback.', err.message);
}

// In-Memory Relational Database (Synced with schema and seed data)
const memoryDB = {
  users: [
    {
      id: 1,
      name: 'System Administrator',
      email: 'admin@airline.com',
      password_hash: '$2a$10$twqayURvLWzPdD3mKW34nOv4lynHIvP5weSH.rLZACdhfffpHdZZy', // admin123
      role: 'admin',
      phone: '+91-9876543210',
      address: 'Headquarters, Terminal 3, New Delhi',
      dob: '1985-05-15',
      status: 'ACTIVE',
      created_at: new Date('2026-09-01')
    },
    {
      id: 2,
      name: 'Demo Passenger',
      email: 'passenger@airline.com',
      password_hash: '$2a$10$kHj6fF1gUhYuokYPYjO71uT7X7pesR419p.lR/zaWyJ1mtxuTOrtm', // pass123
      role: 'passenger',
      phone: '+91-9812345678',
      address: '402, Sunshine Heights, Mumbai',
      dob: '1995-08-20',
      status: 'ACTIVE',
      created_at: new Date('2026-09-02')
    },
    {
      id: 3,
      name: 'Aarav Sharma',
      email: 'aarav.sharma@example.com',
      password_hash: '$2a$10$kHj6fF1gUhYuokYPYjO71uT7X7pesR419p.lR/zaWyJ1mtxuTOrtm',
      role: 'passenger',
      phone: '+91-9823456789',
      address: '12/B, Green Avenue, Pune',
      dob: '1992-03-12',
      status: 'ACTIVE',
      created_at: new Date('2026-09-03')
    },
    {
      id: 4,
      name: 'Sneha Iyer',
      email: 'sneha.iyer@example.com',
      password_hash: '$2a$10$kHj6fF1gUhYuokYPYjO71uT7X7pesR419p.lR/zaWyJ1mtxuTOrtm',
      role: 'passenger',
      phone: '+91-9834567890',
      address: '701, Marina Bay, Chennai',
      dob: '1998-11-25',
      status: 'ACTIVE',
      created_at: new Date('2026-09-04')
    }
  ],
  passengers: [
    { id: 1, user_id: 2, name: 'Demo Passenger', email: 'passenger@airline.com', phone: '+91-9812345678', passport_number: 'Z9823412', gender: 'Male', age: 29, preferred_class: 'Economy' },
    { id: 2, user_id: 3, name: 'Aarav Sharma', email: 'aarav.sharma@example.com', phone: '+91-9823456789', passport_number: 'M4512987', gender: 'Male', age: 32, preferred_class: 'Business' },
    { id: 3, user_id: 4, name: 'Sneha Iyer', email: 'sneha.iyer@example.com', phone: '+91-9834567890', passport_number: 'K7823901', gender: 'Female', age: 26, preferred_class: 'First Class' }
  ],
  airports: [
    { id: 1, airport_code: 'BOM', airport_name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai', country: 'India' },
    { id: 2, airport_code: 'DEL', airport_name: 'Indira Gandhi International Airport', city: 'Delhi', country: 'India' },
    { id: 3, airport_code: 'BLR', airport_name: 'Kempegowda International Airport', city: 'Bengaluru', country: 'India' },
    { id: 4, airport_code: 'HYD', airport_name: 'Rajiv Gandhi International Airport', city: 'Hyderabad', country: 'India' },
    { id: 5, airport_code: 'PNQ', airport_name: 'Pune International Airport', city: 'Pune', country: 'India' },
    { id: 6, airport_code: 'CCU', airport_name: 'Netaji Subhash Chandra Bose International Airport', city: 'Kolkata', country: 'India' },
    { id: 7, airport_code: 'MAA', airport_name: 'Chennai International Airport', city: 'Chennai', country: 'India' }
  ],
  aircraft: [
    { id: 1, model: 'Boeing 737-800', registration_number: 'VT-SK1', total_seats: 116, first_class_seats: 8, business_seats: 18, economy_seats: 90 },
    { id: 2, model: 'Airbus A320neo', registration_number: 'VT-SK2', total_seats: 116, first_class_seats: 8, business_seats: 18, economy_seats: 90 },
    { id: 3, model: 'Boeing 787-9 Dreamliner', registration_number: 'VT-SK3', total_seats: 116, first_class_seats: 8, business_seats: 18, economy_seats: 90 }
  ],
  flights: [
    {
      id: 1,
      flight_number: 'AI101',
      airline: 'SkyWings Airlines',
      aircraft_id: 1,
      from_airport_id: 1,
      to_airport_id: 2,
      departure_time: '2026-10-15T06:00:00',
      arrival_time: '2026-10-15T08:15:00',
      duration: '2h 15m',
      economy_fare: 4500.00,
      business_fare: 11500.00,
      first_class_fare: 21000.00,
      total_seats: 116,
      available_seats: 114,
      status: 'SCHEDULED'
    },
    {
      id: 2,
      flight_number: 'AI202',
      airline: 'SkyWings Airlines',
      aircraft_id: 2,
      from_airport_id: 2,
      to_airport_id: 3,
      departure_time: '2026-10-15T09:30:00',
      arrival_time: '2026-10-15T12:15:00',
      duration: '2h 45m',
      economy_fare: 5200.00,
      business_fare: 13000.00,
      first_class_fare: 24000.00,
      total_seats: 116,
      available_seats: 115,
      status: 'SCHEDULED'
    },
    {
      id: 3,
      flight_number: 'AI303',
      airline: 'SkyWings Airlines',
      aircraft_id: 1,
      from_airport_id: 5,
      to_airport_id: 4,
      departure_time: '2026-10-15T14:00:00',
      arrival_time: '2026-10-15T15:20:00',
      duration: '1h 20m',
      economy_fare: 3800.00,
      business_fare: 9500.00,
      first_class_fare: 18000.00,
      total_seats: 116,
      available_seats: 115,
      status: 'SCHEDULED'
    },
    {
      id: 4,
      flight_number: 'AI404',
      airline: 'SkyWings Airlines',
      aircraft_id: 3,
      from_airport_id: 1,
      to_airport_id: 3,
      departure_time: '2026-10-16T17:45:00',
      arrival_time: '2026-10-16T19:30:00',
      duration: '1h 45m',
      economy_fare: 4800.00,
      business_fare: 12200.00,
      first_class_fare: 22500.00,
      total_seats: 116,
      available_seats: 115,
      status: 'SCHEDULED'
    },
    {
      id: 5,
      flight_number: 'AI505',
      airline: 'SkyWings Airlines',
      aircraft_id: 2,
      from_airport_id: 3,
      to_airport_id: 2,
      departure_time: '2026-10-16T20:15:00',
      arrival_time: '2026-10-16T23:00:00',
      duration: '2h 45m',
      economy_fare: 5400.00,
      business_fare: 13500.00,
      first_class_fare: 25000.00,
      total_seats: 116,
      available_seats: 116,
      status: 'SCHEDULED'
    },
    {
      id: 6,
      flight_number: 'AI606',
      airline: 'SkyWings Airlines',
      aircraft_id: 1,
      from_airport_id: 4,
      to_airport_id: 1,
      departure_time: '2026-10-17T11:00:00',
      arrival_time: '2026-10-17T12:30:00',
      duration: '1h 30m',
      economy_fare: 4100.00,
      business_fare: 10500.00,
      first_class_fare: 19500.00,
      total_seats: 116,
      available_seats: 116,
      status: 'SCHEDULED'
    }
  ],
  seats: [],
  bookings: [
    {
      id: 1,
      pnr: 'AI8K92',
      user_id: 3,
      flight_id: 1,
      total_fare: 4810.00,
      base_fare: 4500.00,
      tax_amount: 810.00,
      discount_amount: 500.00,
      booking_status: 'CONFIRMED',
      payment_status: 'PAID',
      travel_class: 'Economy',
      booking_date: '2026-09-20T10:15:00'
    },
    {
      id: 2,
      pnr: 'SK7M41',
      user_id: 2,
      flight_id: 2,
      total_fare: 14840.00,
      base_fare: 13000.00,
      tax_amount: 2340.00,
      discount_amount: 500.00,
      booking_status: 'CONFIRMED',
      payment_status: 'PAID',
      travel_class: 'Business',
      booking_date: '2026-09-22T14:30:00'
    },
    {
      id: 3,
      pnr: 'BL9X33',
      user_id: 4,
      flight_id: 3,
      total_fare: 20740.00,
      base_fare: 18000.00,
      tax_amount: 3240.00,
      discount_amount: 500.00,
      booking_status: 'CONFIRMED',
      payment_status: 'PAID',
      travel_class: 'First Class',
      booking_date: '2026-09-24T16:45:00'
    },
    {
      id: 4,
      pnr: 'HY5P18',
      user_id: 2,
      flight_id: 4,
      total_fare: 5164.00,
      base_fare: 4800.00,
      tax_amount: 864.00,
      discount_amount: 500.00,
      booking_status: 'CONFIRMED',
      payment_status: 'PAID',
      travel_class: 'Economy',
      booking_date: '2026-09-25T18:20:00'
    },
    {
      id: 5,
      pnr: 'CN2R77',
      user_id: 2,
      flight_id: 1,
      total_fare: 4810.00,
      base_fare: 4500.00,
      tax_amount: 810.00,
      discount_amount: 500.00,
      booking_status: 'CANCELLED',
      payment_status: 'REFUNDED',
      travel_class: 'Economy',
      booking_date: '2026-09-18T08:00:00'
    }
  ],
  booking_passengers: [
    { id: 1, booking_id: 1, seat_id: 27, full_name: 'Aarav Sharma', age: 32, gender: 'Male', passport_id: 'M4512987', seat_number: '6A', travel_class: 'Economy' },
    { id: 2, booking_id: 2, seat_id: 51, full_name: 'Demo Passenger', age: 29, gender: 'Male', passport_id: 'Z9823412', seat_number: '3A', travel_class: 'Business' },
    { id: 3, booking_id: 3, seat_id: 67, full_name: 'Sneha Iyer', age: 26, gender: 'Female', passport_id: 'K7823901', seat_number: '1A', travel_class: 'First Class' },
    { id: 4, booking_id: 4, seat_id: 91, full_name: 'Demo Passenger', age: 29, gender: 'Male', passport_id: 'Z9823412', seat_number: '8C', travel_class: 'Economy' }
  ],
  payments: [
    { id: 1, booking_id: 1, transaction_id: 'TXN-908234101', payment_method: 'Credit Card', amount: 4810.00, payment_status: 'SUCCESS', payment_date: '2026-09-20T10:17:00' },
    { id: 2, booking_id: 2, transaction_id: 'TXN-908234202', payment_method: 'UPI', amount: 14840.00, payment_status: 'SUCCESS', payment_date: '2026-09-22T14:32:00' },
    { id: 3, booking_id: 3, transaction_id: 'TXN-908234303', payment_method: 'Net Banking', amount: 20740.00, payment_status: 'SUCCESS', payment_date: '2026-09-24T16:47:00' },
    { id: 4, booking_id: 4, transaction_id: 'TXN-908234404', payment_method: 'Debit Card', amount: 5164.00, payment_status: 'SUCCESS', payment_date: '2026-09-25T18:22:00' },
    { id: 5, booking_id: 5, transaction_id: 'TXN-908234505', payment_method: 'Credit Card', amount: 4810.00, payment_status: 'REFUNDED', payment_date: '2026-09-18T08:02:00' }
  ],
  pnr_records: [
    { id: 1, pnr: 'AI8K92', booking_id: 1, is_active: true, generated_at: '2026-09-20T10:15:00' },
    { id: 2, pnr: 'SK7M41', booking_id: 2, is_active: true, generated_at: '2026-09-22T14:30:00' },
    { id: 3, pnr: 'BL9X33', booking_id: 3, is_active: true, generated_at: '2026-09-24T16:45:00' },
    { id: 4, pnr: 'HY5P18', booking_id: 4, is_active: true, generated_at: '2026-09-25T18:20:00' },
    { id: 5, pnr: 'CN2R77', booking_id: 5, is_active: false, generated_at: '2026-09-18T08:00:00' }
  ],
  boarding: [
    { id: 1, booking_id: 1, passenger_id: 1, flight_id: 1, seat_number: '6A', gate: 'Gate 3A', boarding_group: 'Group 3', boarding_time: '2026-10-15T05:15:00', check_in_status: 'CHECKED_IN', boarding_status: 'BOARDING' },
    { id: 2, booking_id: 2, passenger_id: 2, flight_id: 2, seat_number: '3A', gate: 'Gate 1B', boarding_group: 'Group 1', boarding_time: '2026-10-15T08:45:00', check_in_status: 'CHECKED_IN', boarding_status: 'CHECKED_IN' },
    { id: 3, booking_id: 3, passenger_id: 3, flight_id: 3, seat_number: '1A', gate: 'Gate 2C', boarding_group: 'Group 1', boarding_time: '2026-10-15T13:15:00', check_in_status: 'CHECKED_IN', boarding_status: 'BOARDED' },
    { id: 4, booking_id: 4, passenger_id: 4, flight_id: 4, seat_number: '8C', gate: 'Gate 4D', boarding_group: 'Group 3', boarding_time: '2026-10-16T17:00:00', check_in_status: 'NOT_CHECKED_IN', boarding_status: 'NOT_CHECKED_IN' }
  ]
};

// Generate standard flight seat layout for any flight
function generateSeatLayoutForFlight(flightId) {
  const seats = [];
  let seatIdCounter = flightId * 1000 + 1;

  // First Class: Rows 1-2 (A, B, E, F)
  for (let r = 1; r <= 2; r++) {
    ['A', 'B', 'E', 'F'].forEach(col => {
      const seatNum = `${r}${col}`;
      const isOccupied = (flightId === 3 && seatNum === '1A');
      seats.push({
        id: seatIdCounter++,
        flight_id: flightId,
        seat_number: seatNum,
        row_number: r,
        column_letter: col,
        seat_class: 'First Class',
        is_occupied: isOccupied,
        is_blocked: false,
        price_multiplier: 1.00
      });
    });
  }

  // Business Class: Rows 3-5 (A, B, C, D, E, F)
  for (let r = 3; r <= 5; r++) {
    ['A', 'B', 'C', 'D', 'E', 'F'].forEach(col => {
      const seatNum = `${r}${col}`;
      const isOccupied = (flightId === 2 && seatNum === '3A');
      seats.push({
        id: seatIdCounter++,
        flight_id: flightId,
        seat_number: seatNum,
        row_number: r,
        column_letter: col,
        seat_class: 'Business',
        is_occupied: isOccupied,
        is_blocked: false,
        price_multiplier: 1.00
      });
    });
  }

  // Economy Class: Rows 6-20 (A, B, C, D, E, F)
  for (let r = 6; r <= 20; r++) {
    ['A', 'B', 'C', 'D', 'E', 'F'].forEach(col => {
      const seatNum = `${r}${col}`;
      const isOccupied = (flightId === 1 && seatNum === '6A') || (flightId === 4 && seatNum === '8C');
      seats.push({
        id: seatIdCounter++,
        flight_id: flightId,
        seat_number: seatNum,
        row_number: r,
        column_letter: col,
        seat_class: 'Economy',
        is_occupied: isOccupied,
        is_blocked: false,
        price_multiplier: 1.00
      });
    });
  }

  return seats;
}

// Initialize default seats
[1, 2, 3, 4, 5, 6].forEach(fId => {
  memoryDB.seats.push(...generateSeatLayoutForFlight(fId));
});

// Test MySQL connection once at startup
async function checkMySQLConnection() {
  if (!pool) return false;
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    isConnectedToMySQL = true;
    console.log('✅ Connected to MySQL Database: ' + (process.env.DB_NAME || 'airline_reservation'));
    return true;
  } catch (err) {
    isConnectedToMySQL = false;
    console.log('ℹ️ Local MySQL server not reachable (' + err.message + '). Using synchronized internal relational database engine.');
    return false;
  }
}

// Check initial connection
checkMySQLConnection();

module.exports = {
  pool,
  memoryDB,
  isConnectedToMySQL: () => isConnectedToMySQL,
  generateSeatLayoutForFlight,
  checkMySQLConnection
};
