const { execFile } = require('child_process');
const path = require('path');

const executablePath = path.join(
  __dirname,
  '..',
  '..',
  'bin',
  `cpp-ds-native-demo${process.platform === 'win32' ? '.exe' : ''}`
);
const MAX_OUTPUT_BYTES = 256 * 1024;
const TIMEOUT_MS = 5000;

function isRecord(value, fields) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) &&
    fields.every((field) => Object.prototype.hasOwnProperty.call(value, field));
}

function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function isString(value) {
  return typeof value === 'string';
}

function validatePayload(payload) {
  if (!isRecord(payload, ['success', 'source', 'data']) ||
      payload.success !== true || payload.source !== 'cpp-ds-native-demo') return false;

  const data = payload.data;
  if (!isRecord(data, [
    'passengerArray', 'seatMap', 'waitlist', 'pnrHash',
    'searchComparison', 'sortDemo'
  ])) return false;

  const passengers = data.passengerArray;
  const seats = data.seatMap;
  const waitlist = data.waitlist;
  const hash = data.pnrHash;
  const search = data.searchComparison;
  if (!isRecord(passengers, ['count', 'records']) ||
      !isNonNegativeInteger(passengers.count) || !Array.isArray(passengers.records) ||
      passengers.records.length !== passengers.count ||
      !passengers.records.every((record) => isRecord(record, [
        'pnr', 'name', 'age', 'gender', 'contact', 'seatNo', 'travelClass'
      ]) && isString(record.pnr) && isString(record.name) &&
        Number.isInteger(record.age) && isString(record.gender) &&
        isString(record.contact) && Number.isInteger(record.seatNo) &&
        isString(record.travelClass))) return false;

  if (!isRecord(seats, ['rows', 'columns', 'counts', 'statuses']) ||
      seats.rows !== 30 || seats.columns !== 6 ||
      !isRecord(seats.counts, ['available', 'booked', 'blocked']) ||
      !Array.isArray(seats.statuses) || seats.statuses.length !== seats.rows ||
      !seats.statuses.every((row) => Array.isArray(row) && row.length === seats.columns &&
        row.every((status) => Number.isInteger(status) && status >= 0 && status <= 2)) ||
      !['available', 'booked', 'blocked'].every((key) => isNonNegativeInteger(seats.counts[key]))) {
    return false;
  }
  const seatCounts = [0, 0, 0];
  for (const row of seats.statuses) {
    for (const status of row) seatCounts[status] += 1;
  }
  if (seatCounts[0] !== seats.counts.available ||
      seatCounts[1] !== seats.counts.booked ||
      seatCounts[2] !== seats.counts.blocked) return false;

  if (!isRecord(waitlist, ['count', 'records']) ||
      !isNonNegativeInteger(waitlist.count) || !Array.isArray(waitlist.records) ||
      waitlist.records.length !== waitlist.count ||
      !waitlist.records.every((record) => isRecord(record, ['pnr', 'name']) &&
        isString(record.pnr) && isString(record.name))) return false;

  if (!isRecord(hash, ['count', 'capacity', 'collisions', 'loadFactor', 'search']) ||
      !isNonNegativeInteger(hash.count) || !Number.isInteger(hash.capacity) ||
      hash.capacity <= 0 || !isNonNegativeInteger(hash.collisions) ||
      typeof hash.loadFactor !== 'number' || !Number.isFinite(hash.loadFactor) ||
      !isRecord(hash.search, ['target', 'found', 'record', 'steps']) ||
      !isString(hash.search.target) || typeof hash.search.found !== 'boolean' ||
      !isNonNegativeInteger(hash.search.steps) ||
      !isRecord(hash.search.record, [
        'pnr', 'passengerName', 'flightNumber', 'seatNumber',
        'travelClass', 'status', 'fare'
      ]) || ![
        hash.search.record.pnr,
        hash.search.record.passengerName,
        hash.search.record.flightNumber,
        hash.search.record.seatNumber,
        hash.search.record.travelClass,
        hash.search.record.status
      ].every(isString) || typeof hash.search.record.fare !== 'number' ||
      !Number.isFinite(hash.search.record.fare)) return false;

  const comparisonFields = ['found', 'index', 'comparisons'];
  const validResult = (result) => isRecord(result, comparisonFields) &&
    typeof result.found === 'boolean' && Number.isInteger(result.index) &&
    isNonNegativeInteger(result.comparisons);
  return isRecord(search, ['targetPnr', 'datasetSize', 'linear', 'binary']) &&
    isString(search.targetPnr) && isNonNegativeInteger(search.datasetSize) &&
    validResult(search.linear) && validResult(search.binary) &&
    isRecord(data.sortDemo, ['text']) && isString(data.sortDemo.text);
}

function cppDemo(req, res) {
  execFile(executablePath, [], {
    cwd: path.dirname(executablePath),
    timeout: TIMEOUT_MS,
    maxBuffer: MAX_OUTPUT_BYTES,
    windowsHide: true,
    encoding: 'utf8'
  }, (error, stdout) => {
    if (error) {
      return res.status(503).json({
        success: false,
        code: 'NATIVE_CPP_DEMO_FAILED',
        message: 'The native C++ demo could not run. Verify the deployment build and toolchain.'
      });
    }

    let payload;
    try {
      payload = JSON.parse(stdout);
    } catch (parseError) {
      return res.status(502).json({
        success: false,
        code: 'NATIVE_CPP_DEMO_INVALID_OUTPUT',
        message: 'The native C++ demo returned invalid JSON.'
      });
    }

    if (!validatePayload(payload)) {
      return res.status(502).json({
        success: false,
        code: 'NATIVE_CPP_DEMO_INVALID_OUTPUT',
        message: 'The native C++ demo response did not match the expected contract.'
      });
    }
    return res.json(payload);
  });
}

module.exports = { cppDemo };
