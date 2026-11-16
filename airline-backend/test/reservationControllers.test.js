const assert = require('node:assert/strict');
const test = require('node:test');
const bookingController = require('../src/controllers/bookingController');
const passengerController = require('../src/controllers/passengerController');
const seatController = require('../src/controllers/seatController');

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

function makeClient({ records = {}, rpcResults = {} } = {}) {
  const rpcCalls = [];
  function recordFor(table, query) {
    const recordsForTable = records[table] || [];
    const matches = recordsForTable.filter(record => {
      const equals = query.filters.filter(filter => filter.type === 'eq');
      const inFilters = query.filters.filter(filter => filter.type === 'in');
      return equals.every(filter => String(record[filter.column]) === String(filter.value))
        && inFilters.every(filter => filter.values.map(String).includes(String(record[filter.column])));
    });
    return query.operation === 'delete' ? matches[0] || null : matches;
  }

  const client = {
    from(table) {
      const query = {
        table,
        filters: [],
        operation: 'select',
        select() { return this; },
        eq(column, value) {
          this.filters.push({ type: 'eq', column, value });
          return this;
        },
        in(column, values) {
          this.filters.push({ type: 'in', column, values });
          return this;
        },
        order() { return this; },
        limit() { return this; },
        delete() {
          this.operation = 'delete';
          return this;
        },
        maybeSingle() {
          const result = recordFor(table, this);
          return Promise.resolve({ data: Array.isArray(result) ? result[0] || null : result, error: null });
        },
        then(resolve, reject) {
          return Promise.resolve({ data: recordFor(table, this), error: null }).then(resolve, reject);
        }
      };
      return query;
    },
    async rpc(name, parameters) {
      rpcCalls.push({ name, parameters });
      return rpcResults[name] || { data: null, error: null };
    }
  };
  return { client, rpcCalls };
}

test('create booking validates passenger count before making database calls', async () => {
  const res = makeResponse();
  await bookingController.createBooking({
    body: {
      flightId: 4,
      passengers: [
        { fullName: 'Ada Lovelace', seatNumber: '12A' },
        { fullName: 'Grace Hopper', seatNumber: '12B' }
      ]
    }
  }, res, assert.fail);

  assert.equal(res.statusCode, 400);
  assert.match(res.payload.message, /one booking per passenger/);
});

test('create booking reserves the matching live seat through the atomic RPC', async () => {
  const booking = {
    id: 90,
    pnr: 'A1B2C3D4E5',
    passenger_id: 7,
    flight_id: 4,
    seat_id: 30,
    travel_class: 'Economy',
    fare: 5000,
    booking_status: 'CONFIRMED'
  };
  const { client, rpcCalls } = makeClient({
    records: {
      passengers: [{ id: 7, user_id: 'user-1', full_name: 'Ada Lovelace', email: 'ada@example.com', phone: '' }],
      seats: [{ id: 30, flight_id: 4, seat_number: '12A', seat_class: 'Economy', seat_status: 'AVAILABLE' }],
      flights: [{ id: 4, flight_number: 'AI101', destination: 'Mumbai', status: 'On Time' }]
    },
    rpcResults: {
      create_airline_booking: { data: booking, error: null }
    }
  });
  const res = makeResponse();
  await bookingController.createBooking({
    user: { id: 'user-1' },
    body: {
      flightId: 4,
      passengers: [{ fullName: 'Ada Lovelace', seatNumber: '12A' }]
    },
    supabase: client
  }, res, assert.fail);

  assert.equal(res.statusCode, 201);
  assert.equal(res.payload.booking.pnr, 'A1B2C3D4E5');
  assert.equal(res.payload.booking.passenger_name, 'Ada Lovelace');
  assert.equal(res.payload.booking.flight_number, 'AI101');
  assert.deepEqual(rpcCalls, [{
    name: 'create_airline_booking',
    parameters: {
      p_passenger_id: 7,
      p_flight_id: 4,
      p_seat_id: 30,
      p_travel_class: 'Economy'
    }
  }]);
});

test('create booking returns a conflict when the database rejects a taken seat', async () => {
  const { client } = makeClient({
    records: {
      passengers: [{ id: 7, user_id: 'user-1' }],
      seats: [{ id: 30, flight_id: 4, seat_number: '12A', seat_class: 'Economy' }]
    },
    rpcResults: {
      create_airline_booking: {
        data: null,
        error: { code: 'P0001', message: 'Seat is not available.' }
      }
    }
  });
  const res = makeResponse();
  await bookingController.createBooking({
    user: { id: 'user-1' },
    body: { flightId: 4, seatId: 30, travelClass: 'Economy' },
    supabase: client
  }, res, assert.fail);

  assert.equal(res.statusCode, 409);
  assert.match(res.payload.message, /not available/);
});

test('passenger deletion refuses to remove a passenger with bookings', async () => {
  const client = {
    from(table) {
      assert.equal(table, 'passengers');
      return {
        delete() {
          return {
            eq() {
              return {
                select() {
                  return {
                    maybeSingle: async () => ({
                      data: null,
                      error: { code: '23503', message: 'foreign key constraint violation' }
                    })
                  };
                }
              };
            }
          };
        }
      };
    }
  };
  const res = makeResponse();
  await passengerController.deletePassenger({
    params: { id: '7' },
    supabase: client
  }, res, assert.fail);

  assert.equal(res.statusCode, 409);
  assert.match(res.payload.message, /bookings reference/);
});

test('seat status API cannot mark a seat booked outside the reservation transaction', async () => {
  const res = makeResponse();
  await seatController.updateSeatStatus({
    params: { id: '30' },
    body: { is_occupied: true },
    supabase: { rpc: assert.fail }
  }, res, assert.fail);

  assert.equal(res.statusCode, 400);
  assert.match(res.payload.message, /managed by booking and cancellation/);
});
