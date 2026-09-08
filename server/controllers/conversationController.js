const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Get all conversations for logged in user
// @route   GET /api/conversations
// @access  Private
const getUserConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      members: req.user._id,
    })
      .populate('members', 'username displayName email profilePicture status lastSeen bio')
      .populate('admins', 'username displayName email profilePicture')
      .populate('createdBy', 'username displayName email')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'senderId',
          select: 'username displayName profilePicture',
        },
      })
      .populate('pinnedMessages')
      .sort({ updatedAt: -1 });

    // Calculate unread counts for each conversation
    const conversationWithUnread = await Promise.all(
      conversations.map(async (convo) => {
        const unreadCount = await Message.countDocuments({
          conversationId: convo._id,
          senderId: { $ne: req.user._id },
          'readBy.userId': { $ne: req.user._id },
          isDeleted: false,
        });

        const convoObj = convo.toObject();
        convoObj.unreadCount = unreadCount;
        return convoObj;
      })
    );

    return res.status(200).json({
      success: true,
      conversations: conversationWithUnread,
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching conversations.',
    });
  }
};

// @desc    Get or create a 1-on-1 private conversation
// @route   POST /api/conversations/private
// @access  Private
const getOrCreatePrivateConversation = async (req, res) => {
  try {
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID is required.',
      });
    }

    if (recipientId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create a private conversation with yourself.',
      });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient user not found.',
      });
    }

    // Check if conversation already exists between these 2 users
    let conversation = await Conversation.findOne({
      type: 'private',
      members: { $all: [req.user._id, recipientId], $size: 2 },
    })
      .populate('members', 'username displayName email profilePicture status lastSeen bio')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'senderId',
          select: 'username displayName profilePicture',
        },
      })
      .populate('pinnedMessages');

    if (!conversation) {
      // Create new private conversation
      conversation = await Conversation.create({
        type: 'private',
        members: [req.user._id, recipientId],
        createdBy: req.user._id,
      });

      conversation = await Conversation.findById(conversation._id)
        .populate('members', 'username displayName email profilePicture status lastSeen bio')
        .populate({
          path: 'lastMessage',
          populate: {
            path: 'senderId',
            select: 'username displayName profilePicture',
          },
        });
    }

    const convoObj = conversation.toObject();
    convoObj.unreadCount = 0;

    return res.status(200).json({
      success: true,
      conversation: convoObj,
    });
  } catch (error) {
    console.error('Private conversation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error initiating private conversation.',
    });
  }
};

// @desc    Create a new group conversation
// @route   POST /api/conversations/group
// @access  Private
const createGroupConversation = async (req, res) => {
  try {
    const { name, description, groupPicture, members } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Group name is required.',
      });
    }

    // Ensure member list includes current user and has at least 1 other member
    const memberSet = new Set(Array.isArray(members) ? members : []);
    memberSet.add(req.user._id.toString());

    if (memberSet.size < 2) {
      return res.status(400).json({
        success: false,
        message: 'A group must have at least 2 members.',
      });
    }

    const newGroup = await Conversation.create({
      type: 'group',
      name: name.trim(),
      description: description ? description.trim() : '',
      groupPicture: groupPicture || '',
      members: Array.from(memberSet),
      admins: [req.user._id],
      createdBy: req.user._id,
    });

    const populatedGroup = await Conversation.findById(newGroup._id)
      .populate('members', 'username displayName email profilePicture status lastSeen bio')
      .populate('admins', 'username displayName email profilePicture')
      .populate('createdBy', 'username displayName email');

    const groupObj = populatedGroup.toObject();
    groupObj.unreadCount = 0;

    return res.status(201).json({
      success: true,
      conversation: groupObj,
    });
  } catch (error) {
    console.error('Create group error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating group.',
    });
  }
};

// @desc    Get single conversation by ID
// @route   GET /api/conversations/:id
// @access  Private
const getConversationById = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('members', 'username displayName email profilePicture status lastSeen bio')
      .populate('admins', 'username displayName email profilePicture')
      .populate('createdBy', 'username displayName email')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'senderId',
          select: 'username displayName profilePicture',
        },
      })
      .populate('pinnedMessages');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    // Check user membership
    const isMember = conversation.members.some(
      (m) => m._id.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this conversation.',
      });
    }

    return res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving conversation.',
    });
  }
};

// @desc    Update group details (name, description, groupPicture)
// @route   PUT /api/conversations/:id
// @access  Private
const updateGroup = async (req, res) => {
  try {
    const { name, description, groupPicture } = req.body;
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation || conversation.type !== 'group') {
      return res.status(404).json({
        success: false,
        message: 'Group conversation not found.',
      });
    }

    // Check membership
    const isMember = conversation.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group.',
      });
    }

    if (name && name.trim()) conversation.name = name.trim();
    if (description !== undefined) conversation.description = description.trim();
    if (groupPicture !== undefined) conversation.groupPicture = groupPicture;

    await conversation.save();

    const updated = await Conversation.findById(conversation._id)
      .populate('members', 'username displayName email profilePicture status lastSeen bio')
      .populate('admins', 'username displayName email profilePicture')
      .populate('createdBy', 'username displayName email');

    return res.status(200).json({
      success: true,
      conversation: updated,
    });
  } catch (error) {
    console.error('Update group error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating group.',
    });
  }
};

