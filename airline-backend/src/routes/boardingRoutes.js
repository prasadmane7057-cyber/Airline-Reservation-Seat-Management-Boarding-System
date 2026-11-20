const express = require('express');
const router = express.Router();
const {
  getBoardingByFlight,
  getBoardingPass,
  verifyBoarding,
  updateBoardingStatus,
  selfCheckIn
} = require('../controllers/boardingController');
const { authenticateToken, optionalAuth, requireAdmin } = require('../middleware/auth');

router.get('/flight/:flightId', authenticateToken, requireAdmin, getBoardingByFlight);
router.get('/pass/:identifier', optionalAuth, getBoardingPass);
router.post('/verify', authenticateToken, requireAdmin, verifyBoarding);
router.put('/:id/status', authenticateToken, requireAdmin, updateBoardingStatus);
router.post('/checkin', optionalAuth, selfCheckIn);

module.exports = router;
