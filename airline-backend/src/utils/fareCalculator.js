/**
 * Authoritative Backend Fare Calculator
 * Total Fare = Base Fare + Taxes (18% GST/Airport Fee) - Promotional Discount
 */

const TAX_RATE = 0.18; // 18% Aviation Taxes and Airport Development Fee
const DEFAULT_DISCOUNT = 500.00; // Flat discount per booking demo

/**
 * Calculate detailed fare breakdown for a booking
 * @param {number} flightBaseFare - base fare for selected travel class
 * @param {number} passengerCount - number of passengers
 * @param {number} customDiscount - optional promotional discount
 */
function calculateFareBreakdown(flightBaseFare, passengerCount = 1, customDiscount = 0) {
  const baseRate = parseFloat(flightBaseFare) || 0;
  const count = parseInt(passengerCount, 10) || 1;

  const totalBaseFare = Math.round(baseRate * count * 100) / 100;
  const taxAmount = Math.round(totalBaseFare * TAX_RATE * 100) / 100;
  
  // Calculate discount (apply standard academic discount if custom is 0, capped at base fare)
  let discountAmount = customDiscount > 0 ? customDiscount : DEFAULT_DISCOUNT;
  if (discountAmount > totalBaseFare) {
    discountAmount = totalBaseFare;
  }
  discountAmount = Math.round(discountAmount * 100) / 100;

  const totalFare = Math.round((totalBaseFare + taxAmount - discountAmount) * 100) / 100;

  return {
    baseFare: totalBaseFare,
    taxAmount: taxAmount,
    discountAmount: discountAmount,
    totalFare: totalFare,
    taxRatePercentage: 18,
    passengerCount: count
  };
}

module.exports = {
  calculateFareBreakdown,
  TAX_RATE,
  DEFAULT_DISCOUNT
};
