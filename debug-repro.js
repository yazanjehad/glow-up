/** Reproduce the UI's exact booking payload to capture the 400 error body */
const path = require('path');
const mongoose = require(path.join(__dirname, 'glow-up-api', 'node_modules', 'mongoose'));

const BASE = 'http://localhost:3000';
const OTP = '1234';
const PHONE = '05' + String(91000000 + Math.floor(Math.random() * 8999999));

async function api(method, url, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${url}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  console.log(`${method} ${url} -> ${res.status}`);
  if (res.status >= 400) console.log('BODY:', text.slice(0, 600));
  try { return JSON.parse(text); } catch { return text; }
}

async function main() {
  // Register a fresh customer
  await api('POST', '/auth/otp/request', { body: { phone: PHONE } });
  const v = await api('POST', '/auth/customer/verify-otp', { body: { phone: PHONE, code: OTP } });
  const created = await api('POST', '/auth/customer/create-profile', {
    token: v.otpToken,
    body: { firstname: 'Repro', lastname: 'Test', email: `repro.${Date.now()}@example.com`, gender: 'FEMALE' },
  });
  const token = created.accessToken;

  await mongoose.connect('mongodb://127.0.0.1:27017/glowhub?replicaSet=rs0');
  const db = mongoose.connection.db;
  const prov = await db.collection('service_providers').findOne({ name: 'Glow QA Salon', services: { $exists: true }, $expr: { $gt: [{ $size: '$services' }, 0] } });
  const item = prov.services[0].items[0];
  console.log(`provider=${prov._id} item=${item._id} name=${item.name} duration=${item.durationMinutes}`);
  await mongoose.disconnect();

  // Exact UI-shaped payload: end == start (as BookingSlotClient sends), date = today
  const today = new Date().toISOString().slice(0, 10);
  const r1 = await api('POST', '/appointments', {
    token,
    body: {
      providerId: String(prov._id),
      services: [{
        serviceItemId: String(item._id),
        date: today,
        numberOfCustomers: 1,
        anyEmployee: true,
        timeSlot: { start: '10:00', end: '10:00' },
      }],
      paymentMethod: 'CASH',
    },
  });
  console.log('UI-shaped payload result:', r1.status === 201 || r1.status === 200 ? 'SUCCESS' : 'FAILED');

  // Control: proper end time
  const r2 = await api('POST', '/appointments', {
    token,
    body: {
      providerId: String(prov._id),
      services: [{
        serviceItemId: String(item._id),
        date: today,
        numberOfCustomers: 1,
        anyEmployee: true,
        timeSlot: { start: '12:00', end: '13:00' },
      }],
      paymentMethod: 'CASH',
    },
  });
  console.log('Control payload result:', r2.status === 201 || r2.status === 200 ? 'SUCCESS' : 'FAILED');
}
main().catch(e => { console.error(e); process.exit(1); });