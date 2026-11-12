const express = require('express');
const router = express.Router();
const { getSeatsByFlight, updateSeatStatus } = require('../controllers/seatController');
const { authenticateToken, optionalAuth, requireAdmin } = require('../middleware/auth');

router.get('/flight/:flightId', optionalAuth, getSeatsByFlight);
router.put('/:id', authenticateToken, requireAdmin, updateSeatStatus);

module.exports = router;
