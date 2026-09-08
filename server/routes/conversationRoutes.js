const express = require('express');
const router = express.Router();
const {
  getUserConversations,
  getOrCreatePrivateConversation,
  createGroupConversation,
  getConversationById,
  updateGroup,
  addMembers,
  removeMember,
  toggleAdmin,
  leaveGroup,
} = require('../controllers/conversationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getUserConversations);
router.post('/private', getOrCreatePrivateConversation);
router.post('/group', createGroupConversation);
router.get('/:id', getConversationById);
router.put('/:id', updateGroup);
router.post('/:id/members', addMembers);
router.delete('/:id/members/:memberId', removeMember);
router.put('/:id/admin/:memberId', toggleAdmin);
router.post('/:id/leave', leaveGroup);

module.exports = router;