// @desc    Add member(s) to group
// @route   POST /api/conversations/:id/members
// @access  Private
const addMembers = async (req, res) => {
  try {
    const { memberIds } = req.body; // array of User IDs
    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide memberIds array.',
      });
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation || conversation.type !== 'group') {
      return res.status(404).json({
        success: false,
        message: 'Group conversation not found.',
      });
    }

    // Only existing members can add others
    const isMember = conversation.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Only group members can add others.',
      });
    }

    // Add unique new members
    memberIds.forEach((id) => {
      if (!conversation.members.some((m) => m.toString() === id)) {
        conversation.members.push(id);
      }
    });

    await conversation.save();

    const updated = await Conversation.findById(conversation._id)
      .populate('members', 'username displayName email profilePicture status lastSeen bio')
      .populate('admins', 'username displayName email profilePicture')
      .populate('createdBy', 'username displayName email');

    return res.status(200).json({
      success: true,
      conversation: updated,
    });
  } catch (error) {
    console.error('Add members error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error adding members.',
    });
  }
};

// @desc    Remove member from group
// @route   DELETE /api/conversations/:id/members/:memberId
// @access  Private
const removeMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation || conversation.type !== 'group') {
      return res.status(404).json({
        success: false,
        message: 'Group conversation not found.',
      });
    }

    const isAdmin = conversation.admins.some(
      (a) => a.toString() === req.user._id.toString()
    );
    const isSelf = req.user._id.toString() === memberId;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can remove other members.',
      });
    }

    // Remove from members and admins
    conversation.members = conversation.members.filter(
      (m) => m.toString() !== memberId
    );
    conversation.admins = conversation.admins.filter(
      (a) => a.toString() !== memberId
    );

    // If no members remain, optionally delete or keep
    if (conversation.members.length > 0 && conversation.admins.length === 0) {
      conversation.admins.push(conversation.members[0]);
    }

    await conversation.save();

    const updated = await Conversation.findById(conversation._id)
      .populate('members', 'username displayName email profilePicture status lastSeen bio')
      .populate('admins', 'username displayName email profilePicture')
      .populate('createdBy', 'username displayName email');

    return res.status(200).json({
      success: true,
      conversation: updated,
    });
  } catch (error) {
    console.error('Remove member error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error removing member.',
    });
  }
};

// @desc    Toggle admin status of a group member
// @route   PUT /api/conversations/:id/admin/:memberId
// @access  Private
const toggleAdmin = async (req, res) => {
  try {
    const { memberId } = req.params;
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation || conversation.type !== 'group') {
      return res.status(404).json({
        success: false,
        message: 'Group conversation not found.',
      });
    }

    const isCurrentAdmin = conversation.admins.some(
      (a) => a.toString() === req.user._id.toString()
    );
    if (!isCurrentAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can change member roles.',
      });
    }

    const isTargetAdmin = conversation.admins.some(
      (a) => a.toString() === memberId
    );

    if (isTargetAdmin) {
      // Demote
      if (conversation.admins.length <= 1) {
        return res.status(400).json({
          success: false,
          message: 'The group must have at least one admin.',
        });
      }
      conversation.admins = conversation.admins.filter(
        (a) => a.toString() !== memberId
      );
    } else {
      // Promote
      conversation.admins.push(memberId);
    }

    await conversation.save();

    const updated = await Conversation.findById(conversation._id)
      .populate('members', 'username displayName email profilePicture status lastSeen bio')
      .populate('admins', 'username displayName email profilePicture')
      .populate('createdBy', 'username displayName email');

    return res.status(200).json({
      success: true,
      conversation: updated,
    });
  } catch (error) {
    console.error('Toggle admin error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error modifying admin status.',
    });
  }
};

// @desc    Leave a group
// @route   POST /api/conversations/:id/leave
// @access  Private
const leaveGroup = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation || conversation.type !== 'group') {
      return res.status(404).json({
        success: false,
        message: 'Group conversation not found.',
      });
    }

    conversation.members = conversation.members.filter(
      (m) => m.toString() !== req.user._id.toString()
    );
    conversation.admins = conversation.admins.filter(
      (a) => a.toString() !== req.user._id.toString()
    );

    // If user was the only admin, assign first remaining member
    if (conversation.members.length > 0 && conversation.admins.length === 0) {
      conversation.admins.push(conversation.members[0]);
    }

    await conversation.save();

    return res.status(200).json({
      success: true,
      message: 'You have left the group successfully.',
    });
  } catch (error) {
    console.error('Leave group error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error leaving group.',
    });
  }
};

module.exports = {
  getUserConversations,
  getOrCreatePrivateConversation,
  createGroupConversation,
  getConversationById,
  updateGroup,
  addMembers,
  removeMember,
  toggleAdmin,
  leaveGroup,
};
