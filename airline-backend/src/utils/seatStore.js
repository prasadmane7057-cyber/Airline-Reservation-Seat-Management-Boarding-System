const fs = require('fs');
const path = require('path');
const flightStore = require('./flightStore');

const DATA_DIR = path.resolve(__dirname, '../../data');
const SEATS_FILE = path.join(DATA_DIR, 'seats.json');

function generateInitialCabinSeats(flightId) {
  const seats = [];
  let seatId = Number(flightId) * 1000 + 1;

  // 1. First Class: Rows 1-2 (4 seats per row: A, B, C, D) = 8 seats
  for (let r = 1; r <= 2; r++) {
    for (const col of ['A', 'B', 'C', 'D']) {
      const seatNo = `${r}${col}`;
      // Initial sample booked seat (e.g. 1A)
      const isBooked = (flightId % 2 === 1 && seatNo === '1A');
      seats.push({
        id: seatId++,
        flight_id: Number(flightId),
        seat_number: seatNo,
        seat_class: 'First Class',
        seat_status: isBooked ? 'BOOKED' : 'AVAILABLE',
        is_occupied: isBooked,
        is_blocked: false,
        created_at: new Date().toISOString()
      });
    }
  }

  // 2. Business Class: Rows 3-6 (4 seats per row: A, B, C, D) = 16 seats
  for (let r = 3; r <= 6; r++) {
    for (const col of ['A', 'B', 'C', 'D']) {
      const seatNo = `${r}${col}`;
      const isBooked = (seatNo === '4C' || (flightId % 3 === 0 && seatNo === '5B'));
      seats.push({
        id: seatId++,
        flight_id: Number(flightId),
        seat_number: seatNo,
        seat_class: 'Business',
        seat_status: isBooked ? 'BOOKED' : 'AVAILABLE',
        is_occupied: isBooked,
        is_blocked: false,
        created_at: new Date().toISOString()
      });
    }
  }

  // 3. Economy Class: Rows 7-21 (6 seats per row: A, B, C, D, E, F)
  // Row 11 is Emergency Exit / Blocked
  for (let r = 7; r <= 21; r++) {
    const isExitRow = (r === 11);
    for (const col of ['A', 'B', 'C', 'D', 'E', 'F']) {
      const seatNo = `${r}${col}`;
      const isBlocked = isExitRow;
      const isBooked = !isBlocked && (seatNo === '12A' || seatNo === '14C' || (flightId === 1 && seatNo === '8D'));

      seats.push({
        id: seatId++,
        flight_id: Number(flightId),
        seat_number: seatNo,
        seat_class: 'Economy',
        seat_status: isBlocked ? 'BLOCKED' : isBooked ? 'BOOKED' : 'AVAILABLE',
        is_occupied: isBooked,
        is_blocked: isBlocked,
        created_at: new Date().toISOString()
      });
    }
  }

  return seats;
}

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(SEATS_FILE)) {
    // Generate seats for initial flights 1 through 10
    const allSeats = {};
    for (let fid = 1; fid <= 10; fid++) {
      allSeats[fid] = generateInitialCabinSeats(fid);
    }
    fs.writeFileSync(SEATS_FILE, JSON.stringify(allSeats, null, 2), 'utf8');
  }
}

function getSeatsData() {
  ensureFile();
  try {
    return JSON.parse(fs.readFileSync(SEATS_FILE, 'utf8'));
  } catch (err) {
    return {};
  }
}

function saveSeatsData(data) {
  ensureFile();
  const tmp = SEATS_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, SEATS_FILE);
}

function getSeatsByFlight(flightId) {
  const data = getSeatsData();
  const key = String(flightId);
  if (!data[key] || !data[key].length) {
    data[key] = generateInitialCabinSeats(flightId);
    saveSeatsData(data);
  }
  return data[key].map(s => ({
    ...s,
    is_occupied: s.seat_status === 'BOOKED',
    is_blocked: s.seat_status === 'BLOCKED'
  }));
}

function getAvailableSeats(flightId) {
  return getSeatsByFlight(flightId).filter(s => s.seat_status === 'AVAILABLE');
}

function getBookedSeats(flightId) {
  return getSeatsByFlight(flightId).filter(s => s.seat_status === 'BOOKED');
}

function getSeatByNumber(flightId, seatNumber) {
  if (!seatNumber) return null;
  const clean = seatNumber.trim().toUpperCase();
  const seats = getSeatsByFlight(flightId);
  return seats.find(s => s.seat_number.toUpperCase() === clean) || null;
}

function reserveSeat(flightId, seatNumber, bookingInfo = {}) {
  const clean = seatNumber.trim().toUpperCase();
  const data = getSeatsData();
  const key = String(flightId);
  if (!data[key]) {
    data[key] = generateInitialCabinSeats(flightId);
  }

  const seat = data[key].find(s => s.seat_number.toUpperCase() === clean);
  if (!seat) {
    throw new Error(`Seat ${seatNumber} not found on flight ${flightId}.`);
  }

  if (seat.seat_status === 'BOOKED') {
    throw new Error(`Seat ${seatNumber} is already booked.`);
  }

  if (seat.seat_status === 'BLOCKED') {
    throw new Error(`Seat ${seatNumber} is blocked for flight operations.`);
  }

  seat.seat_status = 'BOOKED';
  seat.is_occupied = true;
  seat.pnr = bookingInfo.pnr || '';
  seat.passenger_name = bookingInfo.passenger_name || '';
  seat.updated_at = new Date().toISOString();

  saveSeatsData(data);

  // Update Flight Inventory in flightStore
  flightStore.updateFlightInventory(flightId, +1);

  return seat;
}

function releaseSeat(flightId, seatNumber) {
  const clean = seatNumber.trim().toUpperCase();
  const data = getSeatsData();
  const key = String(flightId);
  if (!data[key]) return false;

  const seat = data[key].find(s => s.seat_number.toUpperCase() === clean);
  if (seat && seat.seat_status === 'BOOKED') {
    seat.seat_status = 'AVAILABLE';
    seat.is_occupied = false;
    seat.pnr = null;
    seat.passenger_name = null;
    seat.updated_at = new Date().toISOString();
    saveSeatsData(data);

    // Update Flight Inventory in flightStore
    flightStore.updateFlightInventory(flightId, -1);
    return true;
  }
  return false;
}

module.exports = {
  getSeatsByFlight,
  getAvailableSeats,
  getBookedSeats,
  getSeatByNumber,
  reserveSeat,
  releaseSeat
};
