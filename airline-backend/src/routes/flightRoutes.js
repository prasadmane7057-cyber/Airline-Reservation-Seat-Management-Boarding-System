const express = require('express');
const router = express.Router();
const { getFlights, getFlightById, createFlight, updateFlight, deleteFlight } = require('../controllers/flightController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', getFlights);
router.get('/:id', getFlightById);
router.post('/', authenticateToken, requireAdmin, createFlight);
router.put('/:id', authenticateToken, requireAdmin, updateFlight);
router.delete('/:id', authenticateToken, requireAdmin, deleteFlight);

module.exports = router;
