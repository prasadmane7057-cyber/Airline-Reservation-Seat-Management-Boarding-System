/**
 * PNR (Passenger Name Record) Generator
 * Generates unique, non-predictable 6-character alphanumeric booking reference codes.
 * Ensures letters & digits format (e.g. 'AB7K92', 'SK4N81').
 */
const crypto = require('crypto');
const { memoryDB, pool, isConnectedToMySQL } = require('../config/db');

const CHARACTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes confusing characters (0, O, 1, I)

function generateRandomPNR() {
  let result = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    result += CHARACTERS[bytes[i] % CHARACTERS.length];
  }
  return result;
}

/**
 * Generates a guaranteed unique PNR by checking against existing database records
 */
async function generateUniquePNR() {
  let pnr = '';
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    pnr = generateRandomPNR();
    attempts++;

    if (isConnectedToMySQL() && pool) {
      try {
        const [rows] = await pool.query('SELECT id FROM bookings WHERE pnr = ?', [pnr]);
        if (rows.length === 0) {
          isUnique = true;
        }
      } catch {
        // Check in-memory DB if query errors
        const exists = memoryDB.bookings.some(b => b.pnr === pnr);
        if (!exists) isUnique = true;
      }
    } else {
      const exists = memoryDB.bookings.some(b => b.pnr === pnr);
      if (!exists) {
        isUnique = true;
      }
    }
  }

  return pnr;
}

module.exports = {
  generateRandomPNR,
  generateUniquePNR
};
