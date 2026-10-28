const { MongoMemoryServer } = require("mongodb-memory-server");

// Boots a throwaway in-memory MongoDB once for the whole run and points the
// app's MONGO_URI at it. --runInBand keeps this in one process so the global
// handle survives to globalTeardown.
module.exports = async () => {
  const server = await MongoMemoryServer.create();
  global.__MONGO_SERVER__ = server;
  process.env.MONGO_URI = server.getUri("recipe_test");
};
