async function processPayment(req, res, next) {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'A booking ID is required.' });
    }

    const { data: booking, error: bookingError } = await req.supabase
      .from('bookings')
      .select('id, total_fare, payment_status')
      .eq('id', bookingId)
      .maybeSingle();
    if (bookingError) throw bookingError;
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    const { data: payment, error: paymentError } = await req.supabase
      .from('payments')
      .select('transaction_id, amount, payment_method, payment_status, payment_date')
      .eq('booking_id', bookingId)
      .maybeSingle();
    if (paymentError) throw paymentError;
    if (!payment) {
      return res.status(409).json({
        success: false,
        message: 'No payment record exists for this booking.'
      });
    }

    return res.json({
      success: true,
      message: 'Payment record retrieved.',
      payment: {
        transactionId: payment.transaction_id,
        amount: Number(payment.amount),
        paymentMethod: payment.payment_method,
        paymentStatus: payment.payment_status,
        timestamp: payment.payment_date,
        bookingId: booking.id
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  processPayment
};
