function processPayment(req, res) {
  return res.status(501).json({
    success: false,
    message: 'Payment processing is unavailable: no payment table or payment provider is configured.'
  });
}

module.exports = {
  processPayment
};
