const { pool, memoryDB, isConnectedToMySQL, generateSeatLayoutForFlight } = require('../config/db');

/**
 * Get / Search Flights with Filtering and Sorting
 */
async function getFlights(req, res, next) {
  try {
    const { from, to, date, travelClass, sortBy, maxPrice, status } = req.query;

    if (isConnectedToMySQL() && pool) {
      let query = `
        SELECT 
          f.*,
          a_from.airport_code AS from_code,
          a_from.airport_name AS from_name,
          a_from.city AS from_city,
          a_to.airport_code AS to_code,
          a_to.airport_name AS to_name,
          a_to.city AS to_city,
          ac.model AS aircraft_model
        FROM flights f
        JOIN airports a_from ON f.from_airport_id = a_from.id
        JOIN airports a_to ON f.to_airport_id = a_to.id
        JOIN aircraft ac ON f.aircraft_id = ac.id
        WHERE 1=1
      `;
      const params = [];

      if (from) {
        query += ` AND (a_from.airport_code = ? OR a_from.city LIKE ? OR f.from_airport_id = ?)`;
        params.push(from.toUpperCase(), `%${from}%`, parseInt(from, 10) || 0);
      }
      if (to) {
        query += ` AND (a_to.airport_code = ? OR a_to.city LIKE ? OR f.to_airport_id = ?)`;
        params.push(to.toUpperCase(), `%${to}%`, parseInt(to, 10) || 0);
      }
      if (date) {
        query += ` AND DATE(f.departure_time) = ?`;
        params.push(date.split('T')[0]);
      }
      if (status) {
        query += ` AND f.status = ?`;
        params.push(status);
      }
      if (maxPrice) {
        const price = parseFloat(maxPrice);
        if (travelClass === 'Business') {
          query += ` AND f.business_fare <= ?`;
        } else if (travelClass === 'First Class') {
          query += ` AND f.first_class_fare <= ?`;
        } else {
          query += ` AND f.economy_fare <= ?`;
        }
        params.push(price);
      }

      // Sorting
      if (sortBy === 'price_asc') {
        query += ` ORDER BY f.economy_fare ASC`;
      } else if (sortBy === 'price_desc') {
        query += ` ORDER BY f.economy_fare DESC`;
      } else if (sortBy === 'departure') {
        query += ` ORDER BY f.departure_time ASC`;
      } else {
        query += ` ORDER BY f.departure_time ASC`;
      }

      const [rows] = await pool.query(query, params);
      return res.json({
        success: true,
        count: rows.length,
        flights: rows
      });
    } else {
      // Memory DB search
      let results = memoryDB.flights.map(f => {
        const a_from = memoryDB.airports.find(a => a.id === f.from_airport_id) || {};
        const a_to = memoryDB.airports.find(a => a.id === f.to_airport_id) || {};
        const ac = memoryDB.aircraft.find(a => a.id === f.aircraft_id) || {};
        return {
          ...f,
          from_code: a_from.airport_code || '',
          from_name: a_from.airport_name || '',
          from_city: a_from.city || '',
          to_code: a_to.airport_code || '',
          to_name: a_to.airport_name || '',
          to_city: a_to.city || '',
          aircraft_model: ac.model || 'Commercial Jet'
        };
      });

      if (from) {
        const fStr = from.toString().toLowerCase();
        results = results.filter(f =>
          f.from_code.toLowerCase() === fStr ||
          f.from_city.toLowerCase().includes(fStr) ||
          f.from_airport_id.toString() === fStr
        );
      }

      if (to) {
        const tStr = to.toString().toLowerCase();
        results = results.filter(f =>
          f.to_code.toLowerCase() === tStr ||
          f.to_city.toLowerCase().includes(tStr) ||
          f.to_airport_id.toString() === tStr
        );
      }

      if (date) {
        const searchDate = date.split('T')[0];
        results = results.filter(f => f.departure_time.startsWith(searchDate));
      }

      if (status) {
        results = results.filter(f => f.status === status);
      }

      if (maxPrice) {
        const price = parseFloat(maxPrice);
        results = results.filter(f => {
          if (travelClass === 'Business') return f.business_fare <= price;
          if (travelClass === 'First Class') return f.first_class_fare <= price;
          return f.economy_fare <= price;
        });
      }

      if (sortBy === 'price_asc') {
        results.sort((a, b) => a.economy_fare - b.economy_fare);
      } else if (sortBy === 'price_desc') {
        results.sort((a, b) => b.economy_fare - a.economy_fare);
      } else {
        results.sort((a, b) => new Date(a.departure_time) - new Date(b.departure_time));
      }

      return res.json({
        success: true,
        count: results.length,
        flights: results
      });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Get Flight Details By ID
 */
async function getFlightById(req, res, next) {
  try {
    const flightId = parseInt(req.params.id, 10);

    if (isConnectedToMySQL() && pool) {
      const query = `
        SELECT 
          f.*,
          a_from.airport_code AS from_code,
          a_from.airport_name AS from_name,
          a_from.city AS from_city,
          a_from.country AS from_country,
          a_to.airport_code AS to_code,
          a_to.airport_name AS to_name,
          a_to.city AS to_city,
          a_to.country AS to_country,
          ac.model AS aircraft_model,
          ac.registration_number AS aircraft_registration
        FROM flights f
        JOIN airports a_from ON f.from_airport_id = a_from.id
        JOIN airports a_to ON f.to_airport_id = a_to.id
        JOIN aircraft ac ON f.aircraft_id = ac.id
        WHERE f.id = ?
      `;
      const [rows] = await pool.query(query, [flightId]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Flight not found.' });
      }

      return res.json({ success: true, flight: rows[0] });
    } else {
      const f = memoryDB.flights.find(fl => fl.id === flightId);
      if (!f) {
        return res.status(404).json({ success: false, message: 'Flight not found.' });
      }

      const a_from = memoryDB.airports.find(a => a.id === f.from_airport_id) || {};
      const a_to = memoryDB.airports.find(a => a.id === f.to_airport_id) || {};
      const ac = memoryDB.aircraft.find(a => a.id === f.aircraft_id) || {};

      const flightDetails = {
        ...f,
        from_code: a_from.airport_code,
        from_name: a_from.airport_name,
        from_city: a_from.city,
        from_country: a_from.country,
        to_code: a_to.airport_code,
        to_name: a_to.airport_name,
        to_city: a_to.city,
        to_country: a_to.country,
        aircraft_model: ac.model,
        aircraft_registration: ac.registration_number
      };

      return res.json({ success: true, flight: flightDetails });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Create New Flight
 */
async function createFlight(req, res, next) {
  try {
    const {
      flight_number,
      airline,
      aircraft_id,
      from_airport_id,
      to_airport_id,
      departure_time,
      arrival_time,
      duration,
      economy_fare,
      business_fare,
      first_class_fare,
      total_seats,
      status
    } = req.body;

    if (!flight_number || !from_airport_id || !to_airport_id || !departure_time || !arrival_time) {
      return res.status(400).json({
        success: false,
        message: 'Flight number, origin, destination, and timings are required.'
      });
    }

    if (from_airport_id === to_airport_id) {
      return res.status(400).json({
        success: false,
        message: 'Origin and destination airports cannot be the same.'
      });
    }

    const ecoFare = parseFloat(economy_fare) || 4500;
    const busFare = parseFloat(business_fare) || ecoFare * 2.5;
    const firstFare = parseFloat(first_class_fare) || ecoFare * 4.5;
    const seatsTotal = parseInt(total_seats, 10) || 116;

    if (isConnectedToMySQL() && pool) {
      const [insertResult] = await pool.query(
        `INSERT INTO flights 
        (flight_number, airline, aircraft_id, from_airport_id, to_airport_id, departure_time, arrival_time, duration, economy_fare, business_fare, first_class_fare, total_seats, available_seats, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          flight_number.toUpperCase().trim(),
          airline || 'SkyWings Airlines',
          parseInt(aircraft_id, 10) || 1,
          parseInt(from_airport_id, 10),
          parseInt(to_airport_id, 10),
          departure_time,
          arrival_time,
          duration || '2h 00m',
          ecoFare,
          busFare,
          firstFare,
          seatsTotal,
          seatsTotal,
          status || 'SCHEDULED'
        ]
      );

      const flightId = insertResult.insertId;

      // Automatically generate seat rows for this flight in MySQL
      const seatsToInsert = [];
      // First Class
      for (let r = 1; r <= 2; r++) {
        ['A', 'B', 'E', 'F'].forEach(c => seatsToInsert.push([flightId, `${r}${c}`, r, c, 'First Class', false]));
      }
      // Business
      for (let r = 3; r <= 5; r++) {
        ['A', 'B', 'C', 'D', 'E', 'F'].forEach(c => seatsToInsert.push([flightId, `${r}${c}`, r, c, 'Business', false]));
      }
      // Economy
      for (let r = 6; r <= 20; r++) {
        ['A', 'B', 'C', 'D', 'E', 'F'].forEach(c => seatsToInsert.push([flightId, `${r}${c}`, r, c, 'Economy', false]));
      }

      await pool.query(
        'INSERT INTO seats (flight_id, seat_number, row_number, column_letter, seat_class, is_occupied) VALUES ?',
        [seatsToInsert]
      );

      return res.status(201).json({
        success: true,
        message: 'Flight created successfully with configured seat map.',
        flightId
      });
    } else {
      const flightId = memoryDB.flights.length + 1;
      const newFlight = {
        id: flightId,
        flight_number: flight_number.toUpperCase().trim(),
        airline: airline || 'SkyWings Airlines',
        aircraft_id: parseInt(aircraft_id, 10) || 1,
        from_airport_id: parseInt(from_airport_id, 10),
        to_airport_id: parseInt(to_airport_id, 10),
        departure_time,
        arrival_time,
        duration: duration || '2h 00m',
        economy_fare: ecoFare,
        business_fare: busFare,
        first_class_fare: firstFare,
        total_seats: seatsTotal,
        available_seats: seatsTotal,
        status: status || 'SCHEDULED'
      };

      memoryDB.flights.push(newFlight);
      const generatedSeats = generateSeatLayoutForFlight(flightId);
      memoryDB.seats.push(...generatedSeats);

      return res.status(201).json({
        success: true,
        message: 'Flight created successfully with configured seat map.',
        flightId,
        flight: newFlight
      });
    }
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Update Flight
 */
async function updateFlight(req, res, next) {
  try {
    const flightId = parseInt(req.params.id, 10);
    const updates = req.body;

    if (isConnectedToMySQL() && pool) {
      await pool.query(
        `UPDATE flights SET 
          flight_number = COALESCE(?, flight_number),
          airline = COALESCE(?, airline),
          from_airport_id = COALESCE(?, from_airport_id),
          to_airport_id = COALESCE(?, to_airport_id),
          departure_time = COALESCE(?, departure_time),
          arrival_time = COALESCE(?, arrival_time),
          economy_fare = COALESCE(?, economy_fare),
          business_fare = COALESCE(?, business_fare),
          first_class_fare = COALESCE(?, first_class_fare),
          status = COALESCE(?, status)
        WHERE id = ?`,
        [
          updates.flight_number,
          updates.airline,
          updates.from_airport_id,
          updates.to_airport_id,
          updates.departure_time,
          updates.arrival_time,
          updates.economy_fare,
          updates.business_fare,
          updates.first_class_fare,
          updates.status,
          flightId
        ]
      );
    } else {
      const f = memoryDB.flights.find(fl => fl.id === flightId);
      if (f) {
        Object.assign(f, updates);
      }
    }

    res.json({
      success: true,
      message: 'Flight updated successfully.'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Delete Flight
 */
async function deleteFlight(req, res, next) {
  try {
    const flightId = parseInt(req.params.id, 10);

    if (isConnectedToMySQL() && pool) {
      await pool.query('DELETE FROM flights WHERE id = ?', [flightId]);
    } else {
      const idx = memoryDB.flights.findIndex(f => f.id === flightId);
      if (idx !== -1) {
        memoryDB.flights.splice(idx, 1);
        memoryDB.seats = memoryDB.seats.filter(s => s.flight_id !== flightId);
      }
    }

    res.json({
      success: true,
      message: 'Flight removed successfully.'
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getFlights,
  getFlightById,
  createFlight,
  updateFlight,
  deleteFlight
};
