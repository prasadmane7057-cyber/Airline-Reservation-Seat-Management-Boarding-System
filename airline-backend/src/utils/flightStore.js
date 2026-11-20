const fs = require('fs');
const path = require('path');
const airportStore = require('./airportStore');

const DATA_DIR = path.resolve(__dirname, '../../data');
const FLIGHTS_FILE = path.join(DATA_DIR, 'flights.json');

const INITIAL_FLIGHTS = [
  {
    id: 1,
    flight_number: '111',
    airline: 'SkyWings Airlines',
    from_code: 'BOM',
    from_city: 'Mumbai',
    from_name: 'Chhatrapati Shivaji Maharaj International Airport',
    to_code: 'PNQ',
    to_city: 'Pune',
    to_name: 'Pune International Airport',
    destination: 'Pune',
    departure_time: '07:00 AM',
    arrival_time: '07:45 AM',
    duration: '45m',
    status: 'On Time',
    economy_fare: 4500,
    business_fare: 9500,
    first_class_fare: 18500,
    total_seats: 116,
    booked_seats: 12,
    available_seats: 104,
    aircraft_model: 'Airbus A320neo'
  },
  {
    id: 2,
    flight_number: '155',
    airline: 'SkyWings Airlines',
    from_code: 'DEL',
    from_city: 'Delhi',
    from_name: 'Indira Gandhi International Airport',
    to_code: 'PNQ',
    to_city: 'Pune',
    to_name: 'Pune International Airport',
    destination: 'Pune',
    departure_time: '09:15 AM',
    arrival_time: '11:30 AM',
    duration: '2h 15m',
    status: 'On Time',
    economy_fare: 5200,
    business_fare: 11000,
    first_class_fare: 21000,
    total_seats: 116,
    booked_seats: 24,
    available_seats: 92,
    aircraft_model: 'Airbus A320neo'
  },
  {
    id: 3,
    flight_number: '202',
    airline: 'SkyWings Airlines',
    from_code: 'DEL',
    from_city: 'Delhi',
    from_name: 'Indira Gandhi International Airport',
    to_code: 'LTU',
    to_city: 'Latur',
    to_name: 'Latur Airport',
    destination: 'Latur',
    departure_time: '11:30 AM',
    arrival_time: '02:00 PM',
    duration: '2h 30m',
    status: 'On Time',
    economy_fare: 4800,
    business_fare: 9800,
    first_class_fare: 19000,
    total_seats: 116,
    booked_seats: 18,
    available_seats: 98,
    aircraft_model: 'Boeing 737-800'
  },
  {
    id: 4,
    flight_number: '199',
    airline: 'SkyWings Airlines',
    from_code: 'PNQ',
    from_city: 'Pune',
    from_name: 'Pune International Airport',
    to_code: 'BOM',
    to_city: 'Mumbai',
    to_name: 'Chhatrapati Shivaji Maharaj International Airport',
    destination: 'Mumbai',
    departure_time: '05:30 PM',
    arrival_time: '06:15 PM',
    duration: '45m',
    status: 'On Time',
    economy_fare: 4500,
    business_fare: 9500,
    first_class_fare: 18500,
    total_seats: 116,
    booked_seats: 35,
    available_seats: 81,
    aircraft_model: 'Airbus A320neo'
  },
  {
    id: 5,
    flight_number: '2001',
    airline: 'SkyWings Airlines',
    from_code: 'BOM',
    from_city: 'Mumbai',
    from_name: 'Chhatrapati Shivaji Maharaj International Airport',
    to_code: 'LTU',
    to_city: 'Latur',
    to_name: 'Latur Airport',
    destination: 'Latur',
    departure_time: '10:00 AM',
    arrival_time: '11:15 AM',
    duration: '1h 15m',
    status: 'On Time',
    economy_fare: 4200,
    business_fare: 8900,
    first_class_fare: 17500,
    total_seats: 116,
    booked_seats: 8,
    available_seats: 108,
    aircraft_model: 'ATR 72-600'
  },
  {
    id: 6,
    flight_number: '343',
    airline: 'SkyWings Airlines',
    from_code: 'HYD',
    from_city: 'Hyderabad',
    from_name: 'Rajiv Gandhi International Airport',
    to_code: 'PNQ',
    to_city: 'Pune',
    to_name: 'Pune International Airport',
    destination: 'Pune',
    departure_time: '03:00 PM',
    arrival_time: '04:15 PM',
    duration: '1h 15m',
    status: 'On Time',
    economy_fare: 4900,
    business_fare: 10200,
    first_class_fare: 19800,
    total_seats: 116,
    booked_seats: 14,
    available_seats: 102,
    aircraft_model: 'Airbus A320neo'
  },
  {
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
    duration: '2h 15m',
    status: 'On Time',
    economy_fare: 5000,
    business_fare: 10000,
    first_class_fare: 20000,
    total_seats: 116,
    booked_seats: 42,
    available_seats: 74,
    aircraft_model: 'Airbus A321neo'
  },
  {
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
    duration: '2h 45m',
    status: 'On Time',
    economy_fare: 5500,
    business_fare: 11500,
    first_class_fare: 22000,
    total_seats: 116,
    booked_seats: 28,
    available_seats: 88,
    aircraft_model: 'Boeing 787-9 Dreamliner'
  },
  {
    id: 9,
    flight_number: 'AI-303',
    airline: 'SkyWings Airlines',
    from_code: 'PNQ',
    from_city: 'Pune',
    from_name: 'Pune International Airport',
    to_code: 'BLR',
    to_city: 'Bengaluru',
    to_name: 'Kempegowda International Airport',
    destination: 'Bengaluru',
    departure_time: '04:30 PM',
    arrival_time: '06:00 PM',
    duration: '1h 30m',
    status: 'On Time',
    economy_fare: 4600,
    business_fare: 9600,
    first_class_fare: 18900,
    total_seats: 116,
    booked_seats: 15,
    available_seats: 101,
    aircraft_model: 'Airbus A320neo'
  },
  {
    id: 10,
    flight_number: 'AI-404',
    airline: 'SkyWings Airlines',
    from_code: 'BOM',
    from_city: 'Mumbai',
    from_name: 'Chhatrapati Shivaji Maharaj International Airport',
    to_code: 'BLR',
    to_city: 'Bengaluru',
    to_name: 'Kempegowda International Airport',
    destination: 'Bengaluru',
    departure_time: '06:00 PM',
    arrival_time: '07:45 PM',
    duration: '1h 45m',
    status: 'On Time',
    economy_fare: 5100,
    business_fare: 10500,
    first_class_fare: 20500,
    total_seats: 116,
    booked_seats: 33,
    available_seats: 83,
    aircraft_model: 'Airbus A320neo'
  }
];

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(FLIGHTS_FILE)) {
    fs.writeFileSync(FLIGHTS_FILE, JSON.stringify(INITIAL_FLIGHTS, null, 2), 'utf8');
  }
}

