const mongoose = require('mongoose');
const config = require('../backend/config');
require('../backend/database/schema');
(async () => {
  try {
    await mongoose.connect(config.MONGODB_URI, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 });
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const col of collections) {
      const model = mongoose.models[col.name] || Object.values(mongoose.models).find(m => m.collection.name === col.name);
      if (model) await model.createIndexes();
    }
    console.log('db:indexes complete');
  } catch (err) {
    console.error('db:indexes failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close().catch(() => {});
  }
})();
