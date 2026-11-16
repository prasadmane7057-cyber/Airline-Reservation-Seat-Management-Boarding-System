const express = require('express');
const router = express.Router();
const {
  getBoardingByFlight,
  getBoardingPass,
  verifyBoarding,
  updateBoardingStatus,
  selfCheckIn
} = require('../controllers/boardingController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/flight/:flightId', authenticateToken, requireAdmin, getBoardingByFlight);
router.get('/pass/:identifier', authenticateToken, getBoardingPass);
router.post('/verify', authenticateToken, requireAdmin, verifyBoarding);
router.put('/:id/status', authenticateToken, requireAdmin, updateBoardingStatus);
router.post('/checkin', authenticateToken, selfCheckIn);

module.exports = router;
