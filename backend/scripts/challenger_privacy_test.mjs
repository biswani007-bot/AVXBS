import fs from 'fs';
import path from 'path';
import { SignJWT } from 'jose';

// Load .env from backend/.env
const envFile = fs.readFileSync(path.resolve('backend/.env'), 'utf-8');
envFile.split('\n').forEach(line => {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
});

const BASE_URL = 'http://localhost:3000';
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'avxbs_ultra_secure_jwt_token_secret_key_2026_x89!'
);

async function generateAdminToken() {
  return new SignJWT({ id: 'admin123', role: 'admin', email: 'admin@avxbs.com' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(JWT_SECRET);
}

let passed = 0;
let failed = 0;
const testRecordsCreated = [];

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function getPublicTestimonials() {
  const res = await fetch(`${BASE_URL}/api/testimonials`);
  if (!res.ok) throw new Error(`GET /api/testimonials returned ${res.status}`);
  return await res.json();
}

async function getAdminTestimonials(token, queryParams = '') {
  const res = await fetch(`${BASE_URL}/api/testimonials?all=true${queryParams}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Admin GET /api/testimonials?all=true returned ${res.status}`);
  return await res.json();
}

async function createReview(token, data) {
  const res = await fetch(`${BASE_URL}/api/testimonials`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (res.ok && json.success && json.testimonial) {
    testRecordsCreated.push(json.testimonial._id);
  }
  return { status: res.status, json };
}

async function updateReview(token, id, data) {
  const res = await fetch(`${BASE_URL}/api/testimonials/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  return { status: res.status, json };
}

async function deleteReview(token, id) {
  const res = await fetch(`${BASE_URL}/api/testimonials/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return { status: res.status, json: await res.json() };
}

async function run() {
  console.log('================================================================');
  console.log('CHALLENGER M1-2: EMPIRICAL REVIEW PRIVACY & QUERY VERIFICATION');
  console.log('================================================================\n');

  const token = await generateAdminToken();

  // -------------------------------------------------------------
  // Phase 1: Baseline Recording
  // -------------------------------------------------------------
  console.log('--- Phase 1: Baseline Database & Public API Snapshot ---');
  const baselinePublic = await getPublicTestimonials();
  console.log(`Initial public testimonials count: ${baselinePublic.count}`);
  const baselinePublicIds = new Set(baselinePublic.testimonials.map(t => t._id));

  const baselineAdmin = await getAdminTestimonials(token);
  console.log(`Initial admin total testimonials count: ${baselineAdmin.count}`);
  const baselineAdminMap = new Map(baselineAdmin.testimonials.map(t => [t._id, {
    customerName: t.customerName,
    isActive: t.isActive,
    showOnHomepage: t.showOnHomepage,
    approvalStatus: t.approvalStatus,
    rating: t.rating
  }]));

  assert(baselinePublic.success === true, 'Public GET /api/testimonials returns success=true');
  assert(baselinePublic.count > 0, `Pre-existing public reviews exist (found ${baselinePublic.count})`);

  // Verify all pre-existing public reviews meet public filter criteria
  let allMeetCriteria = true;
  for (const t of baselinePublic.testimonials) {
    if (t.isActive === false || t.showOnHomepage === false || t.approvalStatus !== 'approved' || t.isSample === true) {
      allMeetCriteria = false;
      console.error('Invalid review in public list:', t);
    }
  }
  assert(allMeetCriteria, 'All baseline public reviews have isActive!=false, showOnHomepage=true, approvalStatus=approved, isSample!=true');

  // -------------------------------------------------------------
  // Phase 2: Create Inactive Review & Verify Public Isolation
  // -------------------------------------------------------------
  console.log('\n--- Phase 2: Create Review with isActive: false ---');
  const inactivePayload = {
    customerName: '__CHALLENGER_INACTIVE_TEST__',
    email: 'challenger_inactive@test.com',
    designation: 'Security Auditor',
    category: 'Commercial',
    rating: 5,
    feedback: 'This review is inactive and must NEVER appear on the public homepage.',
    showOnHomepage: true,
    isActive: false,
    approvalStatus: 'approved'
  };

  const createRes1 = await createReview(token, inactivePayload);
  assert(createRes1.status === 201, `Created review with isActive:false (HTTP ${createRes1.status})`);
  const inactiveId = createRes1.json.testimonial._id;
  assert(createRes1.json.testimonial.isActive === false, 'Created review returned isActive:false');
  console.log(`Created inactive review ID: ${inactiveId}`);

  // Query public endpoint
  const publicAfterCreate = await getPublicTestimonials();
  const containsInactive = publicAfterCreate.testimonials.some(t => t._id === inactiveId || t.customerName === '__CHALLENGER_INACTIVE_TEST__');
  assert(!containsInactive, 'CRITICAL: Inactive review is STRICTLY ABSENT from public GET /api/testimonials');
  assert(publicAfterCreate.count === baselinePublic.count, `Public count unchanged (${publicAfterCreate.count} == ${baselinePublic.count})`);

  // -------------------------------------------------------------
  // Phase 3: Toggle isActive: false -> isActive: true
  // -------------------------------------------------------------
  console.log('\n--- Phase 3: Toggle isActive: false -> true ---');
  const toggleToActive = await updateReview(token, inactiveId, { isActive: true });
  assert(toggleToActive.status === 200, `Toggle to isActive:true returned HTTP ${toggleToActive.status}`);
  assert(toggleToActive.json.testimonial.isActive === true, 'Updated review has isActive:true');

  const publicAfterActive = await getPublicTestimonials();
  const containsActive = publicAfterActive.testimonials.some(t => t._id === inactiveId);
  assert(containsActive, 'CRITICAL: Toggled review is NOW VISIBLE in public GET /api/testimonials');
  assert(publicAfterActive.count === baselinePublic.count + 1, `Public count incremented by 1 (${publicAfterActive.count} == ${baselinePublic.count + 1})`);

  // -------------------------------------------------------------
  // Phase 4: Toggle isActive: true -> isActive: false
  // -------------------------------------------------------------
  console.log('\n--- Phase 4: Toggle isActive: true -> false ---');
  const toggleToInactive = await updateReview(token, inactiveId, { isActive: false });
  assert(toggleToInactive.status === 200, `Toggle back to isActive:false returned HTTP ${toggleToInactive.status}`);
  assert(toggleToInactive.json.testimonial.isActive === false, 'Updated review has isActive:false');

  const publicAfterInactive = await getPublicTestimonials();
  const containsInactiveAgain = publicAfterInactive.testimonials.some(t => t._id === inactiveId);
  assert(!containsInactiveAgain, 'CRITICAL: Toggled review IMMEDIATELY DISAPPEARED from public GET /api/testimonials');
  assert(publicAfterInactive.count === baselinePublic.count, `Public count reverted to baseline (${publicAfterInactive.count} == ${baselinePublic.count})`);

  // -------------------------------------------------------------
  // Phase 5: Test showOnHomepage: false isolation & toggling
  // -------------------------------------------------------------
  console.log('\n--- Phase 5: Create Review with showOnHomepage: false ---');
  const hiddenPayload = {
    customerName: '__CHALLENGER_HIDDEN_TEST__',
    email: 'challenger_hidden@test.com',
    designation: 'Privacy Tester',
    category: 'Residential',
    rating: 4,
    feedback: 'This review has showOnHomepage:false and must NEVER appear publicly.',
    showOnHomepage: false,
    isActive: true,
    approvalStatus: 'approved'
  };

  const createRes2 = await createReview(token, hiddenPayload);
  assert(createRes2.status === 201, `Created review with showOnHomepage:false (HTTP ${createRes2.status})`);
  const hiddenId = createRes2.json.testimonial._id;

  const publicWithHidden = await getPublicTestimonials();
  const containsHidden = publicWithHidden.testimonials.some(t => t._id === hiddenId || t.customerName === '__CHALLENGER_HIDDEN_TEST__');
  assert(!containsHidden, 'CRITICAL: showOnHomepage:false review is STRICTLY ABSENT from public API');
  assert(publicWithHidden.count === baselinePublic.count, `Public count remains at baseline (${publicWithHidden.count})`);

  // Toggle showOnHomepage: true
  console.log('Toggling showOnHomepage: false -> true');
  const toggleHomepageVisible = await updateReview(token, hiddenId, { showOnHomepage: true });
  assert(toggleHomepageVisible.status === 200, 'Toggled showOnHomepage:true');
  const publicWithVisible = await getPublicTestimonials();
  assert(publicWithVisible.testimonials.some(t => t._id === hiddenId), 'Review with showOnHomepage:true appears in public API');

  // Toggle showOnHomepage: false
  console.log('Toggling showOnHomepage: true -> false');
  const toggleHomepageHidden = await updateReview(token, hiddenId, { showOnHomepage: false });
  assert(toggleHomepageHidden.status === 200, 'Toggled showOnHomepage:false');
  const publicWithoutHidden = await getPublicTestimonials();
  assert(!publicWithoutHidden.testimonials.some(t => t._id === hiddenId), 'Review with showOnHomepage:false immediately disappears from public API');

  // -------------------------------------------------------------
  // Phase 6: Test approvalStatus isolation & toggling
  // -------------------------------------------------------------
  console.log('\n--- Phase 6: Test approvalStatus (pending / rejected) isolation ---');
  const pendingPayload = {
    customerName: '__CHALLENGER_PENDING_TEST__',
    email: 'challenger_pending@test.com',
    designation: 'Tester',
    category: 'Residential',
    rating: 5,
    feedback: 'Pending approval review testing.',
    showOnHomepage: true,
    isActive: true,
    approvalStatus: 'pending'
  };

  const createRes3 = await createReview(token, pendingPayload);
  assert(createRes3.status === 201, `Created review with approvalStatus:pending (HTTP ${createRes3.status})`);
  const pendingId = createRes3.json.testimonial._id;

  const publicWithPending = await getPublicTestimonials();
  assert(!publicWithPending.testimonials.some(t => t._id === pendingId), 'approvalStatus:pending review is NOT displayed publicly');

  // -------------------------------------------------------------
  // Phase 7: Query Infiltration & Parameter Tampering Attacks
  // -------------------------------------------------------------
  console.log('\n--- Phase 7: Query Infiltration & Parameter Tampering ---');

  // Attack 7.1: Public request with ?all=true without token
  const unauthAll = await fetch(`${BASE_URL}/api/testimonials?all=true`);
  assert(unauthAll.status === 401, `Public access to ?all=true rejected with 401 (got ${unauthAll.status})`);

  // Attack 7.2: Public request attempting parameter tampering with status=inactive
  const attackStatus = await fetch(`${BASE_URL}/api/testimonials?status=inactive`);
  const attackStatusJson = await attackStatus.json();
  assert(attackStatus.status === 200, 'Public ?status=inactive returns 200');
  assert(!attackStatusJson.testimonials.some(t => t._id === inactiveId), 'Public ?status=inactive DOES NOT expose inactive reviews');

  // Attack 7.3: Public request attempting parameter tampering with isActive=false
  const attackIsActive = await fetch(`${BASE_URL}/api/testimonials?isActive=false`);
  const attackIsActiveJson = await attackIsActive.json();
  assert(!attackIsActiveJson.testimonials.some(t => t._id === inactiveId), 'Public ?isActive=false DOES NOT bypass active filter');

  // Attack 7.4: Public request attempting parameter tampering with approvalStatus=pending
  const attackApproval = await fetch(`${BASE_URL}/api/testimonials?approvalStatus=pending`);
  const attackApprovalJson = await attackApproval.json();
  assert(!attackApprovalJson.testimonials.some(t => t._id === pendingId), 'Public ?approvalStatus=pending DOES NOT bypass approval filter');

  // -------------------------------------------------------------
  // Phase 8: Flapping Stress Test (Rapid Toggle Inversion)
  // -------------------------------------------------------------
  console.log('\n--- Phase 8: Flapping Stress Test (10 rapid active toggles) ---');
  let flappingPassed = true;
  for (let i = 1; i <= 10; i++) {
    const targetState = (i % 2 === 1); // odd = true, even = false
    await updateReview(token, inactiveId, { isActive: targetState });
    const pub = await getPublicTestimonials();
    const hasItem = pub.testimonials.some(t => t._id === inactiveId);
    if (hasItem !== targetState) {
      console.error(`  Flapping failure at iteration ${i}: expected visible=${targetState}, got visible=${hasItem}`);
      flappingPassed = false;
      break;
    }
  }
  assert(flappingPassed, '10 rapid active state toggles passed with zero race conditions or cache desync');

  // Ensure inactiveId is left inactive before deletion
  await updateReview(token, inactiveId, { isActive: false });

  // -------------------------------------------------------------
  // Phase 9: Admin Filtering API Verification
  // -------------------------------------------------------------
  console.log('\n--- Phase 9: Admin Query Filtering Verification ---');
  const adminActiveOnly = await getAdminTestimonials(token, '&status=active');
  const adminInactiveOnly = await getAdminTestimonials(token, '&status=inactive');
  assert(adminActiveOnly.testimonials.every(t => t.isActive !== false), 'Admin ?status=active returns only active reviews');
  assert(adminInactiveOnly.testimonials.every(t => t.isActive === false), 'Admin ?status=inactive returns only inactive reviews');
  assert(adminInactiveOnly.testimonials.some(t => t._id === inactiveId), 'Admin ?status=inactive includes our inactive test review');

  // -------------------------------------------------------------
  // Phase 10: Clean Deletion of All Test Records
  // -------------------------------------------------------------
  console.log('\n--- Phase 10: Clean Deletion of Test Records ---');
  console.log(`Deleting ${testRecordsCreated.length} test records: ${testRecordsCreated.join(', ')}`);
  for (const testId of testRecordsCreated) {
    const delRes = await deleteReview(token, testId);
    assert(delRes.status === 200, `Deleted test review ${testId} (HTTP ${delRes.status})`);
    
    // Verify GET by ID returns 404
    const checkRes = await fetch(`${BASE_URL}/api/testimonials/${testId}`);
    assert(checkRes.status === 404, `Test review ${testId} returns 404 on GET`);
  }

  // -------------------------------------------------------------
  // Phase 11: Database Integrity & Baseline Comparison
  // -------------------------------------------------------------
  console.log('\n--- Phase 11: Final Database Integrity Verification ---');
  const finalPublic = await getPublicTestimonials();
  assert(finalPublic.count === baselinePublic.count, `Public review count is exactly baseline (${finalPublic.count} == ${baselinePublic.count})`);

  const finalPublicIds = new Set(finalPublic.testimonials.map(t => t._id));
  assert(
    [...baselinePublicIds].every(id => finalPublicIds.has(id)) &&
    [...finalPublicIds].every(id => baselinePublicIds.has(id)),
    'Public reviews set exactly matches baseline set (0 missing, 0 extra)'
  );

  const finalAdmin = await getAdminTestimonials(token);
  assert(finalAdmin.count === baselineAdmin.count, `Admin total review count is exactly baseline (${finalAdmin.count} == ${baselineAdmin.count})`);

  let preExistingIntact = true;
  for (const t of finalAdmin.testimonials) {
    const base = baselineAdminMap.get(t._id);
    if (!base) {
      preExistingIntact = false;
      console.error(`Unexpected extra review found in admin list: ${t._id}`);
      continue;
    }
    if (
      base.customerName !== t.customerName ||
      base.isActive !== t.isActive ||
      base.showOnHomepage !== t.showOnHomepage ||
      base.approvalStatus !== t.approvalStatus ||
      base.rating !== t.rating
    ) {
      preExistingIntact = false;
      console.error(`Data corruption on pre-existing review ${t._id}: baseline=${JSON.stringify(base)}, final=${JSON.stringify(t)}`);
    }
  }
  assert(preExistingIntact, 'All pre-existing database reviews are 100% intact with zero field corruption');

  // Summary
  console.log('\n================================================================');
  console.log(`VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
