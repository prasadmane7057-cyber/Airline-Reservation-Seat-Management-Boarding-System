const express = require('express');
const { cppDemo } = require('../controllers/academicController');

const router = express.Router();

router.get('/cpp-demo', cppDemo);

module.exports = router;
