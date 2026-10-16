/**
 * API-level E2E test for Glow Up (Task 1787348608575) - v2
 * Full lifecycle: customer registration -> profile -> provider registration ->
 * service setup -> booking -> cancel -> MongoDB persistence verification.
 */
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:3000';
const MONGO = 'mongodb://127.0.0.1:27017/glowhub?replicaSet=rs0';
const OTP = '1234';
const TS = Date.now();
// Dynamic dummy data (unique per run)
const C_PHONE = '05' + String(51000000 + Math.floor(Math.random() * 8999999));
const P_PHONE = '05' + String(61000000 + Math.floor(Math.random() * 8999999));
const C_EMAIL = `qa.customer.${TS}@example.com`;
const P_EMAIL = `qa.salon.${TS}@example.com`;

const results = [];
const apiCalls = [];
let passCount = 0;
let failCount = 0;

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  results.push(line);
}

function check(name, ok, detail = '') {
  if (ok) { passCount++; log(`✅ PASS: ${name}${detail ? ' — ' + detail : ''}`); }
  else { failCount++; log(`❌ FAIL: ${name}${detail ? ' — ' + detail : ''}`); }
  return ok;
}

async function api(method, url, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json', 'Accept-Language': 'en' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  const text = await res.text();
  try { data = JSON.parse(text); } catch { data = text; }
  apiCalls.push({ method, url, status: res.status });
  log(`   ${method} ${url} -> ${res.status}`);
  if (res.status >= 400) log(`      Error body: ${JSON.stringify(data).slice(0, 400)}`);
  return { status: res.status, data };
}

async function registerViaOtp(phone, verifyUrl, profileUrl, profileBody) {
  await api('POST', '/auth/otp/request', { body: { phone } });
  const verify = await api('POST', verifyUrl, { body: { phone, code: OTP } });
  if (!(verify.status === 200 || verify.status === 201)) return { ok: false };
  const { otpToken } = verify.data || {};
  if (!otpToken) return { ok: false, nextAction: verify.data?.nextAction };
  const created = await api('POST', profileUrl, { token: otpToken, body: profileBody });
  return {
    ok: created.status === 200 || created.status === 201,
    accessToken: created.data?.accessToken,
    userId: created.data?.user?.id,
    role: created.data?.user?.role,
  };
}

