import assert from 'node:assert/strict';
import test from 'node:test';
import { aircraftWorldSeatToSvg } from '../src/utils/aircraftCoordinates.js';

test('maps aircraft world-space seat bounds into the dashboard SVG viewBox', () => {
  const firstSeat = aircraftWorldSeatToSvg(95, 320, 20, 12);

  assert.ok(Math.abs(firstSeat.x - 210.325) < 1e-9);
  assert.equal(firstSeat.y, 278);
  assert.ok(Math.abs(firstSeat.width - 20.7) < 1e-9);
  assert.equal(firstSeat.height, 12);
});

test('keeps projected seat bounds within the shared aircraft canvas', () => {
  const tailSeat = aircraftWorldSeatToSvg(390 + 8 * 48, 252, 20, 12);

  assert.ok(tailSeat.x >= 0);
  assert.ok(tailSeat.x + tailSeat.width <= 1200);
  assert.ok(tailSeat.y >= 0);
  assert.ok(tailSeat.y + tailSeat.height <= 620);
});
