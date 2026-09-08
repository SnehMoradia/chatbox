const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const seedInitialData = async (force = false) => {
  try {
    if (force || process.argv.includes('--force') || process.argv.includes('-f')) {
      console.log('Force re-seeding: clearing existing collections...');
      await User.deleteMany({});
      await Conversation.deleteMany({});
      await Message.deleteMany({});
    } else {
      const userCount = await User.countDocuments();
      if (userCount > 0) {
        console.log('Database already populated. Skipping initial seed. (Pass --force to overwrite)');
        return;
      }
    }

    console.log('Seeding initial demo data for instant testing...');

    // 1. Create demo users
    const users = await User.create([
      {
        username: 'alex_rivera',
        displayName: 'Alex Rivera',
        email: 'alex@teamschat.dev',
        password: 'Password123!',
        profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        bio: 'Product Designer & UI Specialist 🎨',
        status: 'available',
      },
      {
        username: 'jordan_lee',
        displayName: 'Jordan Lee',
        email: 'jordan@teamschat.dev',
        password: 'Password123!',
        profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        bio: 'Frontend Architect | React & TypeScript ⚛️',
        status: 'available',
      },
      {
        username: 'sam_taylor',
        displayName: 'Sam Taylor',
        email: 'sam@teamschat.dev',
        password: 'Password123!',
        profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        bio: 'Full-Stack Developer | APIs & Sockets ⚡',
        status: 'away',
      },
      {
        username: 'taylor_swift',
        displayName: 'Taylor Morgan',
        email: 'taylor@teamschat.dev',
        password: 'Password123!',
        profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        bio: 'Engineering Lead | Collaborative Systems 🚀',
        status: 'busy',
      },
    ]);

    const [alex, jordan, sam, taylor] = users;

    // 2. Create 1-on-1 private conversation between Alex and Jordan
    const privateConvo = await Conversation.create({
      type: 'private',
      members: [alex._id, jordan._id],
      createdBy: alex._id,
    });

    const m1 = await Message.create({
      conversationId: privateConvo._id,
      senderId: jordan._id,
      content: 'Hey Alex! How is the new Microsoft Teams chat interface looking?',
      messageType: 'text',
      readBy: [{ userId: alex._id, readAt: new Date() }],
      deliveredTo: [{ userId: alex._id, deliveredAt: new Date() }],
    });

    const m2 = await Message.create({
      conversationId: privateConvo._id,
      senderId: alex._id,
      content: 'It looks amazing! The Teams blurple theme, responsive sidebar, and real-time Socket.IO communication are super slick 🚀',
      messageType: 'text',
      replyTo: m1._id,
      reactions: [{ userId: jordan._id, emoji: '🔥' }, { userId: alex._id, emoji: '👍' }],
      readBy: [{ userId: jordan._id, readAt: new Date() }],
      deliveredTo: [{ userId: jordan._id, deliveredAt: new Date() }],
    });

    const m3 = await Message.create({
      conversationId: privateConvo._id,
      senderId: jordan._id,
      content: 'Awesome! We have support for emojis, GIFs, file attachments, and pinned messages ready to roll.',
      messageType: 'text',
      readBy: [{ userId: alex._id, readAt: new Date() }],
      deliveredTo: [{ userId: alex._id, deliveredAt: new Date() }],
    });

    privateConvo.lastMessage = m3._id;
    await privateConvo.save();

    // 3. Create Group Conversation: "Project Pulse Core Team"
    const groupConvo = await Conversation.create({
      type: 'group',
      name: 'Project Pulse Core Team',
      description: 'Central collaboration hub for real-time chat feature planning and rollout.',
      groupPicture: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
      members: [alex._id, jordan._id, sam._id, taylor._id],
      admins: [taylor._id, alex._id],
      createdBy: taylor._id,
    });

    const gm1 = await Message.create({
      conversationId: groupConvo._id,
      senderId: taylor._id,
      content: 'Welcome everyone to the Project Pulse chat room! 💬 Remember, this workspace is dedicated solely to real-time messaging without calls or video distractions.',
      messageType: 'text',
      isPinned: true,
      reactions: [
        { userId: alex._id, emoji: '❤️' },
        { userId: jordan._id, emoji: '🙌' },
        { userId: sam._id, emoji: '🚀' },
      ],
      readBy: [
        { userId: alex._id, readAt: new Date() },
        { userId: jordan._id, readAt: new Date() },
      ],
    });

    const gm2 = await Message.create({
      conversationId: groupConvo._id,
      senderId: sam._id,
      content: 'Backend REST endpoints and Socket.IO handlers are fully configured with Mongoose models for Users, Conversations, and Messages.',
      messageType: 'text',
      readBy: [{ userId: alex._id, readAt: new Date() }],
    });

    const gm3 = await Message.create({
      conversationId: groupConvo._id,
      senderId: alex._id,
      content: 'I have attached the UI color palette token references for dark and light modes!',
      messageType: 'text',
      attachments: [
        {
          url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
          name: 'teams_palette_specs.png',
          size: 482000,
          mimeType: 'image/png',
        },
      ],
      readBy: [{ userId: taylor._id, readAt: new Date() }],
    });

    groupConvo.lastMessage = gm3._id;
    groupConvo.pinnedMessages = [gm1._id];
    await groupConvo.save();

    console.log('Demo seed data populated successfully!');
    console.log('Demo Accounts:');
    console.log('  1. alex@teamschat.dev / Password123!');
    console.log('  2. jordan@teamschat.dev / Password123!');
    console.log('  3. sam@teamschat.dev / Password123!');
    console.log('  4. taylor@teamschat.dev / Password123!');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

module.exports = seedInitialData;

if (require.main === module) {
  const path = require('path');
  const dotenv = require('dotenv');
  dotenv.config({ path: path.join(__dirname, '..', '.env') });
  dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

  const { connectDB, disconnectDB } = require('../config/db');

  (async () => {
    try {
      console.log('--- Teams Chat Database Seeder ---');
      await connectDB();
      // If force was specified, ensure seedInitialData(true) is executed
      if (process.argv.includes('--force') || process.argv.includes('-f')) {
        await seedInitialData(true);
      }
      console.log('--- Database Seeding Complete ---');
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      console.error('Fatal error during seeding:', err);
      process.exit(1);
    }
  })();
}
