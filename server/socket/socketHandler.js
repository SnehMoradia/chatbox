const { verifyToken } = require('../utils/tokenUtils');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// In-memory mapping: userId -> Set of socket IDs
const onlineUsers = new Map();

const initializeSocket = (io) => {
  // Middleware: Authenticate socket connection with JWT
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Socket authentication error: Token missing'));
      }

      const decoded = verifyToken(token);
      if (!decoded || !decoded.id) {
        return next(new Error('Socket authentication error: Invalid token'));
      }

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('Socket authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      console.error('Socket auth error:', err.message);
      next(new Error('Socket authentication failed'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();

    // Add socket to user's set
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Join a personal user room for direct notifications
    socket.join(`user:${userId}`);

    // Update status in DB and broadcast presence
    await User.findByIdAndUpdate(userId, {
      status: socket.user.status === 'offline' ? 'available' : socket.user.status,
      lastSeen: new Date(),
    });

    // Notify all connected clients that this user is online
    io.emit('userOnline', {
      userId,
      status: socket.user.status === 'offline' ? 'available' : socket.user.status,
      lastSeen: new Date(),
    });

    // Send the current list of online user IDs to the newly connected socket
    const onlineUserIds = Array.from(onlineUsers.keys());
    socket.emit('onlineUsersList', onlineUserIds);

    // 1. Join Conversation Room
    socket.on('joinConversation', ({ conversationId }) => {
      if (conversationId) {
        socket.join(`conversation:${conversationId}`);
      }
    });

    // 2. Leave Conversation Room
    socket.on('leaveConversation', ({ conversationId }) => {
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
      }
    });

    // 3. Typing indicator
    socket.on('typing', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing', {
        conversationId,
        userId,
        username: socket.user.username,
        displayName: socket.user.displayName,
      });
    });

    socket.on('stopTyping', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('stopTyping', {
        conversationId,
        userId,
      });
    });

    // 4. Real-time Message Sent
    socket.on('sendMessage', async (messageData) => {
      try {
        const { conversationId } = messageData;
        if (!conversationId) return;

        // Broadcast to everyone in conversation room (including sender on other devices)
        io.to(`conversation:${conversationId}`).emit('receiveMessage', messageData);

        // Notify other conversation members who might not have this room open right now
        const conversation = await Conversation.findById(conversationId).select('members');
        if (conversation) {
          conversation.members.forEach((memberId) => {
            const mIdStr = memberId.toString();
            if (mIdStr !== userId) {
              io.to(`user:${mIdStr}`).emit('newMessageNotification', {
                conversationId,
                message: messageData,
              });
            }
          });
        }
      } catch (err) {
        console.error('Socket sendMessage error:', err);
      }
    });

    // 5. Message Read Receipt
    socket.on('messageRead', ({ conversationId, messageIds }) => {
      io.to(`conversation:${conversationId}`).emit('messageRead', {
        conversationId,
        messageIds,
        userId,
        readAt: new Date(),
      });
    });

    // 6. Message Delivered Receipt
    socket.on('messageDelivered', ({ conversationId, messageId }) => {
      io.to(`conversation:${conversationId}`).emit('messageDelivered', {
        conversationId,
        messageId,
        userId,
        deliveredAt: new Date(),
      });
    });

    // 7. Message Edited
    socket.on('messageEdited', ({ conversationId, message }) => {
      io.to(`conversation:${conversationId}`).emit('messageEdited', {
        conversationId,
        message,
      });
    });

    // 8. Message Deleted
    socket.on('messageDeleted', ({ conversationId, messageId }) => {
      io.to(`conversation:${conversationId}`).emit('messageDeleted', {
        conversationId,
        messageId,
      });
    });

    // 9. Message Reaction Updated
    socket.on('messageReaction', ({ conversationId, messageId, reactions }) => {
      io.to(`conversation:${conversationId}`).emit('messageReaction', {
        conversationId,
        messageId,
        reactions,
      });
    });

    // 10. Message Pinned / Unpinned
    socket.on('messagePinned', ({ conversationId, messageId, isPinned, pinnedMessages }) => {
      io.to(`conversation:${conversationId}`).emit('messagePinned', {
        conversationId,
        messageId,
        isPinned,
        pinnedMessages,
      });
    });

    // 10b. Chat Cleared
    socket.on('clearChat', ({ conversationId }) => {
      io.to(`conversation:${conversationId}`).emit('chatCleared', {
        conversationId,
      });
    });

    // 11. User Status Changed (Available, Busy, Away, DND)
    socket.on('statusChange', async ({ status }) => {
      try {
        await User.findByIdAndUpdate(userId, { status, lastSeen: new Date() });
        io.emit('userStatusUpdated', {
          userId,
          status,
          lastSeen: new Date(),
        });
      } catch (err) {
        console.error('Status change error:', err);
      }
    });

    // 12. Conversation Updated (e.g. group name, members added/removed)
    socket.on('conversationUpdated', (conversation) => {
      if (conversation && conversation._id) {
        io.to(`conversation:${conversation._id}`).emit('conversationUpdated', conversation);
        conversation.members?.forEach((m) => {
          const mId = typeof m === 'object' ? m._id.toString() : m.toString();
          io.to(`user:${mId}`).emit('conversationUpdated', conversation);
        });
      }
    });

    // On socket disconnect
    socket.on('disconnect', async () => {
      if (onlineUsers.has(userId)) {
        const userSockets = onlineUsers.get(userId);
        userSockets.delete(socket.id);

        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          const now = new Date();

          await User.findByIdAndUpdate(userId, {
            status: 'offline',
            lastSeen: now,
          });

          io.emit('userOffline', {
            userId,
            status: 'offline',
            lastSeen: now,
          });
        }
      }
    });
  });
};

module.exports = {
  initializeSocket,
  onlineUsers,
};
