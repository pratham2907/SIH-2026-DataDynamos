const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

let isConnected = false;
let isInMemoryFallback = false;

// In-Memory storage container for fallback mode
const memoryStore = {
  users: [],
  farmers: [],
  farms: [],
  cropRegistrations: [],
  centers: [],
  slots: [],
  bookings: [],
  queues: [],
  procurements: [],
  inspectionReports: [],
  weightRecords: [],
  payments: [],
  transactions: [],
  inventory: [],
  notifications: [],
  smsLogs: [],
  emailLogs: [],
  complaints: [],
  announcements: [],
  auditLogs: [],
  holidays: [],
  systemSettings: [],
  aiInsights: [],
  backups: []
};

// Persistence file for fallback mode
const DATA_FILE = path.join(__dirname, '../../data-store.json');

const loadMemoryStore = () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const loaded = JSON.parse(raw);
      Object.assign(memoryStore, loaded);
      console.log('📦 Local data store loaded successfully.');
    }
  } catch (err) {
    console.warn('⚠️ Could not load data-store.json, starting fresh memory store.');
  }
};

const persistMemoryStore = () => {
  if (!isInMemoryFallback) return;
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(memoryStore, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving data store:', err.message);
  }
};

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kpms_db';
  try {
    // Attempt Mongoose connection with 3s timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    isConnected = true;
    isInMemoryFallback = false;
    console.log('✅ MongoDB Connected successfully:', mongoose.connection.host);
  } catch (error) {
    console.warn(`⚠️ MongoDB connection failed (${error.message}).`);
    console.log('⚡ Initializing High-Performance KPMS Embedded Persistence Engine...');
    isConnected = true;
    isInMemoryFallback = true;
    loadMemoryStore();
  }
};

module.exports = {
  connectDB,
  isConnected: () => isConnected,
  isInMemoryFallback: () => isInMemoryFallback,
  getMemoryStore: () => memoryStore,
  persistMemoryStore
};
