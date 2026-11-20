const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '../../data');
const AIRPORTS_FILE = path.join(DATA_DIR, 'airports.json');

const INITIAL_AIRPORTS = [
  { id: 1, airport_code: 'BOM', airport_name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai', country: 'India' },
  { id: 2, airport_code: 'DEL', airport_name: 'Indira Gandhi International Airport', city: 'Delhi', country: 'India' },
  { id: 3, airport_code: 'BLR', airport_name: 'Kempegowda International Airport', city: 'Bengaluru', country: 'India' },
  { id: 4, airport_code: 'PNQ', airport_name: 'Pune International Airport', city: 'Pune', country: 'India' },
  { id: 5, airport_code: 'HYD', airport_name: 'Rajiv Gandhi International Airport', city: 'Hyderabad', country: 'India' },
  { id: 6, airport_code: 'LTU', airport_name: 'Latur Airport', city: 'Latur', country: 'India' },
  { id: 7, airport_code: 'GOI', airport_name: 'Goa International Airport (Dabolim)', city: 'Goa', country: 'India' },
  { id: 8, airport_code: 'MAA', airport_name: 'Chennai International Airport', city: 'Chennai', country: 'India' }
];

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(AIRPORTS_FILE)) {
    fs.writeFileSync(AIRPORTS_FILE, JSON.stringify(INITIAL_AIRPORTS, null, 2), 'utf8');
  }
}

function getAllAirports() {
  ensureFile();
  try {
    return JSON.parse(fs.readFileSync(AIRPORTS_FILE, 'utf8'));
  } catch (err) {
    return [...INITIAL_AIRPORTS];
  }
}

function getAirportByCode(code) {
  if (!code) return null;
  const c = code.trim().toUpperCase();
  return getAllAirports().find(a => a.airport_code === c || a.city.toUpperCase() === c) || null;
}

function getAirportById(id) {
  return getAllAirports().find(a => String(a.id) === String(id)) || null;
}

module.exports = {
  getAllAirports,
  getAirportByCode,
  getAirportById
};
