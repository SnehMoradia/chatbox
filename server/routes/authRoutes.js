const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateStatus,
  logout,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/status', protect, updateStatus);
router.post('/logout', protect, logout);

module.exports = router;
