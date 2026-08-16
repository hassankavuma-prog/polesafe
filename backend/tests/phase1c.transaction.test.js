const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { startMongoReplSet, stopMongoReplSet } = require('./helpers/mongoReplSet');

let ctx;
const SyntheticSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    marker: { type: String, required: true, unique: true },
  },
  { collection: 'phase1c_transaction_probes', timestamps: true }
);
const SyntheticModel = mongoose.models.Phase1CTransactionProbe || mongoose.model('Phase1CTransactionProbe', SyntheticSchema);

test.before(async () => {
  ctx = await startMongoReplSet();
});

test.after(async () => {
  await stopMongoReplSet(ctx);
});

test('commit persists synthetic record', async () => {
  const session = await mongoose.startSession();
  const marker = `commit-${Date.now()}`;
  try {
    session.startTransaction();
    await SyntheticModel.create([{ name: 'commit-case', marker }], { session });
    await session.commitTransaction();
  } finally {
    await session.endSession();
  }

  const found = await SyntheticModel.findOne({ marker }).lean();
  assert.ok(found);
  assert.equal(found.marker, marker);
});

test('abort removes synthetic record', async () => {
  const session = await mongoose.startSession();
  const marker = `abort-${Date.now()}`;
  try {
    session.startTransaction();
    await SyntheticModel.create([{ name: 'abort-case', marker }], { session });
    await session.abortTransaction();
  } finally {
    await session.endSession();
  }

  const found = await SyntheticModel.findOne({ marker }).lean();
  assert.equal(found, null);
});
