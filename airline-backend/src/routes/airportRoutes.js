const express = require('express');
const router = express.Router();
const { getAirports, createAirport, updateAirport, deleteAirport } = require('../controllers/airportController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', getAirports);
router.post('/', authenticateToken, requireAdmin, createAirport);
router.put('/:id', authenticateToken, requireAdmin, updateAirport);
router.delete('/:id', authenticateToken, requireAdmin, deleteAirport);

module.exports = router;
