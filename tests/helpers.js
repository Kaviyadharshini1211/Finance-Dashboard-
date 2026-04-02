const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const User = require("../src/models/User");
const { generateToken } = require("../src/utils/jwt");

let mongoServer;

// Start in-memory MongoDB before all tests
const setupDB = async () => {
  // Disconnect any existing connection before creating a new one
  // This prevents timeout when multiple test suites run sequentially
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), {
    serverSelectionTimeoutMS: 10000,
  });
};

// Drop all collections between tests for isolation
const clearDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

// Close connection after all tests
const teardownDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
};

// Helper: create a user and return { user, token }
const createUser = async (overrides = {}) => {
  const defaults = {
    name: "Test User",
    email: `test_${Date.now()}@example.com`,
    password: "password123",
    role: "viewer",
  };
  const user = await User.create({ ...defaults, ...overrides });
  const token = generateToken(user._id);
  return { user, token };
};

module.exports = { setupDB, clearDB, teardownDB, createUser };