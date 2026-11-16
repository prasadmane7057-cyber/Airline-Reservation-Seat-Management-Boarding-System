const { enrichBookings } = require('./bookingController');

async function getDashboardStats(req, res, next) {
  try {
    const client = req.supabase;
    const [
      { data: flights, count: totalFlights, error: flightsError },
      { data: passengers, count: totalPassengers, error: passengersError },
      { data: bookings, error: bookingsError },
      { data: seats, error: seatsError }
    ] = await Promise.all([
      client.from('flights')
        .select('id, flight_number, destination, status, created_at', { count: 'exact' }),
      client.from('passengers')
        .select('id', { count: 'exact', head: true }),
      client.from('bookings')
        .select('*')
        .order('booking_date', { ascending: false })
        .limit(100),
      client.from('seats')
        .select('seat_status')
    ]);
    for (const error of [flightsError, passengersError, bookingsError, seatsError]) {
      if (error) throw error;
    }

    const enrichedBookings = await enrichBookings(client, bookings || []);
    const confirmed = enrichedBookings.filter(booking => booking.booking_status === 'CONFIRMED');
    const cancelled = enrichedBookings.filter(booking => booking.booking_status === 'CANCELLED');
    const totalSeats = (seats || []).length;
    const availableSeats = (seats || []).filter(seat => seat.seat_status === 'AVAILABLE').length;
    const bookedSeats = (seats || []).filter(seat => seat.seat_status === 'BOOKED').length;
    const classCounts = new Map();
    confirmed.forEach(booking => {
      classCounts.set(booking.travel_class, (classCounts.get(booking.travel_class) || 0) + 1);
    });

    return res.json({
      success: true,
      stats: {
        totalFlights: totalFlights || (flights || []).length,
        totalPassengers: totalPassengers || (passengers || []).length,
        totalBookings: enrichedBookings.length,
        confirmedBookings: confirmed.length,
        cancelledBookings: cancelled.length,
        confirmedFareValue: confirmed.reduce((sum, booking) => sum + Number(booking.fare), 0),
        availableSeats,
        boardedPassengers: enrichedBookings.filter(booking => booking.booking_status === 'BOARDED').length,
        seatOccupancyRate: totalSeats
          ? Math.round((bookedSeats / totalSeats) * 100)
          : 0,
        classDistribution: [...classCounts].map(([travel_class, count]) => ({ travel_class, count })),
        recentBookings: enrichedBookings.slice(0, 6)
      },
      flights: flights || []
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboardStats
};
