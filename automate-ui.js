const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001';
const OTP_CODE = '1234';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const results = [];
const consoleErrors = [];

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);
  results.push(line);
}

async function screenshot(page, name) {
  const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  log(`📸 Screenshot saved: ${filePath}`);
}

async function fillOtp(page) {
  // The input-otp library uses a single input element with inputmode="numeric"
  const otpInput = page.locator('input[inputmode="numeric"]').first();
  if (await otpInput.count() > 0) {
    await otpInput.fill(OTP_CODE);
    log('✅ Entered OTP: 1234');
    return true;
  }
  
  // Fallback: try to find any input with maxlength=4
  const allInputs = page.locator('input');
  const count = await allInputs.count();
  for (let i = 0; i < count; i++) {
    const input = allInputs.nth(i);
    const type = await input.getAttribute('type');
    const maxLength = await input.getAttribute('maxlength');
    if ((type === 'text' || type === 'tel' || type === 'number') && maxLength === '4') {
      await input.fill(OTP_CODE);
      log('✅ Entered OTP: 1234');
      return true;
    }
  }
  
  // Last resort: type into focused element
  log('⚠️ Could not find OTP input, trying to type into focused element');
  await page.keyboard.type(OTP_CODE);
  return true;
}

async function registerCustomer(page) {
  log('=== STEP 1: Customer Registration ===');
  
  // Navigate to login page
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await screenshot(page, '01-login-page');

  // Enter phone number
  const phoneInput = page.locator('input[type="tel"]').first();
  await phoneInput.fill('0551234569');
  log('✅ Entered phone number: 0551234569');

  // Click login button
  const loginButton = page.locator('button[type="submit"]').first();
  await loginButton.click();
  log('✅ Clicked login button');

  // Wait for OTP screen
  await page.waitForTimeout(3000);
  await screenshot(page, '02-otp-screen');

  // Enter OTP code
  await fillOtp(page);
  await page.waitForTimeout(2000);

  // Click verify button if present
  const verifyButton = page.locator('button:has-text("Verify"), button:has-text("تحقق")').first();
  if (await verifyButton.count() > 0) {
    await verifyButton.click();
    log('✅ Clicked verify button');
  }

  // Wait for name registration form
  await page.waitForTimeout(3000);
  await screenshot(page, '03-name-registration');

  // Wait for name registration form to appear
  await page.waitForSelector('input[type="text"]', { timeout: 10000 }).catch(() => {
    log('⚠️ Name registration form not found, checking current page state');
  });

  // Fill name registration form
  const firstNameInput = page.locator('input[type="text"]').nth(0);
  const lastNameInput = page.locator('input[type="text"]').nth(1);
  const emailInput = page.locator('input[type="email"]').first();
  const birthDateInput = page.locator('input[type="date"]').first();
  const genderSelect = page.locator('select').first();

  await firstNameInput.fill('سارة');
  log('✅ Entered first name: سارة');
  await lastNameInput.fill('أحمد');
  log('✅ Entered last name: أحمد');
  await emailInput.fill('sara.ahmed2@example.com');
  log('✅ Entered email: sara.ahmed2@example.com');
  await birthDateInput.fill('1995-05-15');
  log('✅ Entered birth date: 1995-05-15');
  await genderSelect.selectOption('FEMALE');
  log('✅ Selected gender: FEMALE');

  // Accept terms - find the circular checkbox button inside the form
  const termsButton = page.locator('form button[type="button"]').first();
  await termsButton.click();
  log('✅ Accepted terms');
  await page.waitForTimeout(500);

  // Submit form
  const submitButton = page.locator('button[type="submit"]').last();
  await submitButton.click();
  log('✅ Submitted registration form');

  // Wait for redirect to home
  await page.waitForTimeout(5000);
  await screenshot(page, '04-customer-home');
  log('✅ Customer registration complete!');
}

