const { MongoClient } = require('mongodb');
const myLogModule = require('../utils/logger');

const MONGODB_URI = "mongodb+srv://rajeshpandhare181:tY5SOl2JowgJaSW7@cluster0.adymsmg.mongodb.net/?appName=Cluster0&retryWrites=true&w=majority" || process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'tenant_management';

let _client = null;

/**
 * Connect to MongoDB and return client
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
 * Get database instance
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
  getClient,
  getDatabase,
  closeDB,
  MONGODB_URI,
  DB_NAME
};