function getAllFlights() {
  ensureFile();
  try {
    return JSON.parse(fs.readFileSync(FLIGHTS_FILE, 'utf8'));
  } catch (err) {
    return [...INITIAL_FLIGHTS];
  }
}

function saveFlights(flights) {
  ensureFile();
  const tmp = FLIGHTS_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(flights, null, 2), 'utf8');
  fs.renameSync(tmp, FLIGHTS_FILE);
}

function getFlightById(id) {
  if (!id) return null;
  const flights = getAllFlights();
  return flights.find(f => String(f.id) === String(id)) || null;
}

function updateFlightInventory(flightId, deltaBooked) {
  const flights = getAllFlights();
  const idx = flights.findIndex(f => String(f.id) === String(flightId));
  if (idx !== -1) {
    const total = flights[idx].total_seats || 116;
    flights[idx].booked_seats = Math.max(0, Math.min(total, (flights[idx].booked_seats || 0) + deltaBooked));
    flights[idx].available_seats = Math.max(0, total - flights[idx].booked_seats);
    saveFlights(flights);
    return flights[idx];
  }
  return null;
}

function createFlight(data) {
  const flights = getAllFlights();
  const nextId = flights.reduce((max, f) => Math.max(max, Number(f.id) || 0), 0) + 1;
  const fromAirport = airportStore.getAirportByCode(data.from_code || data.from_city || 'BOM');
  const toAirport = airportStore.getAirportByCode(data.to_code || data.to_city || data.destination || 'DEL');

  const newFlight = {
    id: nextId,
    flight_number: (data.flight_number || `AI-${nextId + 100}`).toUpperCase().trim(),
    airline: data.airline || 'SkyWings Airlines',
    from_code: fromAirport ? fromAirport.airport_code : (data.from_code || 'BOM').toUpperCase(),
    from_city: fromAirport ? fromAirport.city : (data.from_city || 'Mumbai'),
    from_name: fromAirport ? fromAirport.airport_name : 'Chhatrapati Shivaji Maharaj International Airport',
    to_code: toAirport ? toAirport.airport_code : (data.to_code || 'DEL').toUpperCase(),
    to_city: toAirport ? toAirport.city : (data.destination || data.to_city || 'Delhi'),
    to_name: toAirport ? toAirport.airport_name : 'Indira Gandhi International Airport',
    destination: toAirport ? toAirport.city : (data.destination || 'Delhi'),
    departure_time: data.departure_time || '09:00 AM',
    arrival_time: data.arrival_time || '11:15 AM',
    duration: data.duration || '2h 15m',
    status: data.status || 'On Time',
    economy_fare: Number(data.economy_fare) || 5000,
    business_fare: Number(data.business_fare) || 10000,
    first_class_fare: Number(data.first_class_fare) || 20000,
    total_seats: 116,
    booked_seats: 0,
    available_seats: 116,
    aircraft_model: data.aircraft_model || 'Airbus A320neo'
  };

  flights.push(newFlight);
  saveFlights(flights);
  return newFlight;
}

function updateFlight(id, updates) {
  const flights = getAllFlights();
  const idx = flights.findIndex(f => String(f.id) === String(id));
  if (idx === -1) return null;

  flights[idx] = { ...flights[idx], ...updates };
  saveFlights(flights);
  return flights[idx];
}

function deleteFlight(id) {
  const flights = getAllFlights();
  const filtered = flights.filter(f => String(f.id) !== String(id));
  if (filtered.length !== flights.length) {
    saveFlights(filtered);
    return true;
  }
  return false;
}

module.exports = {
  getAllFlights,
  getFlightById,
  updateFlightInventory,
  createFlight,
  updateFlight,
  deleteFlight
};
