/** Debug v2: inspect run-2 provider detail + user name persistence */
const path = require('path');
const mongoose = require(path.join(__dirname, 'glow-up-api', 'node_modules', 'mongoose'));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/glowhub?replicaSet=rs0');
  const db = mongoose.connection.db;

  // 1. Check user name persistence for QA customer
  const users = await db.collection('users').find({ phone: { $in: [/^0556923252/] } }).toArray();
  console.log('--- QA customer user doc ---');
  console.log(JSON.stringify(users.map(u => ({ phone: u.phone, name: u.name, role: u.role })), null, 2));

  // 2. Run-2 provider detail
  const provId = '6a88dca49e91865c75c2f06d';
  const res = await fetch(`http://localhost:3000/providers/${provId}`);
  const body = await res.json();
  console.log('\n--- GET /providers/:id services (run-2 provider) ---');
  console.log(JSON.stringify(body.services ?? body.data?.services, null, 2).slice(0, 1200));

  await mongoose.disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });