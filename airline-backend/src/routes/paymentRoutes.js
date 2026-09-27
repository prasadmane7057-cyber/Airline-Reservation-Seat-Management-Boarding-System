const express = require('express');
const router = express.Router();
const { processPayment } = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, processPayment);

module.exports = router;
