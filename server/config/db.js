const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const seedInitialData = require('../utils/seedData');

let mongod = null;

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGODB_URI;

    if (mongoUri && mongoUri.trim().length > 0) {
      console.log(`Connecting to specified MongoDB URI: ${mongoUri.replace(/:[^:@]+@/, ':****@')}`);
      try {
        await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: 4000,
        });
        console.log('MongoDB connected successfully via MONGODB_URI.');
        await seedInitialData();
        return;
      } catch (err) {
        console.warn('Could not connect to specified MONGODB_URI. Falling back to in-memory MongoDB instance...', err.message);
      }
    }

    console.log('Starting in-memory MongoDB server for instant zero-config setup...');
    mongod = await MongoMemoryServer.create();
    mongoUri = mongod.getUri();

    await mongoose.connect(mongoUri);
    console.log(`MongoDB In-Memory Server connected at ${mongoUri}`);

    // Seed sample users, conversations, and messages
    await seedInitialData();
  } catch (error) {
    console.error('CRITICAL: Database connection error:', error);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
  } catch (error) {
    console.error('Error during DB disconnect:', error);
  }
};

module.exports = { connectDB, disconnectDB };
