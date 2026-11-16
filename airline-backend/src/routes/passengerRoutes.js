const express = require('express');
const router = express.Router();
const {
  getPassengers,
  createPassenger,
  getMyPassenger,
  getPassengerById,
  updatePassenger,
  deletePassenger,
  updatePassengerStatus
} = require('../controllers/passengerController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, requireAdmin, getPassengers);
router.post('/', authenticateToken, requireAdmin, createPassenger);
router.get('/me', authenticateToken, getMyPassenger);
router.get('/:id', authenticateToken, getPassengerById);
router.put('/:id', authenticateToken, updatePassenger);
router.delete('/:id', authenticateToken, deletePassenger);
router.put('/:id/status', authenticateToken, requireAdmin, updatePassengerStatus);

module.exports = router;
