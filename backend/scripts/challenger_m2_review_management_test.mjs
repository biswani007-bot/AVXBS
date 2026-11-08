import fs from 'fs';
import path from 'path';
import { SignJWT } from 'jose';

// Load environment variables from backend/.env
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
  return new SignJWT({ userId: 'admin123', role: 'superadmin', email: 'admin@avxbs.com', name: 'Admin' })
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

async function getTestimonialById(id) {
  const res = await fetch(`${BASE_URL}/api/testimonials/${id}`);
  const json = await res.json();
  return { status: res.status, json };
}

async function createReview(token, data) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/api/testimonials`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (res.ok && json.success && json.testimonial) {
    testRecordsCreated.push(json.testimonial._id);
  }
  return { status: res.status, json };
}

async function updateReview(token, id, data) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/api/testimonials/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data)
  });
  const json = await res.json();
  return { status: res.status, json };
}

async function deleteReview(token, id) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/api/testimonials/${id}`, {
    method: 'DELETE',
    headers
  });
  const json = await res.json();
  return { status: res.status, json };
}

async function run() {
  console.log('========================================================================');
  console.log('CHALLENGER M2: EMPIRICAL REVIEW MANAGEMENT & PRIVACY HARNESS');
  console.log('========================================================================\n');

  const adminToken = await generateAdminToken();

  // -------------------------------------------------------------
  // Baseline Recording
  // -------------------------------------------------------------
  console.log('--- Phase 0: Baseline Snapshot ---');
  const baselinePublic = await getPublicTestimonials();
  const baselineAdmin = await getAdminTestimonials(adminToken);
  console.log(`Initial public count: ${baselinePublic.count}`);
  console.log(`Initial admin total count: ${baselineAdmin.count}`);
  console.log(`Initial admin active count: ${baselineAdmin.summary?.active}`);
  console.log(`Initial admin inactive count: ${baselineAdmin.summary?.inactive}`);

  assert(baselinePublic.success === true, 'Public GET /api/testimonials returns success:true');
  assert(baselineAdmin.success === true, 'Admin GET /api/testimonials?all=true returns success:true');

  // -------------------------------------------------------------
  // Security & Auth Enforcement
  // -------------------------------------------------------------
  console.log('\n--- Phase 1: Security & Auth Enforcement ---');
  const unauthPost = await createReview(null, {
    customerName: 'Hacker',
    feedback: 'Unauthorized review creation attempt'
  });
  assert(unauthPost.status === 401, 'POST /api/testimonials without auth rejected with HTTP 401');

  const unauthPut = await updateReview(null, '507f1f77bcf86cd799439011', { isActive: false });
  assert(unauthPut.status === 401, 'PUT /api/testimonials/:id without auth rejected with HTTP 401');

  const unauthDel = await deleteReview(null, '507f1f77bcf86cd799439011');
  assert(unauthDel.status === 401, 'DELETE /api/testimonials/:id without auth rejected with HTTP 401');

  const unauthAll = await fetch(`${BASE_URL}/api/testimonials?all=true`);
  assert(unauthAll.status === 401, 'GET /api/testimonials?all=true without auth rejected with HTTP 401');

  // -------------------------------------------------------------
  // Step 1: Manual Review Creation with All Fields (isActive: false)
  // -------------------------------------------------------------
  console.log('\n--- Step 1: Manual Review Creation with All Fields (isActive: false) ---');
  const reviewPayload = {
    customerName: 'Empirical M2 Industrial Lead',
    email: 'm2lead@empirical-test.com',
    designation: 'Facilities Director at Horizon Tech',
    category: 'Commercial',
    rating: 5,
    feedback: 'High-volume commercial reverse osmosis plant performance exceeds all specifications with zero downtime.',
    isActive: false,
    showOnHomepage: false,
    isFeatured: false
  };

  const createRes = await createReview(adminToken, reviewPayload);
  assert(createRes.status === 201, `Admin manual review creation returned HTTP 201 (got ${createRes.status})`);
  assert(createRes.json.success === true, 'Admin review creation returned success: true');

  const createdReview = createRes.json.testimonial;
  const reviewId = createdReview._id;
  console.log(`Created Review ID: ${reviewId}`);

  assert(createdReview.customerName === reviewPayload.customerName, `customerName matches: "${createdReview.customerName}"`);
  assert(createdReview.email === reviewPayload.email, `email matches: "${createdReview.email}"`);
  assert(createdReview.designation === reviewPayload.designation, `designation matches: "${createdReview.designation}"`);
  assert(createdReview.category === reviewPayload.category, `category matches: "${createdReview.category}"`);
  assert(createdReview.rating === reviewPayload.rating, `rating matches: ${createdReview.rating}`);
  assert(createdReview.feedback === reviewPayload.feedback, `feedback matches: "${createdReview.feedback}"`);
  assert(createdReview.isActive === false, `isActive is strictly false: ${createdReview.isActive}`);
  assert(createdReview.showOnHomepage === false, `showOnHomepage is false: ${createdReview.showOnHomepage}`);

  // Check admin query reflects the new inactive item
  const adminAfterCreate = await getAdminTestimonials(adminToken);
  assert(adminAfterCreate.count === baselineAdmin.count + 1, `Admin total count incremented (${adminAfterCreate.count} == ${baselineAdmin.count + 1})`);
  assert(adminAfterCreate.summary.inactive === baselineAdmin.summary.inactive + 1, `Admin inactive count incremented by 1 (${adminAfterCreate.summary.inactive} == ${baselineAdmin.summary.inactive + 1})`);
  assert(adminAfterCreate.summary.active === baselineAdmin.summary.active, `Admin active count unchanged (${adminAfterCreate.summary.active} == ${baselineAdmin.summary.active})`);

  // -------------------------------------------------------------
  // Step 2: Strict Privacy Isolation of Inactive Review
  // -------------------------------------------------------------
  console.log('\n--- Step 2: Inactive Review Strictly Excluded from Public GET /api/testimonials ---');
  const publicAfterCreate = await getPublicTestimonials();
  assert(publicAfterCreate.count === baselinePublic.count, `Public count strictly unchanged (${publicAfterCreate.count} == ${baselinePublic.count})`);

  const foundInPublic = publicAfterCreate.testimonials.find(t => t._id === reviewId || t.customerName === reviewPayload.customerName);
  assert(!foundInPublic, 'CRITICAL: Inactive review is 100% ABSENT from public GET /api/testimonials response');

  // Verify parameter tampering cannot expose inactive review
  const tamperInactiveRes = await fetch(`${BASE_URL}/api/testimonials?status=inactive`);
  const tamperInactiveJson = await tamperInactiveRes.json();
  const leakedInactive = tamperInactiveJson.testimonials?.some(t => t._id === reviewId);
  assert(!leakedInactive, 'Adversarial public query ?status=inactive does NOT leak inactive review');

  const tamperIsActiveRes = await fetch(`${BASE_URL}/api/testimonials?isActive=false`);
  const tamperIsActiveJson = await tamperIsActiveRes.json();
  const leakedIsActive = tamperIsActiveJson.testimonials?.some(t => t._id === reviewId);
  assert(!leakedIsActive, 'Adversarial public query ?isActive=false does NOT leak inactive review');

  // -------------------------------------------------------------
  // Step 3: Toggle Active Status to true -> Immediate Public Appearance
  // -------------------------------------------------------------
  console.log('\n--- Step 3: Toggle Active Status to true (Immediate Public Visibility) ---');
  // Emulate Admin UI toggle behavior (setting isActive: true and showOnHomepage: true)
  const toggleToActiveRes = await updateReview(adminToken, reviewId, {
    isActive: true,
    showOnHomepage: true
  });
  assert(toggleToActiveRes.status === 200, `Toggle to Active returned HTTP 200 (got ${toggleToActiveRes.status})`);
  assert(toggleToActiveRes.json.testimonial.isActive === true, 'Review isActive updated to true');
  assert(toggleToActiveRes.json.testimonial.showOnHomepage === true, 'Review showOnHomepage updated to true');

  // Immediately query public endpoint
  const publicAfterToggleActive = await getPublicTestimonials();
  assert(publicAfterToggleActive.count === baselinePublic.count + 1, `Public count incremented by 1 (${publicAfterToggleActive.count} == ${baselinePublic.count + 1})`);

  const activeInPublic = publicAfterToggleActive.testimonials.find(t => t._id === reviewId);
  assert(Boolean(activeInPublic), 'CRITICAL: Toggled review IMMEDIATELY APPEARS in public GET /api/testimonials');
  assert(activeInPublic?.customerName === reviewPayload.customerName, `Publicly visible review customerName matches: "${activeInPublic?.customerName}"`);
  assert(activeInPublic?.rating === 5, 'Publicly visible review rating is 5');
  assert(activeInPublic?.isActive === true, 'Publicly visible review isActive is true');

  // Verify Admin summary reflects the toggle
  const adminAfterToggleActive = await getAdminTestimonials(adminToken);
  assert(adminAfterToggleActive.summary.active === baselineAdmin.summary.active + 1, `Admin active count incremented (${adminAfterToggleActive.summary.active})`);
  assert(adminAfterToggleActive.summary.inactive === baselineAdmin.summary.inactive, `Admin inactive count back to baseline (${adminAfterToggleActive.summary.inactive})`);

  // -------------------------------------------------------------
  // Step 4: Toggle Back to Inactive -> Immediate Disappearance
  // -------------------------------------------------------------
  console.log('\n--- Step 4: Toggle Back to Inactive (Immediate Public Concealment) ---');
  // Emulate Admin UI toggle behavior (setting isActive: false and showOnHomepage: false)
  const toggleToInactiveRes = await updateReview(adminToken, reviewId, {
    isActive: false,
    showOnHomepage: false
  });
  assert(toggleToInactiveRes.status === 200, `Toggle to Inactive returned HTTP 200 (got ${toggleToInactiveRes.status})`);
  assert(toggleToInactiveRes.json.testimonial.isActive === false, 'Review isActive updated to false');
  assert(toggleToInactiveRes.json.testimonial.showOnHomepage === false, 'Review showOnHomepage updated to false');

  // Immediately query public endpoint
  const publicAfterToggleInactive = await getPublicTestimonials();
  assert(publicAfterToggleInactive.count === baselinePublic.count, `Public count reverted to baseline (${publicAfterToggleInactive.count} == ${baselinePublic.count})`);

  const inactiveInPublic = publicAfterToggleInactive.testimonials.find(t => t._id === reviewId);
  assert(!inactiveInPublic, 'CRITICAL: Toggled review IMMEDIATELY DISAPPEARED from public GET /api/testimonials');

  // -------------------------------------------------------------
  // Step 5: Editing Review Fields & Clean Deletion
  // -------------------------------------------------------------
  console.log('\n--- Step 5: Editing Review Fields & Clean Deletion ---');
  const editPayload = {
    customerName: 'Empirical M2 Senior Chief Engineer',
    email: 'modified.m2@empirical-test.com',
    designation: 'VP of Commercial Operations',
    category: 'Commercial',
    rating: 4,
    feedback: 'Updated comprehensive customer review message after 12 months continuous operation.',
    isActive: true,
    showOnHomepage: true
  };

  const editRes = await updateReview(adminToken, reviewId, editPayload);
  assert(editRes.status === 200, `Editing review fields returned HTTP 200 (got ${editRes.status})`);
  assert(editRes.json.success === true, 'Review edit returned success: true');

  const editedReview = editRes.json.testimonial;
  assert(editedReview.customerName === editPayload.customerName, `customerName updated: "${editedReview.customerName}"`);
  assert(editedReview.email === editPayload.email, `email updated: "${editedReview.email}"`);
  assert(editedReview.designation === editPayload.designation, `designation updated: "${editedReview.designation}"`);
  assert(editedReview.rating === editPayload.rating, `rating updated: ${editedReview.rating}`);
  assert(editedReview.feedback === editPayload.feedback, `feedback updated: "${editedReview.feedback}"`);
  assert(editedReview.isActive === true, 'isActive updated to true');

  // Confirm GET by ID reflects edits
  const getByIdRes = await getTestimonialById(reviewId);
  assert(getByIdRes.status === 200, 'GET /api/testimonials/:id returned HTTP 200');
  assert(getByIdRes.json.testimonial.customerName === editPayload.customerName, 'GET /api/testimonials/:id confirms updated customerName');
  assert(getByIdRes.json.testimonial.rating === 4, 'GET /api/testimonials/:id confirms updated rating');

  // Verify in Public endpoint (since isActive: true)
  const publicAfterEdit = await getPublicTestimonials();
  const publicEdited = publicAfterEdit.testimonials.find(t => t._id === reviewId);
  assert(Boolean(publicEdited), 'Edited review appears in public testimonials list');
  assert(publicEdited?.customerName === editPayload.customerName, 'Public review displays edited customerName');
  assert(publicEdited?.rating === 4, 'Public review displays edited rating (4)');
  assert(publicEdited?.feedback === editPayload.feedback, 'Public review displays edited feedback');

  // Clean Deletion
  console.log('\n--- Clean Deletion of Review ---');
  const deleteRes = await deleteReview(adminToken, reviewId);
  assert(deleteRes.status === 200, `DELETE /api/testimonials/:id returned HTTP 200 (got ${deleteRes.status})`);
  assert(deleteRes.json.success === true, 'DELETE returned success: true');

  // Verify GET by ID returns 404
  const getAfterDelete = await getTestimonialById(reviewId);
  assert(getAfterDelete.status === 404, `GET deleted review returns HTTP 404 (got ${getAfterDelete.status})`);

  // Verify public endpoint does not have deleted review
  const publicAfterDelete = await getPublicTestimonials();
  assert(publicAfterDelete.count === baselinePublic.count, `Public count restored to baseline (${publicAfterDelete.count} == ${baselinePublic.count})`);
  const foundDeletedInPublic = publicAfterDelete.testimonials.find(t => t._id === reviewId);
  assert(!foundDeletedInPublic, 'Deleted review is strictly absent from public API');

  // Verify admin list does not have deleted review
  const adminAfterDelete = await getAdminTestimonials(adminToken);
  assert(adminAfterDelete.count === baselineAdmin.count, `Admin count restored to baseline (${adminAfterDelete.count} == ${baselineAdmin.count})`);
  const foundDeletedInAdmin = adminAfterDelete.testimonials.find(t => t._id === reviewId);
  assert(!foundDeletedInAdmin, 'Deleted review is strictly absent from admin API');

  // Remove from test tracking since deleted
  const idx = testRecordsCreated.indexOf(reviewId);
  if (idx !== -1) testRecordsCreated.splice(idx, 1);

  // -------------------------------------------------------------
  // Phase 6: Adversarial Edge Cases & Stress Testing
  // -------------------------------------------------------------
  console.log('\n--- Phase 6: Adversarial Edge Cases & Stress Testing ---');

  // 1. Invalid Rating Rejection
  const invalidRating0 = await createReview(adminToken, {
    customerName: 'Test Invalid Rating 0',
    feedback: 'Testing rating zero rejection',
    rating: 0
  });
  assert(invalidRating0.status === 400, `Rating 0 rejected with HTTP 400 (got ${invalidRating0.status})`);

  const invalidRating6 = await createReview(adminToken, {
    customerName: 'Test Invalid Rating 6',
    feedback: 'Testing rating six rejection',
    rating: 6
  });
  assert(invalidRating6.status === 400, `Rating 6 rejected with HTTP 400 (got ${invalidRating6.status})`);

  // 2. Short Feedback Rejection
  const shortFeedback = await createReview(adminToken, {
    customerName: 'Test Short Feedback',
    feedback: 'Tiny', // < 6 chars
    rating: 5
  });
  assert(shortFeedback.status === 400, `Feedback < 6 chars rejected with HTTP 400 (got ${shortFeedback.status})`);

  // 3. Missing Customer Name Rejection
  const missingName = await createReview(adminToken, {
    customerName: '   ',
    feedback: 'Valid feedback message here',
    rating: 5
  });
  assert(missingName.status === 400, `Missing customer name rejected with HTTP 400 (got ${missingName.status})`);

  // 4. Invalid Email Rejection
  const invalidEmail = await createReview(adminToken, {
    customerName: 'Test Invalid Email',
    feedback: 'Valid feedback with invalid email address',
    email: 'not-an-email',
    rating: 5
  });
  assert(invalidEmail.status === 400, `Malformed email rejected with HTTP 400 (got ${invalidEmail.status})`);

  // 5. Non-existent ID handling
  const fakeId = '507f1f77bcf86cd799439011';
  const getFake = await getTestimonialById(fakeId);
  assert(getFake.status === 404, `GET non-existent ID returns 404 (got ${getFake.status})`);

  const putFake = await updateReview(adminToken, fakeId, { rating: 3 });
  assert(putFake.status === 404, `PUT non-existent ID returns 404 (got ${putFake.status})`);

  const delFake = await deleteReview(adminToken, fakeId);
  assert(delFake.status === 404, `DELETE non-existent ID returns 404 (got ${delFake.status})`);

  // 6. Split-State Isolation Verification (Adversarial matrix)
  console.log('\n--- Split-State Privacy Isolation Matrix ---');
  // State A: isActive: true, showOnHomepage: false -> must be HIDDEN publicly
  const splitA = await createReview(adminToken, {
    customerName: 'Split State A',
    feedback: 'isActive true but showOnHomepage false',
    rating: 5,
    isActive: true,
    showOnHomepage: false
  });
  assert(splitA.status === 201, 'Created split state A');
  const pubSplitA = await getPublicTestimonials();
  assert(!pubSplitA.testimonials.some(t => t._id === splitA.json.testimonial._id), 'CRITICAL: isActive:true + showOnHomepage:false is HIDDEN publicly');

  // State B: isActive: false, showOnHomepage: true -> must be HIDDEN publicly
  const splitB = await createReview(adminToken, {
    customerName: 'Split State B',
    feedback: 'isActive false but showOnHomepage true',
    rating: 5,
    isActive: false,
    showOnHomepage: true
  });
  assert(splitB.status === 201, 'Created split state B');
  const pubSplitB = await getPublicTestimonials();
  assert(!pubSplitB.testimonials.some(t => t._id === splitB.json.testimonial._id), 'CRITICAL: isActive:false + showOnHomepage:true is HIDDEN publicly');

  // State C: isActive: true, showOnHomepage: true, approvalStatus: 'pending' -> must be HIDDEN publicly
  const splitC = await createReview(adminToken, {
    customerName: 'Split State C',
    feedback: 'Active but pending approval',
    rating: 5,
    isActive: true,
    showOnHomepage: true,
    approvalStatus: 'pending'
  });
  assert(splitC.status === 201, 'Created split state C');
  const pubSplitC = await getPublicTestimonials();
  assert(!pubSplitC.testimonials.some(t => t._id === splitC.json.testimonial._id), 'CRITICAL: approvalStatus:pending is HIDDEN publicly');

  // State D: isActive: true, showOnHomepage: true, approvalStatus: 'rejected' -> must be HIDDEN publicly
  const splitD = await createReview(adminToken, {
    customerName: 'Split State D',
    feedback: 'Active but rejected',
    rating: 5,
    isActive: true,
    showOnHomepage: true,
    approvalStatus: 'rejected'
  });
  assert(splitD.status === 201, 'Created split state D');
  const pubSplitD = await getPublicTestimonials();
  assert(!pubSplitD.testimonials.some(t => t._id === splitD.json.testimonial._id), 'CRITICAL: approvalStatus:rejected is HIDDEN publicly');

  // 7. Cleanup Split State Test Records
  console.log('\n--- Cleaning up Split State Records ---');
  for (const id of [splitA.json.testimonial._id, splitB.json.testimonial._id, splitC.json.testimonial._id, splitD.json.testimonial._id]) {
    const dRes = await deleteReview(adminToken, id);
    assert(dRes.status === 200, `Cleaned up test record ${id}`);
    const cleanIdx = testRecordsCreated.indexOf(id);
    if (cleanIdx !== -1) testRecordsCreated.splice(cleanIdx, 1);
  }

  // -------------------------------------------------------------
  // Final Database State Verification
  // -------------------------------------------------------------
  console.log('\n--- Final Database State Verification ---');
  const finalPublic = await getPublicTestimonials();
  const finalAdmin = await getAdminTestimonials(adminToken);

  assert(finalPublic.count === baselinePublic.count, `Final public count matches baseline (${finalPublic.count} == ${baselinePublic.count})`);
  assert(finalAdmin.count === baselineAdmin.count, `Final admin count matches baseline (${finalAdmin.count} == ${baselineAdmin.count})`);
  assert(testRecordsCreated.length === 0, `Zero orphaned test records remaining (${testRecordsCreated.length} left)`);

  console.log('\n========================================================================');
  console.log(`M2 VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Unhandled verification error:', err);
  process.exit(1);
});
