/**
 * Academic Payment Simulation Controller
 */
async function processPayment(req, res, next) {
  try {
    const { bookingId, amount, paymentMethod = 'Credit Card' } = req.body;

    const transactionId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return res.json({
      success: true,
      message: 'Simulated payment completed successfully.',
      payment: {
        transactionId,
        amount: parseFloat(amount) || 0,
        paymentMethod,
        paymentStatus: 'SUCCESS',
        timestamp: new Date().toISOString(),
        bookingId
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  processPayment
};
