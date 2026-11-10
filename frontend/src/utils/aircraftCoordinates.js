export const AIRCRAFT_SVG_COORDINATES = Object.freeze({
  originX: 112,
  originY: 610,
  scaleX: 1.035
});

export function aircraftWorldSeatToSvg(x, y, width, height) {
  const { originX, originY, scaleX } = AIRCRAFT_SVG_COORDINATES;
  return {
    x: originX + x * scaleX,
    y: originY - y - height,
    width: width * scaleX,
    height
  };
}
