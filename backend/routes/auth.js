const express = require('express');
const router  = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// POST /api/register
router.post('/register', register);

// POST /api/login
router.post('/login', login);

// GET /api/me  (requires token)
router.get('/me', verifyToken, getMe);

module.exports = router;
