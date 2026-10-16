/** Final DB persistence verification for the UI-created booking */
const path = require('path');
const mongoose = require(path.join(__dirname, 'glow-up-api', 'node_modules', 'mongoose'));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/glowhub?replicaSet=rs0');
  const db = mongoose.connection.db;

  const latest = await db.collection('appointments').find({}).sort({ createdAt: -1 }).limit(1).toArray();
  const a = latest[0];
  console.log('--- Latest appointment (created via UI) ---');
  console.log(JSON.stringify({
    _id: a._id,
    status: a.status,
    providerId: a.providerId,
    customerId: a.customerId,
    date: a.date,
    timeSlot: a.timeSlot,
    totalPrice: a.price?.finalTotal,
    services: (a.services || []).map(s => ({ name: s.name, employeeId: s.employeeId, timeSlot: s.timeSlot })),
    createdAt: a.createdAt,
  }, null, 2));

  const counts = {};
  for (const c of ['users', 'customer_profiles', 'service_providers', 'employees', 'appointments', 'providersubscriptions', 'refreshtokens', 'lookups']) {
    counts[c] = await db.collection(c).countDocuments({});
  }
  console.log('\n--- Collection document counts ---');
  console.log(JSON.stringify(counts, null, 2));

  // Error log check
  const errs = await db.collection('errorlogs').find({}).sort({ createdAt: -1 }).limit(3).toArray();
  console.log('\n--- Recent errorlogs ---');
  errs.forEach(e => console.log(`  ${e.createdAt?.toISOString?.()} ${e.message || e.errorCode || ''}`.slice(0, 150)));

  await mongoose.disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });