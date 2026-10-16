# E2E Diagnostic Report — Task 1787348608575
**Glow Up (glow-up-api + glow-up-web) — Automated QA & E2E Testing**
Date: 2026-08-22 | Tester: ox-alpha (Automated QA & E2E Specialist)

---

## 1. Executive Summary

A full system end-to-end test was executed across the NestJS backend (`:3000`), Next.js frontend (`:3001`), and MongoDB replica set (`:27017`, `glowhub` DB). The complete customer journey — **registration → authentication → profile management → services exploration → appointment booking lifecycle** — now passes end-to-end at both the API and UI levels, with all writes verified directly in MongoDB.

| Suite | Result |
|---|---|
| API-level E2E (`api-e2e-test.js`) | **21 / 22 checks passed** |
| UI-level E2E (`automate-ui-v2.js`, Playwright) | **8 / 8 checks passed** |
| MongoDB persistence verification | ✅ All entities persisted, no transaction/schema validation errors |

**2 defects were found and fixed; 1 defect remains open (documented below).**

---

## 2. Environment Remediation Performed

The test environment was found degraded on start:

1. **Backend (glow-up-api) was DOWN** — nothing listening on `:3000`. This was the root cause of the previous run's registration/profile `500 Internal Server Error`s. Restarted via `npm run start:dev`; logs captured to `backend.log`.
2. **Frontend (glow-up-web) served stale chunks** — five 404s on load prevented React hydration (no interactive DOM). Restarted Next.js 14.2.35 dev server cleanly (`start-frontend.bat`); logs in `frontend.log`.
3. **Test data seeded** (required for booking): lookups (`PROVIDER_TYPE/SERVICE_CATEGORY/SERVICE_TYPE/EMPLOYEE_POSITION`), an APPROVED provider "Glow QA Salon" with embedded services + working hours, an assigned stylist employee, and ACTIVE provider subscriptions.

---

## 3. Test Results Detail

### 3.1 Registration & Authentication (dynamic dummy data)
- OTP request/verify: `201` × 4 (customer + provider flows)
- `POST /auth/customer/create-profile` → **201** (UI and API) — user + customer profile created inside a MongoDB transaction
- Existing-user OTP login lands on `/home` ✅
- Dynamic data per run: unique phone/email (e.g., `0589194223`, `ui.tester.<ts>@example.com`)

### 3.2 Profile Management
- `GET /customer/me` → 200; `PATCH /customer/me` → **200 from the real UI save button**
- Persistence verified in DB: name update written to `users.name` (by design, `getMyProfile` derives first/last name from `users.name`)

### 3.3 Services Exploration
- `GET /providers` list/search → 200; salon detail exposes embedded services once an employee is assigned (by-design filter)
- `GET /providers/:id/slots?date=...&serviceId=...` → 200 with bookable slots
- UI: services page loads, search executed, salon page renders

### 3.4 Booking Lifecycle (full, via UI)
Salon page → select service → Proceed → "Booking for myself" → Team ("Any Specialist") → time slot → Booking details → Payment ("pay at center"/CASH) → **"تأكيد الحجز"**:
- `POST /appointments` → **201**, landed on `/booking-success`
- Server-side recalculation of slot end (10:00 → 10:45) worked correctly
- API-level lifecycle also covered create → list (`/appointments/me`) 

### 3.5 MongoDB Persistence (direct verification)
Latest UI-created appointment `_id=6a88e9055b0882b20dd3a8ec`: status `CONFIRMED`, price 25 SAR, employee assigned, slot 10:00–10:45.
Collection counts: users 26, customer_profiles 19, service_providers 5, employees 2, appointments 2, providersubscriptions 5, refreshtokens 35, lookups 4.
**No transaction or schema-validation errors during the passing runs.**

---

## 4. Defects Found

### 🔴 DEFECT 1 (OPEN): Cancelling a CASH appointment returns HTTP 500
- **Evidence:** `PATCH /appointments/:id/cancel` → 500 `{"errorCode":"UNEXPECTED","message":"Payment transaction not found for this appointment"}`
- **Root cause:** `PaymentTransaction.service.ts` throws a raw `new Error('common.errors.PaymentTransactions_NOT_FOUND')`. CASH bookings have no payment transaction, so cancellation always crashes instead of handling gracefully.
- **Recommendation:** In the cancel flow, skip refund logic when no payment transaction exists (or throw a proper `NotFoundException`). Also recorded in the app's own `errorlogs` collection.

### 🟢 DEFECT 2 (FIXED): Profile page could never save — PATCH /customer/me returned 400
- **Evidence:** UI save → 400 `"property email should not exist"`
- **Root cause:** Frontend `accounts.service.ts` sent `email`/`phone` in the payload, but backend `UpdateCustomerProfileDto` whitelists only `firstName/lastName/gender/birthDate` (global pipe uses `forbidNonWhitelisted`).
- **Fix applied:** Removed `email`/`phone` from the update payload in `glow-up-web/integration/services/accounts/accounts.service.ts`. Verified: UI save now returns 200.

### 🟢 DEFECT 3 (FIXED, environmental): Stale frontend chunk state blocked hydration
- Long-running `next dev` served 404 chunks → pages rendered empty (this also invalidated parts of the earlier automation run). Fixed by clean restart of the dev server.

### ⚠️ Observations (non-blocking)
- Historical `errorlogs` contain *"Transaction numbers are only allowed on a replica set member or mongos"* — confirming earlier 500s occurred when MongoDB wasn't reachable as replica set `rs0`. Current runs show no such errors.
- Recurring console noise: `net::ERR_NAME_NOT_RESOLVED` (~1/page) from an unresolved external resource (likely a font/CDN URL) — cosmetic, but worth fixing for production.
- Provider public detail hides services not assigned to an active employee — intended behavior, but easy to misdiagnose; consider documenting.

---

## 5. Evidence Artifacts

| Artifact | Path |
|---|---|
| API E2E results | `api-e2e-results.txt` |
| UI E2E results | `ui-automation-results.txt` |
| UI network log (all API calls + statuses) | `ui-network-log.txt` |
| Browser console errors | `ui-console-log.txt` |
| Backend server log | `backend.log` |
| Frontend server log | `frontend.log` |
| Screenshots (registration, profile, services, salon, booking-for, team, slot, details, payment, **booking-success**) | `screenshots/ui-01…ui-15*.png` (+ legacy `01–42*.png` from prior sweep) |
| Reproduction scripts | `api-e2e-test.js`, `automate-ui-v2.js`, `debug-repro.js`, `verify-final.js` |

Key screenshots: `ui-03-registration-complete-home.png`, `ui-05-profile-updated.png`, `ui-07-services-search-results.png`, `ui-13b-payment-details.png`, `ui-14-booking-result.png` (booking-success).

---

## 6. Focus Chain Status

- [x] Explore project structure (backend & frontend)
- [x] Start backend server (glow-up-api)
- [x] Start frontend server (glow-up-web)
- [x] Set up browser automation script
- [x] Automate UI data entry (registration, login, services, appointments, profile)
- [x] Validate entries and capture screenshots/logs

**Conclusion:** The full customer journey is verified working end-to-end with database persistence confirmed. One open defect (appointment cancellation 500 for cash bookings) is fully diagnosed with a recommended fix.