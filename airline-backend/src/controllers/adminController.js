const { pool, memoryDB, isConnectedToMySQL } = require('../config/db');

/**
 * Get Admin Dashboard Summary Statistics (Computed directly from DB)
 */
async function getDashboardStats(req, res, next) {
  try {
    if (isConnectedToMySQL() && pool) {
      // 1. Flight Counts
      const [[{ total_flights }]] = await pool.query('SELECT COUNT(*) AS total_flights FROM flights');
      
      // 2. Passenger Counts
      const [[{ total_passengers }]] = await pool.query("SELECT COUNT(*) AS total_passengers FROM users WHERE role = 'passenger'");

      // 3. Booking Counts & Revenue
      const [[bookingStats]] = await pool.query(`
        SELECT 
          COUNT(*) AS total_bookings,
          SUM(CASE WHEN booking_status = 'CONFIRMED' THEN 1 ELSE 0 END) AS confirmed_bookings,
          SUM(CASE WHEN booking_status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_bookings,
          SUM(CASE WHEN booking_status = 'CONFIRMED' THEN total_fare ELSE 0 END) AS total_revenue
        FROM bookings
      `);

      // 4. Seats and Boarding
      const [[{ available_seats }]] = await pool.query('SELECT SUM(available_seats) AS available_seats FROM flights');
      const [[{ total_seats }]] = await pool.query('SELECT SUM(total_seats) AS total_seats FROM flights');
      const [[{ boarded_passengers }]] = await pool.query("SELECT COUNT(*) AS boarded_passengers FROM boarding WHERE boarding_status = 'BOARDED'");

      // 5. Bookings by travel class
      const [classDistribution] = await pool.query(`
        SELECT travel_class, COUNT(*) AS count
        FROM bookings
        WHERE booking_status = 'CONFIRMED'
        GROUP BY travel_class
      `);

      // 6. Recent bookings
      const [recentBookings] = await pool.query(`
        SELECT 
          b.id, b.pnr, b.total_fare, b.booking_status, b.travel_class, b.booking_date,
          f.flight_number, u.name AS passenger_name, a_from.airport_code AS from_code, a_to.airport_code AS to_code
        FROM bookings b
        JOIN flights f ON b.flight_id = f.id
        JOIN users u ON b.user_id = u.id
        JOIN airports a_from ON f.from_airport_id = a_from.id
        JOIN airports a_to ON f.to_airport_id = a_to.id
        ORDER BY b.booking_date DESC
        LIMIT 6
      `);

      const totalSeatsCount = parseInt(total_seats, 10) || 1;
      const occupiedSeats = totalSeatsCount - (parseInt(available_seats, 10) || 0);
      const occupancyRate = Math.round((occupiedSeats / totalSeatsCount) * 100);

      return res.json({
        success: true,
        stats: {
          totalFlights: parseInt(total_flights, 10) || 0,
          totalPassengers: parseInt(total_passengers, 10) || 0,
          totalBookings: parseInt(bookingStats.total_bookings, 10) || 0,
          confirmedBookings: parseInt(bookingStats.confirmed_bookings, 10) || 0,
          cancelledBookings: parseInt(bookingStats.cancelled_bookings, 10) || 0,
          totalRevenue: parseFloat(bookingStats.total_revenue) || 0,
          availableSeats: parseInt(available_seats, 10) || 0,
          boardedPassengers: parseInt(boarded_passengers, 10) || 0,
          occupancyRate: Math.max(0, Math.min(100, occupancyRate)),
          classDistribution,
          recentBookings
        }
      });
    } else {
      // Memory DB calculation
      const totalFlights = memoryDB.flights.length;
      const totalPassengers = memoryDB.users.filter(u => u.role === 'passenger').length;
      const totalBookings = memoryDB.bookings.length;
      const confirmedBookings = memoryDB.bookings.filter(b => b.booking_status === 'CONFIRMED').length;
      const cancelledBookings = memoryDB.bookings.filter(b => b.booking_status === 'CANCELLED').length;
      const totalRevenue = memoryDB.bookings
        .filter(b => b.booking_status === 'CONFIRMED')
        .reduce((sum, b) => sum + parseFloat(b.total_fare || 0), 0);

      const availableSeats = memoryDB.flights.reduce((sum, f) => sum + (f.available_seats || 0), 0);
      const totalSeats = memoryDB.flights.reduce((sum, f) => sum + (f.total_seats || 116), 0);
      const boardedPassengers = memoryDB.boarding.filter(bd => bd.boarding_status === 'BOARDED').length;

      const occupancyRate = Math.round(((totalSeats - availableSeats) / (totalSeats || 1)) * 100);

      // Class distribution
      const classMap = {};
      memoryDB.bookings.filter(b => b.booking_status === 'CONFIRMED').forEach(b => {
        classMap[b.travel_class] = (classMap[b.travel_class] || 0) + 1;
      });
      const classDistribution = Object.keys(classMap).map(c => ({ travel_class: c, count: classMap[c] }));

      // Recent Bookings
      const recentBookings = [...memoryDB.bookings]
        .sort((a, b) => new Date(b.booking_date) - new Date(a.booking_date))
        .slice(0, 6)
        .map(b => {
          const flight = memoryDB.flights.find(f => f.id === b.flight_id) || {};
          const u = memoryDB.users.find(usr => usr.id === b.user_id) || {};
          const a_from = memoryDB.airports.find(a => a.id === flight.from_airport_id) || {};
          const a_to = memoryDB.airports.find(a => a.id === flight.to_airport_id) || {};
          return {
            id: b.id,
            pnr: b.pnr,
            total_fare: b.total_fare,
            booking_status: b.booking_status,
            travel_class: b.travel_class,
            booking_date: b.booking_date,
            flight_number: flight.flight_number || 'AI000',
            passenger_name: u.name || 'Passenger',
            from_code: a_from.airport_code || 'BOM',
            to_code: a_to.airport_code || 'DEL'
          };
        });

      return res.json({
        success: true,
        stats: {
          totalFlights,
          totalPassengers,
          totalBookings,
          confirmedBookings,
          cancelledBookings,
          totalRevenue,
          availableSeats,
          boardedPassengers,
          occupancyRate: Math.max(0, Math.min(100, occupancyRate)),
          classDistribution,
          recentBookings
        }
      });
    }
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboardStats
};
