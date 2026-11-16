const assert = require('node:assert/strict');
const test = require('node:test');
const { getDashboardStats } = require('../src/controllers/adminController');

function makeResponse() {
  return {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };
}

function makeSupabase(records) {
  return {
    from(table) {
      const query = { filters: [], options: {} };
      query.select = function select(_columns, options = {}) {
        this.options = options;
        return this;
      };
      query.in = function inFilter(column, values) {
        this.filters.push({ column, values: values.map(String) });
        return this;
      };
      query.order = function order() { return this; };
      query.limit = function limit() { return this; };
      query.then = function then(resolve, reject) {
        const rows = (records[table] || []).filter(record =>
          this.filters.every(filter => filter.values.includes(String(record[filter.column])))
        );
        return Promise.resolve({
          data: this.options.head ? null : rows,
          count: this.options.count ? rows.length : null,
          error: null
        }).then(resolve, reject);
      };
      return query;
    }
  };
}

test('dashboard reports reservation fare and booked-seat occupancy, not payment revenue or aircraft capacity', async () => {
  const supabase = makeSupabase({
    flights: [{ id: 2, flight_number: 'DEMO-1', destination: 'Example', status: 'SCHEDULED' }],
    passengers: [{ id: 1, full_name: 'Example Passenger', email: 'person@example.test' }],
    seats: [
      { id: 10, seat_status: 'BOOKED' },
      { id: 11, seat_status: 'AVAILABLE' },
      { id: 12, seat_status: 'BLOCKED' }
    ],
    bookings: [
      { id: 20, passenger_id: 1, flight_id: 2, seat_id: 10, travel_class: 'Economy', fare: 5000, booking_status: 'CONFIRMED' },
      { id: 21, passenger_id: 1, flight_id: 2, seat_id: 11, travel_class: 'Business', fare: 10000, booking_status: 'CANCELLED' },
      { id: 22, passenger_id: 1, flight_id: 2, seat_id: 12, travel_class: 'First Class', fare: 20000, booking_status: 'BOARDED' }
    ]
  });
  const res = makeResponse();

  await getDashboardStats({ supabase }, res, assert.fail);

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.stats.confirmedFareValue, 5000);
  assert.equal(res.payload.stats.seatOccupancyRate, 33);
  assert.equal(res.payload.stats.availableSeats, 1);
  assert.equal(res.payload.stats.cancelledBookings, 1);
  assert.equal(res.payload.stats.boardedPassengers, 1);
  assert.equal('totalRevenue' in res.payload.stats, false);
});
