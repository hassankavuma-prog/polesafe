const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

async function startMongoReplSet() {
  const replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });

  const uri = replSet.getUri();
  await mongoose.connect(uri, { dbName: 'polesafe_phase1c_test' });

  require('../../database/schema');

  return { replSet, uri };
}

async function stopMongoReplSet(ctx) {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } finally {
    if (ctx?.replSet) {
      await ctx.replSet.stop();
    }
  }
}

module.exports = { startMongoReplSet, stopMongoReplSet };
