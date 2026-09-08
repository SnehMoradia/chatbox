const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// @desc    Global search across users, groups, and message contents
// @route   GET /api/search
// @access  Private
const globalSearch = async (req, res) => {
  try {
    const { q, type } = req.query;

    if (!q || q.trim() === '') {
      return res.status(200).json({
        success: true,
        results: { users: [], groups: [], messages: [] },
      });
    }

    const regex = new RegExp(q.trim(), 'i');
    const userConvos = await Conversation.find({ members: req.user._id }).select('_id');
    const userConvoIds = userConvos.map((c) => c._id);

    let users = [];
    let groups = [];
    let messages = [];

    // Search Users (if not restricted or type includes users)
    if (!type || type === 'all' || type === 'users') {
      users = await User.find({
        _id: { $ne: req.user._id },
        $or: [{ username: regex }, { displayName: regex }, { email: regex }],
      })
        .select('username displayName email profilePicture status bio')
        .limit(10);
    }

    // Search Groups (if not restricted or type includes groups)
    if (!type || type === 'all' || type === 'groups') {
      groups = await Conversation.find({
        type: 'group',
        members: req.user._id,
        $or: [{ name: regex }, { description: regex }],
      })
        .populate('members', 'username displayName profilePicture')
        .limit(10);
    }

    // Search Messages in user's joined conversations
    if (!type || type === 'all' || type === 'messages') {
      messages = await Message.find({
        conversationId: { $in: userConvoIds },
        content: regex,
        isDeleted: false,
      })
        .populate('senderId', 'username displayName profilePicture')
        .populate('conversationId', 'name type groupPicture members')
        .sort({ createdAt: -1 })
        .limit(25);
    }

    return res.status(200).json({
      success: true,
      query: q.trim(),
      results: {
        users,
        groups,
        messages,
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during search.',
    });
  }
};

module.exports = {
  globalSearch,
};
