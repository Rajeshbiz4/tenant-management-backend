const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
const myLogModule = require('../utils/logger');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://rajeshpandhare181:tY5SOl2JowgJaSW7@cluster0.adymsmg.mongodb.net/?appName=Cluster0&retryWrites=true&w=majority" || 'mongodb://localhost:27017/tenant_management';
const DB_NAME = process.env.DB_NAME || 'tenant_management';

let _client = null;

/**
 * Connect to MongoDB using Mongoose (for new models)
 */
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    myLogModule.info('MongoDB connected successfully (Mongoose)');
  } catch (error) {
    myLogModule.error('MongoDB connection error: ' + error);
    process.exit(1);
  }
};

/**
 * Connect to MongoDB and return client (for legacy native driver usage)
 * Reuses connection if already established
 */
async function getClient() {
  try {
    // If client exists and is connected, return it
    if (_client && _client.topology && _client.topology.isConnected()) {
      return _client;
    }

    // Create new connection
    _client = new MongoClient(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    await _client.connect();
    myLogModule.info('MongoDB connected: ' + MONGODB_URI);
    return _client;
  } catch (err) {
    myLogModule.error('MongoDB connection error: ' + err);
    throw err;
  }
}

/**
 * Get database instance (for legacy native driver usage)
 */
async function getDatabase() {
  try {
    const client = await getClient();
    return client.db(DB_NAME);
  } catch (err) {
    myLogModule.error('Get database error: ' + err);
    throw err;
  }
}

/**
 * Close MongoDB connection
 */
async function closeDB() {
  try {
    if (_client) {
      await _client.close();
      _client = null;
      myLogModule.info('MongoDB connection closed');
    }
  } catch (err) {
    myLogModule.error('Close database error: ' + err);
    throw err;
  }
}

module.exports = {
  connectDB,
  getClient,
  getDatabase,
  closeDB,
  MONGODB_URI,
  DB_NAME
};