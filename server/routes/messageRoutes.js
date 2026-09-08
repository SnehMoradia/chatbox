const express = require('express');
const router = express.Router();
const {
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  toggleReaction,
  togglePin,
  forwardMessage,
  markAsRead,
  getConversationMedia,
  clearChat,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/:conversationId', getMessages);
router.post('/', sendMessage);
router.delete('/:conversationId/clear', clearChat);
router.put('/:id', editMessage);
router.delete('/:id', deleteMessage);
router.post('/:id/react', toggleReaction);
router.post('/:id/pin', togglePin);
router.post('/:id/forward', forwardMessage);
router.put('/:conversationId/read', markAsRead);
router.get('/:conversationId/media', getConversationMedia);

module.exports = router;
