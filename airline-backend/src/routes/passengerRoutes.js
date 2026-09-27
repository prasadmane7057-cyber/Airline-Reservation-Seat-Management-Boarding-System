const express = require('express');
const router = express.Router();
const { getPassengers, updatePassengerStatus } = require('../controllers/passengerController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, requireAdmin, getPassengers);
router.put('/:id/status', authenticateToken, requireAdmin, updatePassengerStatus);

module.exports = router;
