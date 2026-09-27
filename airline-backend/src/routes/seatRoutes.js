const express = require('express');
const router = express.Router();
const { getSeatsByFlight, updateSeatStatus } = require('../controllers/seatController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/flight/:flightId', getSeatsByFlight);
router.put('/:id', authenticateToken, requireAdmin, updateSeatStatus);

module.exports = router;
