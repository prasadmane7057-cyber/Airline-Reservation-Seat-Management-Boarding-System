const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/dashboard', authenticateToken, requireAdmin, getDashboardStats);
router.get('/statistics', authenticateToken, requireAdmin, getDashboardStats);

module.exports = router;
