const flightStore = require('../utils/flightStore');
const bookingStore = require('../utils/bookingStore');
const userStore = require('../utils/userStore');
const seatStore = require('../utils/seatStore');

async function getDashboardStats(req, res, next) {
  try {
    const flights = flightStore.getAllFlights();
    const bookings = bookingStore.getAllBookings();
    const users = userStore.getAllUsers();

    const confirmed = bookings.filter(b => b.booking_status === 'CONFIRMED');
    const cancelled = bookings.filter(b => b.booking_status === 'CANCELLED');
    const boarded = bookings.filter(b => b.booking_status === 'BOARDED');

    const totalSeats = flights.reduce((sum, f) => sum + (f.total_seats || 116), 0);
    const bookedSeats = flights.reduce((sum, f) => sum + (f.booked_seats || 0), 0);
    const availableSeats = flights.reduce((sum, f) => sum + (f.available_seats || 0), 0);
    const confirmedFareValue = confirmed.reduce((sum, b) => sum + (Number(b.fare) || 0), 0);

    const classCounts = new Map();
    confirmed.forEach(b => {
      const cls = b.travel_class || 'Economy';
      classCounts.set(cls, (classCounts.get(cls) || 0) + 1);
    });

    return res.json({
      success: true,
      stats: {
        totalFlights: flights.length,
        totalPassengers: users.length,
        totalBookings: bookings.length,
        confirmedBookings: confirmed.length,
        cancelledBookings: cancelled.length,
        confirmedFareValue,
        availableSeats,
        boardedPassengers: boarded.length,
        seatOccupancyRate: totalSeats ? Math.round((bookedSeats / totalSeats) * 100) : 0,
        classDistribution: [...classCounts].map(([travel_class, count]) => ({ travel_class, count })),
        recentBookings: bookings.slice(0, 10)
      },
      flights
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboardStats
};