async function registerProvider(page) {
  log('\n=== STEP 2: Provider Registration ===');
  
  // Navigate to login page
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Switch to salon tab
  const salonTab = page.locator('button:has-text("Salon"), button:has-text("صالون")').first();
  if (await salonTab.count() > 0) {
    await salonTab.click();
    log('✅ Switched to Salon tab');
  }

  // Enter phone number
  const phoneInput = page.locator('input[type="tel"]').first();
  await phoneInput.fill('0559876545');
  log('✅ Entered provider phone: 0559876545');

  // Click login button
  const loginButton = page.locator('button[type="submit"]').first();
  await loginButton.click();
  log('✅ Clicked login button');

  // Wait for OTP screen
  await page.waitForTimeout(3000);

  // Enter OTP
  await fillOtp(page);
  await page.waitForTimeout(2000);

  // Click verify button
  const verifyButton = page.locator('button:has-text("Verify"), button:has-text("تحقق")').first();
  if (await verifyButton.count() > 0) {
    await verifyButton.click();
    log('✅ Clicked verify button');
  }

  // Wait for provider profile page
  await page.waitForTimeout(5000);
  await screenshot(page, '05-provider-profile');

  // Fill provider profile form
  const nameInput = page.locator('input[type="text"]').first();
  const emailInput = page.locator('input[type="email"]').first();
  const agreeCheckbox = page.locator('input[type="checkbox"]').first();

  await nameInput.fill('صالون الجمال');
  log('✅ Entered salon name: صالون الجمال');
  await emailInput.fill('salon2@example.com');
  log('✅ Entered salon email: salon2@example.com');
  await agreeCheckbox.check();
  log('✅ Checked agree terms');

  // Submit
  const submitButton = page.locator('button[type="submit"]').first();
  await submitButton.click();
  log('✅ Submitted provider profile');

  // Wait for next step
  await page.waitForTimeout(5000);
  await screenshot(page, '06-provider-activity-type');
  log('✅ Provider registration complete!');
}

