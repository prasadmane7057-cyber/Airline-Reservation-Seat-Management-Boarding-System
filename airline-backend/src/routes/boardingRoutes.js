const express = require('express');
const router = express.Router();
const {
  getBoardingByFlight,
  getBoardingPass,
  updateBoardingStatus,
  selfCheckIn
} = require('../controllers/boardingController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/flight/:flightId', authenticateToken, requireAdmin, getBoardingByFlight);
router.get('/pass/:identifier', authenticateToken, getBoardingPass);
router.put('/:id/status', authenticateToken, requireAdmin, updateBoardingStatus);
router.post('/checkin', authenticateToken, selfCheckIn);

module.exports = router;
