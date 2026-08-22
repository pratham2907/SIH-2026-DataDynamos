const { getMemoryStore, persistMemoryStore, isInMemoryFallback } = require('../config/db');

// Helper to generate IDs
const generateId = (prefix = '') => {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 7);
  return `${prefix}${ts}${rand}`;
};

// Query matcher helper
const matchQuery = (item, query) => {
  if (!query || Object.keys(query).length === 0) return true;
  
  if (query.$or && Array.isArray(query.$or)) {
    const orMatches = query.$or.some(subQ => matchQuery(item, subQ));
    if (!orMatches) return false;
  }

  if (query.$and && Array.isArray(query.$and)) {
    const andMatches = query.$and.every(subQ => matchQuery(item, subQ));
    if (!andMatches) return false;
  }

  for (const key of Object.keys(query)) {
    if (key === '$or' || key === '$and') continue;

    const qVal = query[key];
    const itemVal = item[key];

    if (qVal && typeof qVal === 'object' && !Array.isArray(qVal)) {
      // Comparison operators
      if (qVal.$ne !== undefined && itemVal === qVal.$ne) return false;
      if (qVal.$in !== undefined && !qVal.$in.includes(itemVal)) return false;
      if (qVal.$nin !== undefined && qVal.$nin.includes(itemVal)) return false;
      if (qVal.$gt !== undefined && !(itemVal > qVal.$gt)) return false;
      if (qVal.$gte !== undefined && !(itemVal >= qVal.$gte)) return false;
      if (qVal.$lt !== undefined && !(itemVal < qVal.$lt)) return false;
      if (qVal.$lte !== undefined && !(itemVal <= qVal.$lte)) return false;
      if (qVal.$regex !== undefined) {
        const flags = qVal.$options || '';
        const re = new RegExp(qVal.$regex, flags);
        if (!re.test(String(itemVal || ''))) return false;
      }
    } else if (qVal instanceof RegExp) {
      if (!qVal.test(String(itemVal || ''))) return false;
    } else {
      if (itemVal !== qVal) return false;
    }
  }
  return true;
};

class Collection {
  constructor(name) {
    this.name = name;
  }

  getStore() {
    const store = getMemoryStore();
    if (!store[this.name]) {
      store[this.name] = [];
    }
    return store[this.name];
  }

  async find(query = {}) {
    const list = this.getStore();
    return list.filter(item => matchQuery(item, query)).map(x => ({ ...x }));
  }

  async findOne(query = {}) {
    const list = this.getStore();
    const item = list.find(item => matchQuery(item, query));
    return item ? { ...item } : null;
  }

  async findById(id) {
    const list = this.getStore();
    const item = list.find(item => item._id === id || item.id === id);
    return item ? { ...item } : null;
  }

  async create(doc) {
    const list = this.getStore();
    const newDoc = {
      _id: doc._id || generateId(this.name.charAt(0) + '_'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...doc
    };
    list.push(newDoc);
    persistMemoryStore();
    return { ...newDoc };
  }

  async insertMany(docs) {
    const results = [];
    for (const doc of docs) {
      const res = await this.create(doc);
      results.push(res);
    }
    return results;
  }

  async findByIdAndUpdate(id, update, options = { new: true }) {
    const list = this.getStore();
    const idx = list.findIndex(item => item._id === id || item.id === id);
    if (idx === -1) return null;

    const current = list[idx];
    const updated = {
      ...current,
      ...(update.$set || update),
      updatedAt: new Date().toISOString()
    };
    list[idx] = updated;
    persistMemoryStore();
    return { ...updated };
  }

  async updateOne(query, update) {
    const list = this.getStore();
    const idx = list.findIndex(item => matchQuery(item, query));
    if (idx === -1) return { matchedCount: 0, modifiedCount: 0 };

    const current = list[idx];
    list[idx] = {
      ...current,
      ...(update.$set || update),
      updatedAt: new Date().toISOString()
    };
    persistMemoryStore();
    return { matchedCount: 1, modifiedCount: 1 };
  }

  async updateMany(query, update) {
    const list = this.getStore();
    let modifiedCount = 0;
    for (let i = 0; i < list.length; i++) {
      if (matchQuery(list[i], query)) {
        list[i] = {
          ...list[i],
          ...(update.$set || update),
          updatedAt: new Date().toISOString()
        };
        modifiedCount++;
      }
    }
    persistMemoryStore();
    return { matchedCount: modifiedCount, modifiedCount };
  }

  async findByIdAndDelete(id) {
    const list = this.getStore();
    const idx = list.findIndex(item => item._id === id || item.id === id);
    if (idx === -1) return null;
    const removed = list.splice(idx, 1)[0];
    persistMemoryStore();
    return removed;
  }

  async deleteOne(query) {
    const list = this.getStore();
    const idx = list.findIndex(item => matchQuery(item, query));
    if (idx === -1) return { deletedCount: 0 };
    list.splice(idx, 1);
    persistMemoryStore();
    return { deletedCount: 1 };
  }

  async deleteMany(query = {}) {
    const store = getMemoryStore();
    const initialLen = (store[this.name] || []).length;
    store[this.name] = (store[this.name] || []).filter(item => !matchQuery(item, query));
    const deletedCount = initialLen - store[this.name].length;
    persistMemoryStore();
    return { deletedCount };
  }

  async countDocuments(query = {}) {
    const list = await this.find(query);
    return list.length;
  }
}

// Export pre-instantiated collection accessors
module.exports = {
  Users: new Collection('users'),
  Farmers: new Collection('farmers'),
  Farms: new Collection('farms'),
  Crops: new Collection('cropRegistrations'),
  Centers: new Collection('centers'),
  Slots: new Collection('slots'),
  Bookings: new Collection('bookings'),
  Queues: new Collection('queues'),
  Procurements: new Collection('procurements'),
  InspectionReports: new Collection('inspectionReports'),
  WeightRecords: new Collection('weightRecords'),
  Payments: new Collection('payments'),
  Transactions: new Collection('transactions'),
  Inventory: new Collection('inventory'),
  Notifications: new Collection('notifications'),
  SMSLogs: new Collection('smsLogs'),
  EmailLogs: new Collection('emailLogs'),
  Complaints: new Collection('complaints'),
  Announcements: new Collection('announcements'),
  AuditLogs: new Collection('auditLogs'),
  Holidays: new Collection('holidays'),
  SystemSettings: new Collection('systemSettings'),
  AIInsights: new Collection('aiInsights'),
  Backups: new Collection('backups'),
  generateId
};
