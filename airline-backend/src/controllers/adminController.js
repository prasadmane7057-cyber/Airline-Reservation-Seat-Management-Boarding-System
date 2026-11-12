const { bookingSelect, flattenBooking } = require('../lib/query');

async function getDashboardStats(req, res, next) {
  try {
    const client = req.supabase;
    const [
      { count: totalFlights, error: flightsError },
      { count: totalPassengers, error: passengersError },
      { data: bookings, error: bookingsError },
      { data: flights, error: seatsError },
      { data: boarding, error: boardingError }
    ] = await Promise.all([
      client.from('flights').select('id', { count: 'exact', head: true }).not('departure_time', 'is', null),
      client.from('users').select('id', { count: 'exact', head: true }).eq('role', 'passenger'),
      client.from('bookings').select(bookingSelect()).order('booking_date', { ascending: false }),
      client.from('flights').select('total_seats, available_seats').not('departure_time', 'is', null),
      client.from('boarding').select('boarding_status')
    ]);
    for (const error of [flightsError, passengersError, bookingsError, seatsError, boardingError]) {
      if (error) throw error;
    }

    const confirmed = bookings.filter(booking => booking.booking_status === 'CONFIRMED');
    const cancelled = bookings.filter(booking => booking.booking_status === 'CANCELLED');
    const totalSeats = flights.reduce((sum, flight) => sum + Number(flight.total_seats || 0), 0);
    const availableSeats = flights.reduce((sum, flight) => sum + Number(flight.available_seats || 0), 0);
    const classCounts = new Map();
    confirmed.forEach(booking => {
      classCounts.set(booking.travel_class, (classCounts.get(booking.travel_class) || 0) + 1);
    });

    return res.json({
      success: true,
      stats: {
        totalFlights: totalFlights || 0,
        totalPassengers: totalPassengers || 0,
        totalBookings: bookings.length,
        confirmedBookings: confirmed.length,
        cancelledBookings: cancelled.length,
        totalRevenue: confirmed.reduce((sum, booking) => sum + Number(booking.total_fare || 0), 0),
        availableSeats,
        boardedPassengers: boarding.filter(row => row.boarding_status === 'BOARDED').length,
        occupancyRate: totalSeats
          ? Math.max(0, Math.min(100, Math.round(((totalSeats - availableSeats) / totalSeats) * 100)))
          : 0,
        classDistribution: [...classCounts].map(([travel_class, count]) => ({ travel_class, count })),
        recentBookings: bookings.slice(0, 6).map(flattenBooking)
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboardStats
};