async function main() {
  log('=====================================================');
  log('API E2E TEST v2 - Glow Up Full Customer Journey');
  log(`Customer: phone=${C_PHONE} email=${C_EMAIL}`);
  log(`Provider: phone=${P_PHONE} email=${P_EMAIL}`);
  log('=====================================================');

  let mongoose;
  let dbOk = false;

  // ---------- STEP 1: Customer Registration ----------
  log('\n--- STEP 1: Customer Registration & Authentication ---');
  const cust = await registerViaOtp(C_PHONE, '/auth/customer/verify-otp', '/auth/customer/create-profile', {
    firstname: 'Layla',
    lastname: 'Hassan',
    email: C_EMAIL,
    password: 'StrongPass@123',
    gender: 'FEMALE',
    birthDate: '1995-05-15',
  });
  check('Customer registration (create-profile 201)', cust.ok && cust.role === 'CUSTOMER', `userId=${cust.userId}`);
  if (!cust.ok) return finish();

  // ---------- STEP 2: Profile Management ----------
  log('\n--- STEP 2: Customer Profile Management ---');
  const me = await api('GET', '/customer/me', { token: cust.accessToken });
  check('GET /customer/me returns profile', me.status === 200 && me.data?.firstName === 'Layla');
  const upd = await api('PATCH', '/customer/me', {
    token: cust.accessToken,
    body: { firstName: 'Layla', lastName: 'Hassan-QA' },
  });
  check('PATCH /customer/me updates profile', upd.status === 200, JSON.stringify(upd.data).slice(0, 150));
  const me2 = await api('GET', '/customer/me', { token: cust.accessToken });
  check('Profile update persisted (lastName=Hassan-QA)', me2.status === 200 && me2.data?.lastName === 'Hassan-QA');

  // ---------- STEP 3: Provider Registration ----------
  log('\n--- STEP 3: Provider Registration ---');
  const prov = await registerViaOtp(P_PHONE, '/auth/provider/verify-otp', '/auth/provider/create-profile', {
    name: 'Glow QA Salon',
    email: P_EMAIL,
  });
  check('Provider registration (create-profile 201)', prov.ok && prov.role === 'PROVIDER', `userId=${prov.userId}`);
  if (!prov.ok) return finish();

  // ---------- STEP 4: Seed lookups + approve provider (test-data enablement via DB) ----------
  log('\n--- STEP 4: Seed lookup refs & approve provider (DB) ---');
  try {
    mongoose = require(path.join(__dirname, 'glow-up-api', 'node_modules', 'mongoose'));
    await mongoose.connect(MONGO);
    const db = mongoose.connection.db;

    // Ensure lookups exist for PROVIDER_TYPE / SERVICE_CATEGORY / SERVICE_TYPE
    async function ensureLookup(key, code, en, ar) {
      const existing = await db.collection('lookups').findOne({ key, code });
      if (existing) return existing._id;
      const r = await db.collection('lookups').insertOne({
        key, code, name: { en, ar }, isActive: true, order: 0, createdAt: new Date(), updatedAt: new Date(),
      });
      return r.insertedId;
    }
    const providerTypeLookup = await ensureLookup('PROVIDER_TYPE', 'SALOON', 'Salon', 'صالون');
    const categoryLookup = await ensureLookup('SERVICE_CATEGORY', 'HAIR', 'Hair', 'شعر');
    const typeLookup = await ensureLookup('SERVICE_TYPE', 'CUT', 'Haircut', 'قص شعر');
    const positionLookup = await ensureLookup('EMPLOYEE_POSITION', 'STYLIST', 'Stylist', 'خبير تجميل');
    log(`   Lookups ready: providerType=${providerTypeLookup}, category=${categoryLookup}, type=${typeLookup}, position=${positionLookup}`);

    // Approve the QA provider so booking is allowed
    const updRes = await db.collection('service_providers').updateOne(
      { userId: new mongoose.Types.ObjectId(prov.userId) },
      { $set: { status: 'APPROVED' } },
    );
    log(`   Provider approval matched=${updRes.matchedCount} modified=${updRes.modifiedCount}`);
    check('Provider approved in DB', updRes.matchedCount === 1);

    // ---------- STEP 5: Provider adds services + working hours via API ----------
    log('\n--- STEP 5: Provider Service Setup (PATCH /providers/:id) ---');
    const provMe = await api('GET', '/providers/me', { token: prov.accessToken });
    const providerId = provMe.data?._id || provMe.data?.data?._id || provMe.data?.id;
    check('GET /providers/me returns provider doc', provMe.status === 200 && !!providerId, `providerId=${providerId}`);

    // Seed an ACTIVE subscription for the provider (booking requires one)
    await db.collection('providersubscriptions').insertOne({
      providerId: new mongoose.Types.ObjectId(providerId),
      planId: new mongoose.Types.ObjectId(),
      plan: { name: 'QA Test Plan', price: 0, durationDays: 365, commissionPercent: 3 },
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 3600 * 1000),
      status: 'ACTIVE',
      paymentMethod: 'CASH',
      notes: 'Seeded by E2E test',
    });
    log('   Seeded ACTIVE provider subscription');

    const patchRes = await api('PATCH', `/providers/${providerId}`, {
      token: prov.accessToken,
      body: {
        description: 'QA seeded salon for E2E testing',
        genderType: 'FEMALE',
        phones: [P_PHONE],
        address: 'Amman Test Street 12',
        latitude: 31.9539,
        longitude: 35.9106,
        serviceLocation: 'salon',
        appointmentStrategy: 'DIRECT',
        services: [{
          category: String(categoryLookup),
          items: [
            { type: String(typeLookup), name: 'Classic Haircut', price: 25, durationMinutes: 45, isActive: true },
            { type: String(typeLookup), name: 'Premium Styling', price: 60, durationMinutes: 90, isActive: true },
          ],
        }],
        workingHours: {
          timezone: 'Asia/Amman',
          weekly: [
            { day: 'SUNDAY', isOpen: true, openTime: '09:00', closeTime: '18:00' },
            { day: 'MONDAY', isOpen: true, openTime: '09:00', closeTime: '18:00' },
            { day: 'TUESDAY', isOpen: true, openTime: '09:00', closeTime: '18:00' },
            { day: 'WEDNESDAY', isOpen: true, openTime: '09:00', closeTime: '18:00' },
            { day: 'THURSDAY', isOpen: true, openTime: '09:00', closeTime: '18:00' },
            { day: 'FRIDAY', isOpen: false },
            { day: 'SATURDAY', isOpen: true, openTime: '10:00', closeTime: '16:00' },
          ],
        },
      },
    });
    check('PATCH /providers/:id adds services + hours', patchRes.status === 200);

    // Read embedded service item IDs from DB (public API filters items by employee assignment)
    const provDocFresh = await db.collection('service_providers').findOne({ _id: new mongoose.Types.ObjectId(providerId) });
    const dbFirstItem = provDocFresh?.services?.[0]?.items?.[0];
    check('Embedded service item present in DB after PATCH', !!dbFirstItem, dbFirstItem ? `itemId=${dbFirstItem._id} name=${dbFirstItem.name}` : '');

    // Create an employee assigned to the first service item (required for public visibility + booking)
    if (dbFirstItem?._id) {
      const emp = await api('POST', '/employees', {
        token: prov.accessToken,
        body: {
          name: 'Nour Stylist',
          phone: '05' + String(71000000 + Math.floor(Math.random() * 8999999)),
          position: String(positionLookup),
          services: [String(dbFirstItem._id)],
          password: 'StrongPass@123',
          workingHours: {
            timezone: 'Asia/Amman',
            weekly: [
              { day: 'SUNDAY', isOpen: true, openTime: '09:00', closeTime: '18:00' },
              { day: 'MONDAY', isOpen: true, openTime: '09:00', closeTime: '18:00' },
              { day: 'TUESDAY', isOpen: true, openTime: '09:00', closeTime: '18:00' },
              { day: 'WEDNESDAY', isOpen: true, openTime: '09:00', closeTime: '18:00' },
              { day: 'THURSDAY', isOpen: true, openTime: '09:00', closeTime: '18:00' },
              { day: 'FRIDAY', isOpen: false },
              { day: 'SATURDAY', isOpen: true, openTime: '10:00', closeTime: '16:00' },
            ],
          },
        },
      });
      check('POST /employees creates stylist assigned to service', emp.status === 201 || emp.status === 200);
    }

    // ---------- STEP 6: Services Exploration ----------
    log('\n--- STEP 6: Services Exploration (public browsing) ---');
    const list = await api('GET', '/providers?page=1&limit=10&name=Glow%20QA');
    const providersArr = list.data?.data || [];
    check('GET /providers lists the QA salon', list.status === 200 && providersArr.length >= 1, `found=${providersArr.length}`);
    const detail = await api('GET', `/providers/${providerId}`);
    const svcCats = detail.data?.services || detail.data?.data?.services || [];
    const firstItem = svcCats[0]?.items?.[0];
    check('GET /providers/:id exposes embedded services', detail.status === 200 && !!firstItem,
      firstItem ? `serviceItemId=${firstItem._id} name=${firstItem.name}` : '');
    let slots = null;
    if (firstItem?._id) {
      slots = await api('GET', `/providers/${providerId}/slots?date=${new Date(Date.now() + 24*3600*1000).toISOString().slice(0,10)}&serviceId=${firstItem._id}`);
      check('GET /providers/:id/slots returns availability', slots.status === 200, JSON.stringify(slots.data).slice(0, 150));
    }

    // ---------- STEP 7: Booking Lifecycle ----------
    log('\n--- STEP 7: Booking Lifecycle ---');
    if (firstItem?._id) {
      const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
      const booking = await api('POST', '/appointments', {
        token: cust.accessToken,
        body: {
          providerId: String(providerId),
          services: [{
            serviceItemId: String(firstItem._id),
            date: tomorrow.toISOString().slice(0, 10),
            numberOfCustomers: 1,
            anyEmployee: true,
            timeSlot: { start: '10:00', end: '11:00' },
          }],
          bookingType: 'SELF',
          paymentMethod: 'CASH',
        },
      });
      const appt = booking.data?.appointment || booking.data?.data || booking.data;
      const apptId = appt?._id;
      check('POST /appointments creates booking (201)', booking.status === 201 || booking.status === 200, `apptId=${apptId}`);

      const mine = await api('GET', '/appointments/me', { token: cust.accessToken });
      const mineArr = Array.isArray(mine.data) ? mine.data : (mine.data?.data || []);
      check('GET /appointments/me shows the booking', mine.status === 200 && mineArr.length >= 1, `count=${mineArr.length}`);

      if (apptId) {
        const cancel = await api('PATCH', `/appointments/${apptId}/cancel?reason=QA%20lifecycle%20complete`, { token: cust.accessToken, body: {} });
        check('PATCH /appointments/:id/cancel completes lifecycle', cancel.status === 200);
      }

      // DB persistence of appointment
      const apptDoc = apptId ? await db.collection('appointments').findOne({ _id: new mongoose.Types.ObjectId(apptId) }) : null;
      check('Appointment persisted in MongoDB', !!apptDoc, apptDoc ? `status=${apptDoc.status}` : '');
    } else {
      log('⚠️ No service item available; skipping booking.');
    }

    // ---------- STEP 8: MongoDB Persistence Verification ----------
    log('\n--- STEP 8: MongoDB Persistence Verification ---');
    const userDoc = await db.collection('users').findOne({ phone: C_PHONE });
    check('users: customer user persisted', !!userDoc && userDoc.role === 'CUSTOMER', `_id=${userDoc?._id}`);
    const profileDoc = await db.collection('customer_profiles').findOne({ userId: userDoc?._id });
    check('customer_profiles: profile persisted', !!profileDoc, profileDoc ? `gender=${profileDoc.gender} birthDate=${profileDoc.birthDate?.toISOString?.().slice(0,10)}` : '');
    const updatedName = await db.collection('users').findOne({ phone: C_PHONE, name: 'Layla Hassan-QA' });
    check('users.name update persisted (no schema validation errors)', !!updatedName);
    const provUser = await db.collection('users').findOne({ phone: P_PHONE });
    check('users: provider user persisted', !!provUser && provUser.role === 'PROVIDER');
    const provDoc = await db.collection('service_providers').findOne({ userId: provUser?._id });
    check('service_providers: provider + embedded services persisted', !!provDoc && (provDoc.services?.length || 0) > 0,
      provDoc ? `status=${provDoc.status} categories=${provDoc.services?.length}` : '');
    const refreshTokens = await db.collection('refreshtokens').countDocuments({});
    log(`   refreshtokens docs: ${refreshTokens}`);
    const errorLogs = await db.collection('errorlogs').countDocuments({}).catch(() => 'n/a');
    log(`   errorlogs docs: ${errorLogs}`);

    await mongoose.disconnect();
    dbOk = true;
  } catch (e) {
    log(`❌ DB step error: ${e.message}`);
  }

  log(`\n===== SUMMARY: ${passCount} passed, ${failCount} failed =====`);
  return finish();
}

function finish() {
  log('\n---- API CALL LOG ----');
  apiCalls.forEach(c => log(`  ${c.status} ${c.method} ${c.url}`));
  fs.writeFileSync(path.join(__dirname, 'api-e2e-results.txt'), results.join('\n'));
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(e => { log(`❌ FATAL: ${e.message}\n${e.stack}`); finish(); });