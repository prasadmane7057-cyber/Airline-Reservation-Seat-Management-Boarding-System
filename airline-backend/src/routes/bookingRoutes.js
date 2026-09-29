const express = require('express');
const router = express.Router();
const {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  getAllBookings,
  updateBookingStatus
} = require('../controllers/bookingController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.post('/', authenticateToken, createBooking);
router.get('/', authenticateToken, getUserBookings);
router.get('/admin/all', authenticateToken, requireAdmin, getAllBookings);
router.get('/:id', authenticateToken, getBookingById);
router.post('/:id/cancel', authenticateToken, cancelBooking);
router.put('/:id/status', authenticateToken, requireAdmin, updateBookingStatus);

module.exports = router;
