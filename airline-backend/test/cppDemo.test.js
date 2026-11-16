const assert = require('node:assert/strict');
const express = require('express');
const test = require('node:test');
const academicRoutes = require('../src/routes/academicRoutes');

test('public C++ demo endpoint returns the native fixture contract', async (t) => {
  const app = express();
  app.use('/api/academic', academicRoutes);
  const server = app.listen(0);
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}/api/academic/cpp-demo`);
  assert.equal(response.status, 200);
  const payload = await response.json();

  assert.equal(payload.success, true);
  assert.equal(payload.source, 'cpp-ds-native-demo');
  assert.equal(payload.data.passengerArray.count, 10);
  assert.equal(payload.data.passengerArray.records.length, 10);
  assert.deepEqual(payload.data.seatMap.counts, {
    available: 171,
    booked: 3,
    blocked: 6
  });
  assert.deepEqual(
    [payload.data.seatMap.rows, payload.data.seatMap.columns],
    [30, 6]
  );
  assert.equal(payload.data.seatMap.statuses.length, 30);
  assert.ok(payload.data.seatMap.statuses.every((row) => row.length === 6));
  assert.equal(payload.data.waitlist.count, payload.data.waitlist.records.length);
  assert.deepEqual(payload.data.waitlist.records.map((record) => record.pnr), ['PNR201', 'PNR202']);
  assert.equal(payload.data.pnrHash.search.found, true);
  assert.equal(payload.data.searchComparison.linear.found, true);
  assert.equal(payload.data.searchComparison.binary.found, true);
  assert.match(payload.data.sortDemo.text, /QUICK SORT VS MERGE SORT/);
});
