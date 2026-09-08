const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['private', 'group'],
      default: 'private',
      required: true,
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    groupPicture: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
      maxlength: [300, 'Group description cannot exceed 300 characters'],
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    pinnedMessages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index members array for fast user conversation lookup
conversationSchema.index({ members: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