async function main() {
  log('🚀 Starting UI Automation for Glow Up App');
  log(`Base URL: ${BASE_URL}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
  });

  const page = await context.newPage();

  // Capture console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      log(`❌ Console error: ${msg.text()}`);
    }
  });

  page.on('pageerror', (error) => {
    consoleErrors.push(error.message);
    log(`❌ Page error: ${error.message}`);
  });

  try {
    // Test 1: Customer Registration
    await registerCustomer(page);

    // Test 2: Provider Registration
    await registerProvider(page);

    // Test 3: Explore services page
    log('\n=== STEP 3: Explore Services Page ===');
    await page.goto(`${BASE_URL}/services`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshot(page, '07-services-page');
    log('✅ Services page loaded');

    // Test 4: Explore home page
    log('\n=== STEP 4: Explore Home Page ===');
    await page.goto(`${BASE_URL}/home`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshot(page, '08-home-page');
    log('✅ Home page loaded');

    // Test 5: Explore packages page
    log('\n=== STEP 5: Explore Packages Page ===');
    await page.goto(`${BASE_URL}/packages`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshot(page, '09-packages-page');
    log('✅ Packages page loaded');

    // Test 6: Explore contact page
    log('\n=== STEP 6: Explore Contact Page ===');
    await page.goto(`${BASE_URL}/contact`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshot(page, '10-contact-page');
    log('✅ Contact page loaded');

    // Test 7: Explore support page
    log('\n=== STEP 7: Explore Support Page ===');
    await page.goto(`${BASE_URL}/support`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshot(page, '11-support-page');
    log('✅ Support page loaded');

    // Test 8: Explore favorites page
    log('\n=== STEP 8: Explore Favorites Page ===');
    await page.goto(`${BASE_URL}/favorites`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshot(page, '12-favorites-page');
    log('✅ Favorites page loaded');

    // Test 9: Explore wallet page
    log('\n=== STEP 9: Explore Wallet Page ===');
    await page.goto(`${BASE_URL}/wallet`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshot(page, '13-wallet-page');
    log('✅ Wallet page loaded');

    // Test 10: Explore my bookings page
    log('\n=== STEP 10: Explore My Bookings Page ===');
    await page.goto(`${BASE_URL}/my-booking`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshot(page, '14-my-bookings-page');
    log('✅ My bookings page loaded');

    // Test 11: Explore profile page
    log('\n=== STEP 11: Explore Profile Page ===');
    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshot(page, '15-profile-page');
    log('✅ Profile page loaded');

    // Test 12: Explore booking flow
    log('\n=== STEP 12: Explore Booking Flow ===');
    await page.goto(`${BASE_URL}/booking-for`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshot(page, '16-booking-for-page');
    log('✅ Booking-for page loaded');

    await page.goto(`${BASE_URL}/booking-details`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshot(page, '17-booking-details-page');
    log('✅ Booking-details page loaded');

    await page.goto(`${BASE_URL}/booking-multi`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshot(page, '18-booking-multi-page');
    log('✅ Booking-multi page loaded');

    await page.goto(`${BASE_URL}/booking-gift`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshot(page, '19-booking-gift-page');
    log('✅ Booking-gift page loaded');

    await page.goto(`${BASE_URL}/booking-success`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshot(page, '20-booking-success-page');
    log('✅ Booking-success page loaded');

    // Test 13: Explore glow gift page
    log('\n=== STEP 13: Explore Glow Gift Page ===');
    await page.goto(`${BASE_URL}/glow-gift`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshot(page, '21-glow-gift-page');
    log('✅ Glow gift page loaded');

    // Test 14: Explore payment details page
    log('\n=== STEP 14: Explore Payment Details Page ===');
    await page.goto(`${BASE_URL}/payment-details`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshot(page, '22-payment-details-page');
    log('✅ Payment details page loaded');

    // Test 15: Explore about page
    log('\n=== STEP 15: Explore About Page ===');
    await page.goto(`${BASE_URL}/about`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshot(page, '23-about-page');
    log('✅ About page loaded');

    // Test 16: Explore terms page
    log('\n=== STEP 16: Explore Terms Page ===');
    await page.goto(`${BASE_URL}/terms`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshot(page, '24-terms-page');
    log('✅ Terms page loaded');

    // Test 17: Explore privacy page
    log('\n=== STEP 17: Explore Privacy Page ===');
    await page.goto(`${BASE_URL}/privacy`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshot(page, '25-privacy-page');
    log('✅ Privacy page loaded');

    // Test 18: Explore chat page
    log('\n=== STEP 18: Explore Chat Page ===');
    await page.goto(`${BASE_URL}/chat`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshot(page, '26-chat-page');
    log('✅ Chat page loaded');

    // Test 19: Explore accounts page
    log('\n=== STEP 19: Explore Accounts Page ===');
    await page.goto(`${BASE_URL}/accounts`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshot(page, '27-accounts-page');
    log('✅ Accounts page loaded');

    // Test 20: Explore admin login page
    log('\n=== STEP 20: Explore Admin Login Page ===');
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshot(page, '28-admin-login-page');
    log('✅ Admin login page loaded');

    // Test 21: Explore provider login page
    log('\n=== STEP 21: Explore Provider Login Page ===');
    await page.goto(`${BASE_URL}/provider/provider-login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshot(page, '29-provider-login-page');
    log('✅ Provider login page loaded');

    // Test 22: Explore provider pages
    log('\n=== STEP 22: Explore Provider Pages ===');
    const providerPages = [
      '/provider/activityType',
      '/provider/documents',
      '/provider/location',
      '/provider/packages',
      '/provider/salon-profile',
      '/provider/salon-service',
      '/provider/service',
      '/provider/terms',
      '/provider/upload-images',
      '/provider/workingHours',
      '/provider/provider-team',
    ];
    
    for (let i = 0; i < providerPages.length; i++) {
      const p = providerPages[i];
      await page.goto(`${BASE_URL}${p}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      await screenshot(page, `30-provider-${i + 1}-${p.replace(/\//g, '-')}`);
      log(`✅ Provider page loaded: ${p}`);
    }

    // Test 23: Explore admin dashboard pages
    log('\n=== STEP 23: Explore Admin Dashboard Pages ===');
    const adminPages = [
      '/admin-dashboard/home',
      '/admin-dashboard/services',
      '/admin-dashboard/team',
      '/admin-dashboard/orders',
      '/admin-dashboard/packages',
      '/admin-dashboard/profile',
      '/admin-dashboard/settings',
      '/admin-dashboard/working-hours',
      '/admin-dashboard/manage-breaks',
      '/admin-dashboard/request-break',
      '/admin-dashboard/salon-details',
      '/admin-dashboard/map-location',
      '/admin-dashboard/location-settings',
      '/admin-dashboard/gallery',
      '/admin-dashboard/documents',
      '/admin-dashboard/chat',
      '/admin-dashboard/my-subscription',
    ];
    
    for (let i = 0; i < adminPages.length; i++) {
      const p = adminPages[i];
      await page.goto(`${BASE_URL}${p}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      await screenshot(page, `31-admin-${i + 1}-${p.replace(/\//g, '-')}`);
      log(`✅ Admin dashboard page loaded: ${p}`);
    }

    // Test 24: Explore super admin dashboard pages
    log('\n=== STEP 24: Explore Super Admin Dashboard Pages ===');
    const superAdminPages = [
      '/super-admin-dashboard',
      '/super-admin-dashboard/users',
      '/super-admin-dashboard/salons',
      '/super-admin-dashboard/services',
      '/super-admin-dashboard/bookings',
      '/super-admin-dashboard/customers',
      '/super-admin-dashboard/employees',
      '/super-admin-dashboard/plans',
      '/super-admin-dashboard/coupons',
      '/super-admin-dashboard/ads',
      '/super-admin-dashboard/ratings',
      '/super-admin-dashboard/tickets',
      '/super-admin-dashboard/lookups',
    ];
    
    for (let i = 0; i < superAdminPages.length; i++) {
      const p = superAdminPages[i];
      await page.goto(`${BASE_URL}${p}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      await screenshot(page, `32-super-admin-${i + 1}-${p.replace(/\//g, '-')}`);
      log(`✅ Super admin page loaded: ${p}`);
    }

    // Test 25: Explore salon pages
    log('\n=== STEP 25: Explore Salon Pages ===');
    await page.goto(`${BASE_URL}/salon/1`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshot(page, '33-salon-page');
    log('✅ Salon page loaded');

    // Test 26: Explore reviews page
    log('\n=== STEP 26: Explore Reviews Page ===');
    await page.goto(`${BASE_URL}/reviews/1`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshot(page, '34-reviews-page');
    log('✅ Reviews page loaded');

    // Test 27: Explore team page
    log('\n=== STEP 27: Explore Team Page ===');
    await page.goto(`${BASE_URL}/team/1`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshot(page, '35-team-page');
    log('✅ Team page loaded');

    // Test 28: Explore booking slot page
    log('\n=== STEP 28: Explore Booking Slot Page ===');
    await page.goto(`${BASE_URL}/booking-slot/1`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshot(page, '36-booking-slot-page');
    log('✅ Booking slot page loaded');

    // Test 29: Explore chat with salon
    log('\n=== STEP 29: Explore Chat with Salon ===');
    await page.goto(`${BASE_URL}/chat/1`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshot(page, '37-chat-salon-page');
    log('✅ Chat with salon page loaded');

    // Test 30: Explore accounts sub-pages
    log('\n=== STEP 30: Explore Accounts Sub-pages ===');
    const accountPages = [
      '/accounts/profile',
      '/accounts/settings',
      '/accounts/favorites',
      '/accounts/packages',
      '/accounts/wallet',
      '/accounts/support',
      '/accounts/upgrade',
    ];
    
    for (let i = 0; i < accountPages.length; i++) {
      const p = accountPages[i];
      await page.goto(`${BASE_URL}${p}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      await screenshot(page, `38-account-${i + 1}-${p.replace(/\//g, '-')}`);
      log(`✅ Account page loaded: ${p}`);
    }

    // Test 31: Explore login_ page
    log('\n=== STEP 31: Explore Login_ Page ===');
    await page.goto(`${BASE_URL}/login_`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshot(page, '39-login_alt-page');
    log('✅ Login_ page loaded');

    // Test 32: Explore provider page
    log('\n=== STEP 32: Explore Provider Page ===');
    await page.goto(`${BASE_URL}/provider`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshot(page, '40-provider-page');
    log('✅ Provider page loaded');

    // Test 33: Explore home page
    log('\n=== STEP 33: Explore Home Page (Root) ===');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshot(page, '41-root-page');
    log('✅ Root page loaded');

    // Test 34: Explore not-found page
    log('\n=== STEP 34: Explore Not Found Page ===');
    await page.goto(`${BASE_URL}/nonexistent-page`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await screenshot(page, '42-not-found-page');
    log('✅ Not found page loaded');

  } catch (error) {
    log(`❌ ERROR: ${error.message}`);
    await screenshot(page, 'error-page');
  } finally {
    // Write results to file
    const resultFile = path.join(__dirname, 'automation-results.txt');
    fs.writeFileSync(resultFile, results.join('\n'));
    log(`\n📄 Results written to: ${resultFile}`);
    
    if (consoleErrors.length > 0) {
      log(`\n⚠️ Console errors detected: ${consoleErrors.length}`);
      consoleErrors.forEach((err, i) => log(`  ${i + 1}. ${err}`));
    } else {
      log('\n✅ No console errors detected!');
    }

    await browser.close();
    log('\n🏁 Automation complete!');
  }
}

main().catch(console.error);