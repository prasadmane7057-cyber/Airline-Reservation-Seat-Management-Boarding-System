const assert = require('node:assert/strict');
const test = require('node:test');
const { supabase } = require('../src/lib/supabaseClient');
const flightController = require('../src/controllers/flightController');
const {
  bookingSelect,
  enrichBookingFlights,
  enrichFlightDetails,
  flightSelect,
  normalizeFlight
} = require('../src/lib/query');

function lookupClient(expectedIdsByTable) {
  return {
    from(table) {
      assert.ok(['airports', 'aircraft'].includes(table));
      return {
        select(columns) {
          assert.equal(
            columns,
            table === 'airports'
              ? 'id, airport_code, airport_name, city, country'
              : 'id, model, registration_number'
          );
          return {
            in(column, ids) {
              assert.equal(column, 'id');
              assert.deepEqual(ids, expectedIdsByTable[table]);
              return Promise.resolve({
                data: table === 'airports'
                  ? [
                    { id: 1, airport_code: 'BOM', airport_name: 'Mumbai Airport', city: 'Mumbai', country: 'India' },
                    { id: 2, airport_code: 'DEL', airport_name: 'Delhi Airport', city: 'Delhi', country: 'India' }
                  ]
                  : [{ id: 55, model: 'Demo Jet', registration_number: 'DEMO-1' }],
                error: null
              });
            }
          };
        }
      };
    }
  };
}

test('flight selection avoids unavailable airport relationships and enriches by airport id', async () => {
  const selection = flightSelect();
  assert.equal(selection, '*');
  assert.ok(!selection.includes('aircraft('));
  assert.ok(!bookingSelect().includes('airports('));
  assert.ok(!bookingSelect().includes('aircraft('));

  const flight = {
    id: 12,
    from_airport_id: 1,
    to_airport_id: 2,
    aircraft_id: 55,
    departure_time: '2026-11-17T10:00:00Z',
    arrival_time: '2026-11-17T12:00:00Z',
  };
  const [enriched] = await enrichFlightDetails(
    lookupClient({ airports: ['1', '2'], aircraft: ['55'] }),
    [flight]
  );
  assert.equal(enriched.from_airport.airport_code, 'BOM');
  assert.equal(enriched.to_airport.airport_code, 'DEL');
  assert.equal(normalizeFlight(enriched).from_city, 'Mumbai');
  assert.equal(normalizeFlight(enriched).to_city, 'Delhi');
  assert.equal(normalizeFlight(enriched).aircraft_model, 'Demo Jet');
  assert.equal(normalizeFlight(enriched).aircraft_registration, 'DEMO-1');
});

test('booking airport and aircraft fields are enriched without foreign-key embeds', async () => {
  const booking = {
    id: 25,
    flight: {
      id: 12,
      from_airport_id: 1,
      to_airport_id: 2,
      aircraft_id: 55,
      flight_number: 'DEMO-25'
    }
  };
  const [enriched] = await enrichBookingFlights(
    lookupClient({ airports: ['1', '2'], aircraft: ['55'] }),
    [booking]
  );
  assert.equal(enriched.flight.from_airport.airport_code, 'BOM');
  assert.equal(enriched.flight.to_airport.airport_code, 'DEL');
  assert.equal(enriched.flight.aircraft.model, 'Demo Jet');
});

test('flight airport enrichment returns nulls for missing references without querying airports', async () => {
  const flight = {
    id: 1,
    from_airport_id: null,
    to_airport_id: undefined,
    aircraft_id: null
  };
  const client = { from() { assert.fail('No airport ids should not query airports'); } };
  const [enriched] = await enrichFlightDetails(client, [flight]);
  assert.equal(enriched.from_airport, null);
  assert.equal(enriched.to_airport, null);
  assert.equal(enriched.aircraft, null);
  assert.equal(normalizeFlight(enriched).aircraft_model, null);
  assert.equal(normalizeFlight(enriched).aircraft_registration, null);
});

test('flight airport enrichment treats missing optional tables and columns as unavailable details', async () => {
  const flight = {
    id: 2,
    from_airport_id: 10,
    to_airport_id: 20,
    aircraft_id: 30
  };
  const client = {
    from(table) {
      return {
        select() {
          return {
            in() {
              const code = table === 'airports' ? 'PGRST205' : '42703';
              return Promise.resolve({
                data: null,
                error: { code, message: 'Optional lookup schema is unavailable' }
              });
            }
          };
        }
      };
    }
  };

  const [enriched] = await enrichFlightDetails(client, [flight]);
  assert.equal(enriched.from_airport, null);
  assert.equal(enriched.to_airport, null);
  assert.equal(enriched.aircraft, null);
  assert.equal(normalizeFlight(enriched).aircraft_model, null);
});

test('flight list uses only the legacy flight columns and preserves records without optional schema', async (t) => {
  const originalFrom = supabase.from;
  const legacyFlights = [
    { id: 1, flight_number: 'AI101', destination: 'Mumbai', status: 'On Time', created_at: '2026-11-16T08:00:00Z' },
    { id: 2, flight_number: 'AI202', destination: 'Delhi', status: 'Delayed', created_at: '2026-11-16T09:00:00Z' }
  ];
  let selectedColumns;
  supabase.from = (table) => {
    assert.equal(table, 'flights');
    return {
      select(columns) {
        selectedColumns = columns;
        if (columns !== '*') {
          return Promise.resolve({
            data: null,
            error: { code: '42703', message: 'column flights.departure_time does not exist' }
          });
        }
        return Promise.resolve({ data: legacyFlights, error: null });
      }
    };
  };
  t.after(() => { supabase.from = originalFrom; });

  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; }
  };
  let forwardedError;
  await flightController.getFlights({ query: {} }, response, (error) => { forwardedError = error; });

  assert.equal(forwardedError, undefined);
  assert.equal(response.statusCode, 200);
  assert.equal(selectedColumns, '*');
  assert.equal(response.payload.count, legacyFlights.length);
  assert.equal(response.payload.flights[0].flight_number, 'AI101');
  assert.equal(response.payload.flights[0].destination, 'Mumbai');
  assert.equal(response.payload.flights[0].departure_time, null);
  assert.equal(response.payload.flights[0].from_code, null);
  assert.equal(response.payload.flights[0].aircraft_model, null);
});

test('flight list rejects filters that require columns absent from the live schema', async (t) => {
  const originalFrom = supabase.from;
  supabase.from = () => assert.fail('Unsupported filters must not query nonexistent columns');
  t.after(() => { supabase.from = originalFrom; });

  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; }
  };
  await flightController.getFlights({ query: { date: '2026-11-16' } }, response, assert.fail);
  assert.equal(response.statusCode, 400);
  assert.equal(response.payload.success, false);
  assert.match(response.payload.message, /does not support/);
});
