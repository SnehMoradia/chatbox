const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

// @desc    Get messages for a conversation with pagination
// @route   GET /api/messages/:conversationId
// @access  Private
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    const isMember = conversation.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Not a member of this conversation.',
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await Message.find({ conversationId })
      .populate('senderId', 'username displayName profilePicture')
      .populate({
        path: 'replyTo',
        populate: {
          path: 'senderId',
          select: 'username displayName profilePicture',
        },
      })
      .populate('reactions.userId', 'username displayName')
      .sort({ createdAt: 1 }) // Chronological order
      .skip(skip)
      .limit(parseInt(limit));

    const totalMessages = await Message.countDocuments({ conversationId });

    return res.status(200).json({
      success: true,
      messages,
      total: totalMessages,
      page: parseInt(page),
      pages: Math.ceil(totalMessages / parseInt(limit)),
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving messages.',
    });
  }
};

// @desc    Send a new message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, messageType, attachments, gifUrl, replyTo } = req.body;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID is required.',
      });
    }

    // Verify conversation and membership
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    const isMember = conversation.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this conversation.',
      });
    }

    // Check message payload
    const hasContent = content && content.trim().length > 0;
    const hasAttachments = attachments && attachments.length > 0;
    const hasGif = Boolean(gifUrl);

    if (!hasContent && !hasAttachments && !hasGif) {
      return res.status(400).json({
        success: false,
        message: 'Message must contain text, an attachment, or a GIF.',
      });
    }

    const newMessage = await Message.create({
      conversationId,
      senderId: req.user._id,
      content: content ? content.trim() : '',
      messageType: messageType || (hasGif ? 'gif' : hasAttachments ? 'file' : 'text'),
      attachments: attachments || [],
      gifUrl: gifUrl || null,
      replyTo: replyTo || null,
      readBy: [{ userId: req.user._id, readAt: new Date() }],
      deliveredTo: [{ userId: req.user._id, deliveredAt: new Date() }],
    });

    // Update conversation last message & timestamp
    conversation.lastMessage = newMessage._id;
    await conversation.save();

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('senderId', 'username displayName profilePicture')
      .populate({
        path: 'replyTo',
        populate: {
          path: 'senderId',
          select: 'username displayName profilePicture',
        },
      })
      .populate('reactions.userId', 'username displayName');

    return res.status(201).json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error sending message.',
    });
  }
};

// @desc    Edit an existing message
// @route   PUT /api/messages/:id
// @access  Private
const editMessage = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content cannot be empty.',
      });
    }

    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only edit your own messages.',
      });
    }

    if (message.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit a deleted message.',
      });
    }

    message.content = content.trim();
    message.isEdited = true;
    await message.save();

    const populated = await Message.findById(message._id)
      .populate('senderId', 'username displayName profilePicture')
      .populate({
        path: 'replyTo',
        populate: {
          path: 'senderId',
          select: 'username displayName profilePicture',
        },
      })
      .populate('reactions.userId', 'username displayName');

    return res.status(200).json({
      success: true,
      message: populated,
    });
  } catch (error) {
    console.error('Edit message error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error editing message.',
    });
  }
};

// @desc    Soft delete a message
// @route   DELETE /api/messages/:id
// @access  Private
const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    const conversation = await Conversation.findById(message.conversationId);
    const isSender = message.senderId.toString() === req.user._id.toString();
    const isGroupAdmin =
      conversation &&
      conversation.type === 'group' &&
      conversation.admins.some((a) => a.toString() === req.user._id.toString());

    if (!isSender && !isGroupAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You cannot delete this message.',
      });
    }

    message.isDeleted = true;
    message.content = 'This message was deleted';
    message.attachments = [];
    message.gifUrl = null;
    message.reactions = [];
    await message.save();

    return res.status(200).json({
      success: true,
      message: {
        _id: message._id,
        conversationId: message.conversationId,
        isDeleted: true,
        content: 'This message was deleted',
      },
    });
  } catch (error) {
    console.error('Delete message error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting message.',
    });
  }
};

// @desc    Toggle emoji reaction on message
// @route   POST /api/messages/:id/react
// @access  Private
const toggleReaction = async (req, res) => {
  try {
    const { emoji } = req.body;
    if (!emoji) {
      return res.status(400).json({ success: false, message: 'Emoji is required.' });
    }

    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    // Check if user already reacted with this exact emoji
    const existingIndex = message.reactions.findIndex(
      (r) =>
        r.userId.toString() === req.user._id.toString() && r.emoji === emoji
    );

    if (existingIndex > -1) {
      // Remove reaction (toggle off)
      message.reactions.splice(existingIndex, 1);
    } else {
      // Add reaction
      message.reactions.push({
        userId: req.user._id,
        emoji,
        createdAt: new Date(),
      });
    }

    await message.save();

    const populated = await Message.findById(message._id)
      .populate('senderId', 'username displayName profilePicture')
      .populate('reactions.userId', 'username displayName');

    return res.status(200).json({
      success: true,
      reactions: populated.reactions,
      messageId: message._id,
    });
  } catch (error) {
    console.error('Reaction error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating reaction.',
    });
  }
};

