const { pool, memoryDB, isConnectedToMySQL } = require('../config/db');

/**
 * Get all airports
 */
async function getAirports(req, res, next) {
  try {
    if (isConnectedToMySQL() && pool) {
      const [rows] = await pool.query('SELECT * FROM airports ORDER BY city ASC');
      return res.json({ success: true, count: rows.length, airports: rows });
    } else {
      const sorted = [...memoryDB.airports].sort((a, b) => a.city.localeCompare(b.city));
      return res.json({ success: true, count: sorted.length, airports: sorted });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Create airport
 */
async function createAirport(req, res, next) {
  try {
    const { airport_code, airport_name, city, country } = req.body;

    if (!airport_code || !airport_name || !city) {
      return res.status(400).json({
        success: false,
        message: 'Airport code, name, and city are required.'
      });
    }

    const code = airport_code.toUpperCase().trim();

    if (isConnectedToMySQL() && pool) {
      const [result] = await pool.query(
        'INSERT INTO airports (airport_code, airport_name, city, country) VALUES (?, ?, ?, ?)',
        [code, airport_name.trim(), city.trim(), country ? country.trim() : 'India']
      );
      return res.status(201).json({
        success: true,
        message: 'Airport created successfully.',
        airportId: result.insertId
      });
    } else {
      const newAirport = {
        id: memoryDB.airports.length + 1,
        airport_code: code,
        airport_name: airport_name.trim(),
        city: city.trim(),
        country: country ? country.trim() : 'India'
      };
      memoryDB.airports.push(newAirport);
      return res.status(201).json({
        success: true,
        message: 'Airport created successfully.',
        airport: newAirport
      });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Update airport
 */
async function updateAirport(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { airport_code, airport_name, city, country } = req.body;

    if (isConnectedToMySQL() && pool) {
      await pool.query(
        'UPDATE airports SET airport_code = COALESCE(?, airport_code), airport_name = COALESCE(?, airport_name), city = COALESCE(?, city), country = COALESCE(?, country) WHERE id = ?',
        [airport_code ? airport_code.toUpperCase() : null, airport_name, city, country, id]
      );
    } else {
      const a = memoryDB.airports.find(item => item.id === id);
      if (a) {
        if (airport_code) a.airport_code = airport_code.toUpperCase();
        if (airport_name) a.airport_name = airport_name;
        if (city) a.city = city;
        if (country) a.country = country;
      }
    }

    res.json({ success: true, message: 'Airport updated successfully.' });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Delete airport
 */
async function deleteAirport(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);

    if (isConnectedToMySQL() && pool) {
      await pool.query('DELETE FROM airports WHERE id = ?', [id]);
    } else {
      const idx = memoryDB.airports.findIndex(a => a.id === id);
      if (idx !== -1) memoryDB.airports.splice(idx, 1);
    }

    res.json({ success: true, message: 'Airport removed successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAirports,
  createAirport,
  updateAirport,
  deleteAirport
};
