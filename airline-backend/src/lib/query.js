function throwIfError(result) {
  if (result.error) throw result.error;
  return result.data;
}

function flightSelect() {
  return '*';
}

async function lookupOptionalRows(client, table, columns, ids) {
  const { data, error } = await client
    .from(table)
    .select(columns)
    .in('id', ids);
  if (error && ['PGRST204', 'PGRST205', '42703', '42P01'].includes(error.code)) {
    return [];
  }
  if (error) throw error;
  return data || [];
}

async function enrichFlightAirports(client, flights) {
  const rows = Array.isArray(flights) ? flights : flights ? [flights] : [];
  const airportIds = [...new Set(rows.flatMap(flight => [
    flight.from_airport_id,
    flight.to_airport_id
  ]).filter(id => id !== null && id !== undefined).map(String))];
  const airportsById = new Map();

  if (airportIds.length) {
    const airports = await lookupOptionalRows(
      client,
      'airports',
      'id, airport_code, airport_name, city, country',
      airportIds
    );
    for (const airport of airports || []) {
      airportsById.set(String(airport.id), airport);
    }
  }

  return rows.map(flight => ({
    ...flight,
    from_airport: airportsById.get(String(flight.from_airport_id)) || null,
    to_airport: airportsById.get(String(flight.to_airport_id)) || null
  }));
}

async function enrichFlightAircraft(client, flights) {
  const rows = Array.isArray(flights) ? flights : flights ? [flights] : [];
  const aircraftIds = [...new Set(rows
    .map(flight => flight.aircraft_id)
    .filter(id => id !== null && id !== undefined)
    .map(String))];
  const aircraftById = new Map();

  if (aircraftIds.length) {
    const aircraft = await lookupOptionalRows(
      client,
      'aircraft',
      'id, model, registration_number',
      aircraftIds
    );
    for (const item of aircraft || []) {
      aircraftById.set(String(item.id), item);
    }
  }

  return rows.map(flight => ({
    ...flight,
    aircraft: aircraftById.get(String(flight.aircraft_id)) || null
  }));
}

async function enrichFlightDetails(client, flights) {
  const rows = Array.isArray(flights) ? flights : flights ? [flights] : [];
  const [withAirports, withAircraft] = await Promise.all([
    enrichFlightAirports(client, rows),
    enrichFlightAircraft(client, rows)
  ]);
  return withAirports.map((flight, index) => ({
    ...flight,
    aircraft: withAircraft[index].aircraft
  }));
}

async function enrichBookingFlights(client, bookings) {
  const rows = Array.isArray(bookings) ? bookings : bookings ? [bookings] : [];
  const flightValues = rows.map(booking => booking.flight);
  const flights = flightValues.flatMap(value =>
    Array.isArray(value) ? value : value ? [value] : []
  );
  const enrichedFlights = await enrichFlightDetails(client, flights);
  const flightsById = new Map(
    enrichedFlights.map(flight => [String(flight.id), flight])
  );
  const enrichFlight = flight => flight
    ? flightsById.get(String(flight.id)) || { ...flight, from_airport: null, to_airport: null }
    : null;

  return rows.map((booking, index) => ({
    ...booking,
    flight: Array.isArray(flightValues[index])
      ? flightValues[index].map(enrichFlight)
      : enrichFlight(flightValues[index])
  }));
}

function normalizeFlight(flight) {
  if (!flight) return null;
  const { from_airport, to_airport, aircraft, ...fields } = flight;
  return {
    ...fields,
    airline: flight.airline ?? null,
    from_airport_id: flight.from_airport_id ?? null,
    to_airport_id: flight.to_airport_id ?? null,
    aircraft_id: flight.aircraft_id ?? null,
    departure_time: flight.departure_time ?? null,
    arrival_time: flight.arrival_time ?? null,
    duration: flight.duration ?? null,
    economy_fare: flight.economy_fare ?? null,
    business_fare: flight.business_fare ?? null,
    first_class_fare: flight.first_class_fare ?? null,
    total_seats: flight.total_seats ?? null,
    available_seats: flight.available_seats ?? null,
    from_code: from_airport?.airport_code ?? null,
    from_name: from_airport?.airport_name ?? null,
    from_city: from_airport?.city ?? null,
    from_country: from_airport?.country ?? null,
    to_code: to_airport?.airport_code ?? null,
    to_name: to_airport?.airport_name ?? null,
    to_city: to_airport?.city ?? null,
    to_country: to_airport?.country ?? null,
    aircraft_model: aircraft?.model ?? null,
    aircraft_registration: aircraft?.registration_number ?? null
  };
}

function bookingSelect() {
  return [
    '*',
    'flight:flights(*)',
    'user:users!bookings_user_id_fkey(name,email)',
    'passengers:booking_passengers(*,boarding(*))',
    'payment:payments(transaction_id,payment_method,payment_date,payment_status)'
  ].join(',');
}

function flattenBooking(booking) {
  const flight = normalizeFlight(booking.flight);
  const passengers = (booking.passengers || []).map(passenger => {
    const boarding = Array.isArray(passenger.boarding) ? passenger.boarding[0] : passenger.boarding;
    return {
      ...passenger,
      check_in_status: boarding?.check_in_status || 'NOT_CHECKED_IN',
      boarding_status: boarding?.boarding_status || 'NOT_CHECKED_IN',
      gate: boarding?.gate || 'Gate 3B',
      boarding_group: boarding?.boarding_group || 'Group 2',
      boarding_time: boarding?.boarding_time || flight?.departure_time
    };
  });
  const payment = Array.isArray(booking.payment) ? booking.payment[0] : booking.payment;
  return {
    ...booking,
    flight_number: flight?.flight_number,
    airline: flight?.airline,
    departure_time: flight?.departure_time,
    arrival_time: flight?.arrival_time,
    duration: flight?.duration,
    from_code: flight?.from_code,
    from_name: flight?.from_name,
    from_city: flight?.from_city,
    to_code: flight?.to_code,
    to_name: flight?.to_name,
    to_city: flight?.to_city,
    passenger_name: booking.user?.name,
    passenger_email: booking.user?.email,
    transaction_id: payment?.transaction_id,
    payment_method: payment?.payment_method,
    payment_date: payment?.payment_date,
    passenger_summary: passengers.map(p => `${p.full_name} (${p.seat_number})`).join(', '),
    seat_numbers: passengers.map(p => p.seat_number).join(', '),
    seats: passengers.map(p => p.seat_number).join(', '),
    passengers
  };
}

module.exports = {
  throwIfError,
  flightSelect,
  lookupOptionalRows,
  enrichFlightAirports,
  enrichFlightAircraft,
  enrichFlightDetails,
  enrichBookingFlights,
  normalizeFlight,
  bookingSelect,
  flattenBooking
};
