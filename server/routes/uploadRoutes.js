const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { uploadSingle, uploadMultiple } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/single', upload.single('file'), uploadSingle);
router.post('/multiple', upload.array('files', 10), uploadMultiple);

module.exports = router;
