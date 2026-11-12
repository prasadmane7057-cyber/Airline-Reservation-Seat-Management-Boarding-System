function throwIfError(result) {
  if (result.error) throw result.error;
  return result.data;
}

function flightSelect() {
  return [
    '*',
    'from_airport:airports!flights_from_airport_id_fkey!inner(airport_code, airport_name, city, country)',
    'to_airport:airports!flights_to_airport_id_fkey!inner(airport_code, airport_name, city, country)',
    'aircraft(model, registration_number)'
  ].join(',');
}

function normalizeFlight(flight) {
  if (!flight) return null;
  const { from_airport, to_airport, aircraft, ...fields } = flight;
  return {
    ...fields,
    from_code: from_airport?.airport_code || '',
    from_name: from_airport?.airport_name || '',
    from_city: from_airport?.city || '',
    from_country: from_airport?.country || '',
    to_code: to_airport?.airport_code || '',
    to_name: to_airport?.airport_name || '',
    to_city: to_airport?.city || '',
    to_country: to_airport?.country || '',
    aircraft_model: aircraft?.model || 'Commercial Jet',
    aircraft_registration: aircraft?.registration_number || ''
  };
}

function bookingSelect() {
  return [
    '*',
    'flight:flights(*,from_airport:airports!flights_from_airport_id_fkey(airport_code,airport_name,city,country),to_airport:airports!flights_to_airport_id_fkey(airport_code,airport_name,city,country),aircraft(model,registration_number))',
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
  normalizeFlight,
  bookingSelect,
  flattenBooking
};
