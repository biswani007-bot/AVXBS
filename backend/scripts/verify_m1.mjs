import fs from 'fs';
import path from 'path';
import { SignJWT } from 'jose';

// Load .env
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

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('=== MILESTONE 1 VERIFICATION SUITE ===\n');
  const token = await generateAdminToken();

  // Test 1: Unauthenticated mutations must return 401
  console.log('--- 1. Testing Unauthenticated Mutation Protection (401) ---');
  const unauthEndpoints = [
    { method: 'POST', url: '/api/uploads', body: null },
    { method: 'POST', url: '/api/testimonials', body: JSON.stringify({ customerName: 'X' }) },
    { method: 'PUT', url: '/api/testimonials/6aec3ff0650bd7c475b49c58', body: JSON.stringify({ rating: 4 }) },
    { method: 'DELETE', url: '/api/testimonials/6aec3ff0650bd7c475b49c58', body: null },
    { method: 'POST', url: '/api/settings', body: JSON.stringify({ key: 'test', value: '1' }) },
    { method: 'PUT', url: '/api/settings', body: JSON.stringify({ key: 'test', value: '1' }) },
    { method: 'PUT', url: '/api/inquiry-section', body: JSON.stringify({ isEnabled: true }) },
    { method: 'POST', url: '/api/inquiry-section', body: JSON.stringify({ isEnabled: true }) },
    { method: 'POST', url: '/api/footer-config', body: JSON.stringify({ action: 'publish' }) },
    { method: 'PUT', url: '/api/footer-config', body: JSON.stringify({ action: 'publish' }) },
    { method: 'POST', url: '/api/about-config', body: JSON.stringify({ action: 'save_all' }) },
    { method: 'PUT', url: '/api/about-config', body: JSON.stringify({ action: 'save_all' }) },
    { method: 'POST', url: '/api/contact-config', body: JSON.stringify({ action: 'save_all' }) },
    { method: 'PUT', url: '/api/contact-config', body: JSON.stringify({ action: 'save_all' }) },
  ];

  for (const ep of unauthEndpoints) {
    const res = await fetch(`${BASE_URL}${ep.url}`, {
      method: ep.method,
      headers: ep.body ? { 'Content-Type': 'application/json' } : {},
      body: ep.body,
    });
    assert(res.status === 401, `${ep.method} ${ep.url} returned HTTP ${res.status} (expected 401)`);
  }

  // Test 2: Upload API validations
  console.log('\n--- 2. Testing Upload API Server-Side Validations ---');
  // Disallowed MIME type
  const badMimeForm = new FormData();
  badMimeForm.append('file', new Blob(['hello text'], { type: 'text/plain' }), 'test.txt');
  let uploadRes = await fetch(`${BASE_URL}/api/uploads`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: badMimeForm,
  });
  let uploadData = await uploadRes.json();
  assert(uploadRes.status === 400 && uploadData.error?.includes('Invalid file type'), 
    `Rejects invalid MIME type text/plain with 400 (got ${uploadRes.status}: "${uploadData.error}")`);

  // Exceeds 5MB
  const largeBuffer = new Uint8Array(6 * 1024 * 1024); // 6MB
  const largeForm = new FormData();
  largeForm.append('file', new Blob([largeBuffer], { type: 'image/png' }), 'large.png');
  uploadRes = await fetch(`${BASE_URL}/api/uploads`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: largeForm,
  });
  uploadData = await uploadRes.json();
  assert(uploadRes.status === 400 && uploadData.error?.includes('exceeds the 5MB limit'), 
    `Rejects file >5MB with 400 (got ${uploadRes.status}: "${uploadData.error}")`);

  // Valid PNG upload
  const validBuffer = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]); // PNG magic bytes
  const validForm = new FormData();
  validForm.append('file', new Blob([validBuffer], { type: 'image/png' }), 'test_logo.png');
  validForm.append('category', 'branding');
  validForm.append('altText', 'AVXBS Brand Logo');
  uploadRes = await fetch(`${BASE_URL}/api/uploads`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: validForm,
  });
  uploadData = await uploadRes.json();
  assert(uploadRes.status === 201 && uploadData.success === true, 
    `Valid upload returns HTTP 201 success: true`);
  assert(!!uploadData.url && uploadData.url.startsWith('/uploads/'), 
    `Normalized upload response has valid url: ${uploadData.url}`);
  assert(uploadData.filePath === uploadData.url, 
    `Normalized upload response has filePath matching url`);
  assert(!!uploadData.media && uploadData.media.mimeType === 'image/png', 
    `Normalized upload response includes media record`);

  // Test 3: Settings API (website_logo & secondary_banner)
  console.log('\n--- 3. Testing Settings API (website_logo & secondary_banner) ---');
  // Upsert website_logo
  const logoValue = {
    imageUrl: uploadData.url,
    altText: 'AVXBS Water Solutions',
    updatedAt: new Date().toISOString()
  };
  const setLogoRes = await fetch(`${BASE_URL}/api/settings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      key: 'website_logo',
      group: 'branding',
      value: logoValue,
      description: 'Main Website Logo'
    })
  });
  const setLogoData = await setLogoRes.json();
  assert(setLogoRes.status === 200 && setLogoData.success === true, 'Successfully saved website_logo');

  // Upsert secondary_banner
  const bannerValue = {
    imageUrl: uploadData.url,
    altText: 'Advanced Commercial Water Solutions',
    title: 'Pure Water, Pure Excellence',
    subtitle: 'Discover next-generation filtration technology for your facility',
    linkUrl: '/contact',
    isActive: true
  };
  const setBannerRes = await fetch(`${BASE_URL}/api/settings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      key: 'secondary_banner',
      group: 'banners',
      value: bannerValue,
      description: 'Secondary Banner below tap water section'
    })
  });
  const setBannerData = await setBannerRes.json();
  assert(setBannerRes.status === 200 && setBannerData.success === true, 'Successfully saved secondary_banner');

  // Verify GET /api/settings?key=website_logo (Contract 2)
  const getLogoRes = await fetch(`${BASE_URL}/api/settings?key=website_logo`);
  const getLogoData = await getLogoRes.json();
  assert(getLogoRes.status === 200 && getLogoData.data?.key === 'website_logo', 
    `GET /api/settings?key=website_logo returns expected data key`);
  assert(getLogoData.data?.value?.imageUrl === uploadData.url, 
    `GET /api/settings?key=website_logo returns correct imageUrl`);

  // Verify GET /api/settings?group=branding (Contract 2)
  const getBrandingRes = await fetch(`${BASE_URL}/api/settings?group=branding`);
  const getBrandingData = await getBrandingRes.json();
  assert(getBrandingRes.status === 200 && (getBrandingData.data?.key === 'website_logo' || getBrandingData.settings?.website_logo), 
    `GET /api/settings?group=branding returns branding settings`);

  // Verify GET /api/settings?key=secondary_banner (Contract 3)
  const getBannerRes = await fetch(`${BASE_URL}/api/settings?key=secondary_banner`);
  const getBannerData = await getBannerRes.json();
  assert(getBannerRes.status === 200 && getBannerData.data?.key === 'secondary_banner', 
    `GET /api/settings?key=secondary_banner returns expected data key`);
  assert(getBannerData.data?.value?.title === 'Pure Water, Pure Excellence', 
    `GET /api/settings?key=secondary_banner returns correct title`);

  // Test 4: Testimonials Management & Filtering (Contract 4)
  console.log('\n--- 4. Testing Testimonials Management & Filtering ---');
  // 4a. Public GET: only active, approved, showOnHomepage reviews
  const pubRes = await fetch(`${BASE_URL}/api/testimonials`);
  const pubData = await pubRes.json();
  assert(pubRes.status === 200 && Array.isArray(pubData.testimonials), 
    `Public GET /api/testimonials returns 200 with array (${pubData.testimonials.length} reviews)`);
  const allPubValid = pubData.testimonials.every(t => 
    t.showOnHomepage === true && t.isActive !== false && t.approvalStatus === 'approved'
  );
  assert(allPubValid, `All public reviews have showOnHomepage=true, isActive!=false, approvalStatus='approved'`);

  // 4b. Admin Create Review
  const createRes = await fetch(`${BASE_URL}/api/testimonials`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      customerName: 'Verification Test User',
      email: 'verify_test@avxbs.com',
      designation: 'Facility Director',
      category: 'Commercial',
      rating: 5,
      feedback: 'Outstanding water treatment systems! Truly impressed with the installation quality.',
      isActive: true,
      showOnHomepage: true,
      approvalStatus: 'approved'
    })
  });
  const createData = await createRes.json();
  assert(createRes.status === 201 && createData.success === true, `Admin POST /api/testimonials creates review (ID: ${createData.testimonial?._id})`);
  assert(createData.testimonial?.isActive === true, `Created review has isActive: true`);
  const createdId = createData.testimonial?._id;

  // 4c. Verify created review is visible in public GET
  const pubRes2 = await fetch(`${BASE_URL}/api/testimonials`);
  const pubData2 = await pubRes2.json();
  const isFoundInPub = pubData2.testimonials.some(t => t._id === createdId);
  assert(isFoundInPub, `Newly created active review appears in public GET /api/testimonials`);

  // 4d. Toggle isActive to false via PUT /api/testimonials/:id
  const putRes = await fetch(`${BASE_URL}/api/testimonials/${createdId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      isActive: false
    })
  });
  const putData = await putRes.json();
  assert(putRes.status === 200 && putData.testimonial?.isActive === false, `Admin PUT toggles isActive to false`);

  // 4e. Verify inactive review is EXCLUDED from public GET
  const pubRes3 = await fetch(`${BASE_URL}/api/testimonials`);
  const pubData3 = await pubRes3.json();
  const isFoundInPubAfterDeactivate = pubData3.testimonials.some(t => t._id === createdId);
  assert(!isFoundInPubAfterDeactivate, `Inactive review is strictly EXCLUDED from public GET /api/testimonials`);

  // 4f. Admin query with ?all=true should still include the inactive review
  const adminListRes = await fetch(`${BASE_URL}/api/testimonials?all=true`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const adminListData = await adminListRes.json();
  const isFoundInAdminList = adminListData.testimonials?.some(t => t._id === createdId);
  assert(isFoundInAdminList, `Admin GET ?all=true retains the review with isActive: false`);
  assert(adminListData.summary?.inactive >= 1, `Admin summary reports at least 1 inactive review`);

  // 4g. Toggle isActive back to true
  const putRes2 = await fetch(`${BASE_URL}/api/testimonials/${createdId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      isActive: true
    })
  });
  const putData2 = await putRes2.json();
  assert(putRes2.status === 200 && putData2.testimonial?.isActive === true, `Admin PUT toggles isActive back to true`);

  // 4h. Delete test review
  const deleteRes = await fetch(`${BASE_URL}/api/testimonials/${createdId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  const deleteData = await deleteRes.json();
  assert(deleteRes.status === 200 && deleteData.success === true, `Admin DELETE removes test review`);

  // Verify deleted review no longer exists
  const pubRes4 = await fetch(`${BASE_URL}/api/testimonials`);
  const pubData4 = await pubRes4.json();
  const isFoundAfterDelete = pubData4.testimonials.some(t => t._id === createdId);
  assert(!isFoundAfterDelete, `Deleted review is gone from public GET`);

  console.log(`\n=== VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
