const express = require('express');
const router = express.Router();
const { getTrendingGifs, searchGifs } = require('../controllers/gifController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/trending', getTrendingGifs);
router.get('/search', searchGifs);

module.exports = router;