// @desc    Pin / Unpin message
// @route   POST /api/messages/:id/pin
// @access  Private
const togglePin = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    const conversation = await Conversation.findById(message.conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    const isPinned = !message.isPinned;
    message.isPinned = isPinned;
    await message.save();

    if (isPinned) {
      if (!conversation.pinnedMessages.includes(message._id)) {
        conversation.pinnedMessages.push(message._id);
      }
    } else {
      conversation.pinnedMessages = conversation.pinnedMessages.filter(
        (id) => id.toString() !== message._id.toString()
      );
    }

    await conversation.save();

    return res.status(200).json({
      success: true,
      isPinned,
      messageId: message._id,
    });
  } catch (error) {
    console.error('Toggle pin error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error toggling pin.',
    });
  }
};

// @desc    Forward message to another conversation
// @route   POST /api/messages/:id/forward
// @access  Private
const forwardMessage = async (req, res) => {
  try {
    const { targetConversationIds } = req.body; // Array of conversation IDs
    if (!targetConversationIds || !Array.isArray(targetConversationIds) || targetConversationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'targetConversationIds array is required.',
      });
    }

    const sourceMessage = await Message.findById(req.params.id);
    if (!sourceMessage || sourceMessage.isDeleted) {
      return res.status(404).json({ success: false, message: 'Valid message to forward not found.' });
    }

    const forwardedMessages = [];

    for (const targetId of targetConversationIds) {
      const convo = await Conversation.findById(targetId);
      if (!convo || !convo.members.includes(req.user._id)) continue;

      const newMsg = await Message.create({
        conversationId: targetId,
        senderId: req.user._id,
        content: sourceMessage.content ? `[Forwarded]\n${sourceMessage.content}` : '[Forwarded]',
        messageType: sourceMessage.messageType,
        attachments: sourceMessage.attachments,
        gifUrl: sourceMessage.gifUrl,
        readBy: [{ userId: req.user._id, readAt: new Date() }],
        deliveredTo: [{ userId: req.user._id, deliveredAt: new Date() }],
      });

      convo.lastMessage = newMsg._id;
      await convo.save();

      const populated = await Message.findById(newMsg._id)
        .populate('senderId', 'username displayName profilePicture')
        .populate('reactions.userId', 'username displayName');

      forwardedMessages.push(populated);
    }

    return res.status(201).json({
      success: true,
      messages: forwardedMessages,
    });
  } catch (error) {
    console.error('Forward message error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error forwarding message.',
    });
  }
};

// @desc    Mark all messages in a conversation as read
// @route   PUT /api/messages/:conversationId/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;

    await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: req.user._id },
        'readBy.userId': { $ne: req.user._id },
      },
      {
        $addToSet: {
          readBy: { userId: req.user._id, readAt: new Date() },
          deliveredTo: { userId: req.user._id, deliveredAt: new Date() },
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Marked conversation as read.',
      conversationId,
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error marking messages as read.',
    });
  }
};

// @desc    Get all shared media and files in a conversation
// @route   GET /api/messages/:conversationId/media
// @access  Private
const getConversationMedia = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const messages = await Message.find({
      conversationId,
      isDeleted: false,
      $or: [
        { 'attachments.0': { $exists: true } },
        { gifUrl: { $ne: null } },
      ],
    })
      .sort({ createdAt: -1 })
      .select('attachments gifUrl createdAt senderId');

    const media = [];
    const files = [];

    messages.forEach((msg) => {
      if (msg.gifUrl) {
        media.push({
          type: 'gif',
          url: msg.gifUrl,
          messageId: msg._id,
          createdAt: msg.createdAt,
        });
      }
      if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach((att) => {
          const isImage = att.mimeType && att.mimeType.startsWith('image/');
          if (isImage) {
            media.push({
              type: 'image',
              url: att.url,
              name: att.name,
              size: att.size,
              messageId: msg._id,
              createdAt: msg.createdAt,
            });
          } else {
            files.push({
              type: 'file',
              url: att.url,
              name: att.name,
              size: att.size,
              mimeType: att.mimeType,
              messageId: msg._id,
              createdAt: msg.createdAt,
            });
          }
        });
      }
    });

    return res.status(200).json({
      success: true,
      media,
      files,
    });
  } catch (error) {
    console.error('Get media error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching media.',
    });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  toggleReaction,
  togglePin,
  forwardMessage,
  markAsRead,
  getConversationMedia,
};
