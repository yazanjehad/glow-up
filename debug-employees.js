/** Inspect employees for the QA providers */
const path = require('path');
const mongoose = require(path.join(__dirname, 'glow-up-api', 'node_modules', 'mongoose'));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/glowhub?replicaSet=rs0');
  const db = mongoose.connection.db;
  const provs = await db.collection('service_providers').find({ name: 'Glow QA Salon' }).toArray();
  for (const p of provs) {
    const emps = await db.collection('employees').find({ providerId: p._id }).toArray();
    console.log(`\nProvider ${p._id} status=${p.status} services=${(p.services || []).length}`);
    for (const e of emps) {
      console.log(`  Employee ${e._id} name=${e.name} isActive=${e.isActive} canLogin=${e.capabilities?.canLogin}`);
      console.log(`    services=${JSON.stringify(e.services)}`);
      console.log(`    workFor=${e.workFor} workingHours.weekly=${JSON.stringify((e.workingHours || {}).weekly || []).slice(0, 200)}`);
    }
    if (emps.length === 0) console.log('  (no employees)');
  }
  await mongoose.disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });