const express = require('express');
const router = express.Router();
const {
  getSeatsByFlight,
  getAvailableSeats,
  getBookedSeats,
  createSeat,
  releaseSeat,
  updateSeatStatus
} = require('../controllers/seatController');
const { createBooking } = require('../controllers/bookingController');
const { authenticateToken, optionalAuth, requireAdmin } = require('../middleware/auth');

router.get('/flight/:flightId/available', optionalAuth, getAvailableSeats);
router.get('/flight/:flightId/booked', optionalAuth, getBookedSeats);
router.get('/flight/:flightId', optionalAuth, getSeatsByFlight);
router.post('/', authenticateToken, requireAdmin, createSeat);
router.post('/:id/reserve', authenticateToken, (req, res, next) => {
  req.body = { ...req.body, seatId: req.params.id };
  createBooking(req, res, next);
});
router.post('/:id/release', authenticateToken, releaseSeat);
router.put('/:id', authenticateToken, requireAdmin, updateSeatStatus);

module.exports = router;
