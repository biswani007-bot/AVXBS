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
const VALID_JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'avxbs_ultra_secure_jwt_token_secret_key_2026_x89!'
);
const FORGED_JWT_SECRET = new TextEncoder().encode('fake_secret_key_that_should_fail!');

async function generateToken(secret, expiresIn = '2h') {
  return new SignJWT({ id: 'admin123', role: 'admin', email: 'admin@avxbs.com' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
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

async function runAdversarialTests() {
  console.log('=== MILESTONE 1 ADVERSARIAL STRESS TEST SUITE ===\n');

  const validToken = await generateToken(VALID_JWT_SECRET, '2h');
  const forgedToken = await generateToken(FORGED_JWT_SECRET, '2h');
  const expiredToken = await generateToken(VALID_JWT_SECRET, '-10s'); // already expired

  // -------------------------------------------------------------
  // Category 1: Adversarial Authentication Stress Testing
  // -------------------------------------------------------------
  console.log('--- 1. Adversarial Auth Attacks ---');

  // Attack 1.1: Forged token signature
  let res = await fetch(`${BASE_URL}/api/uploads`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${forgedToken}` },
  });
  assert(res.status === 401, `Forged token rejected with 401 on /api/uploads (got ${res.status})`);

  // Attack 1.2: Expired token
  res = await fetch(`${BASE_URL}/api/testimonials`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${expiredToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerName: 'Hacker' }),
  });
  assert(res.status === 401, `Expired token rejected with 401 on /api/testimonials (got ${res.status})`);

  // Attack 1.3: Garbage / malformed Bearer token
  res = await fetch(`${BASE_URL}/api/settings`, {
    method: 'POST',
    headers: { Authorization: 'Bearer totally-invalid-jwt-payload-gibberish', 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: 'hack', value: 'bad' }),
  });
  assert(res.status === 401, `Garbage Bearer token rejected with 401 on /api/settings (got ${res.status})`);

  // Attack 1.4: Malformed Cookie
  res = await fetch(`${BASE_URL}/api/inquiry-section`, {
    method: 'PUT',
    headers: { Cookie: 'avxbs_token=malformed.cookie.token', 'Content-Type': 'application/json' },
    body: JSON.stringify({ isEnabled: false }),
  });
  assert(res.status === 401, `Malformed cookie token rejected with 401 on /api/inquiry-section (got ${res.status})`);

  // Attack 1.5: Valid cookie authentication works
  res = await fetch(`${BASE_URL}/api/testimonials?all=true`, {
    headers: { Cookie: `avxbs_token=${validToken}` },
  });
  assert(res.status === 200, `Valid cookie authentication accepted with 200 on /api/testimonials?all=true`);

  // -------------------------------------------------------------
  // Category 2: Adversarial Upload Stress Testing
  // -------------------------------------------------------------
  console.log('\n--- 2. Adversarial Upload Attacks & Boundary Conditions ---');

  // Attack 2.1: Missing file in multipart body
  const emptyForm = new FormData();
  emptyForm.append('altText', 'No file here');
  res = await fetch(`${BASE_URL}/api/uploads`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${validToken}` },
    body: emptyForm,
  });
  let data = await res.json();
  assert(res.status === 400 && data.error?.includes('No valid file'), 
    `Missing file rejected with 400 (got ${res.status}: "${data.error}")`);

  // Attack 2.2: Disallowed executable MIME types (.exe / .sh / .php)
  const phpForm = new FormData();
  phpForm.append('file', new Blob(['<?php phpinfo(); ?>'], { type: 'application/x-php' }), 'shell.php');
  res = await fetch(`${BASE_URL}/api/uploads`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${validToken}` },
    body: phpForm,
  });
  data = await res.json();
  assert(res.status === 400 && data.error?.includes('Invalid file type'), 
    `PHP MIME type rejected with 400 (got ${res.status}: "${data.error}")`);

  // Attack 2.3: HTML/SVG XSS MIME spoofing
  const htmlForm = new FormData();
  htmlForm.append('file', new Blob(['<script>alert(1)</script>'], { type: 'text/html' }), 'exploit.html');
  res = await fetch(`${BASE_URL}/api/uploads`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${validToken}` },
    body: htmlForm,
  });
  data = await res.json();
  assert(res.status === 400 && data.error?.includes('Invalid file type'), 
    `HTML file rejected with 400 (got ${res.status}: "${data.error}")`);

  // Attack 2.4: Path traversal in filename with valid MIME
  const traversalForm = new FormData();
  const safeImgBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  traversalForm.append('file', new Blob([safeImgBytes], { type: 'image/png' }), '../../../../etc/evil.php');
  res = await fetch(`${BASE_URL}/api/uploads`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${validToken}` },
    body: traversalForm,
  });
  data = await res.json();
  assert(res.status === 201 && data.success === true, `Valid PNG uploaded successfully`);
  // Critical check: Filename must NOT contain ../ or .php and must be safely nested inside /uploads/
  const fileName = data.url.replace(/^\/uploads\//, '');
  assert(!fileName.includes('/') && !fileName.includes('..') && data.url.startsWith('/uploads/'), 
    `Stored url is strictly sanitized without directory traversal: ${data.url}`);
  assert(data.url.endsWith('.png'), `Stored extension forced to safe .png (prevented .php execution): ${data.url}`);

  // Clean up created file if on disk
  if (data.url) {
    const uploadedLocalPath = path.join(process.cwd(), 'backend', 'public', data.url.replace(/^\//, ''));
    if (fs.existsSync(uploadedLocalPath)) {
      fs.unlinkSync(uploadedLocalPath);
    }
  }

  // Attack 2.5: File size boundary: 5MB + 1 byte
  const overSizeBuffer = new Uint8Array(5 * 1024 * 1024 + 1);
  const overSizeForm = new FormData();
  overSizeForm.append('file', new Blob([overSizeBuffer], { type: 'image/jpeg' }), 'boundary.jpg');
  res = await fetch(`${BASE_URL}/api/uploads`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${validToken}` },
    body: overSizeForm,
  });
  data = await res.json();
  assert(res.status === 400 && data.error?.includes('exceeds the 5MB limit'), 
    `File of 5MB + 1 byte strictly rejected with 400 (got ${res.status}: "${data.error}")`);

  // -------------------------------------------------------------
  // Category 3: Testimonials Validation & Input Sanitization
  // -------------------------------------------------------------
  console.log('\n--- 3. Testimonials Input Validation & Edge Cases ---');

  // Case 3.1: Empty body
  res = await fetch(`${BASE_URL}/api/testimonials`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${validToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  data = await res.json();
  assert(res.status === 400 && data.error?.includes('Customer name is required'), 
    `Empty body rejected with 400 (got "${data.error}")`);

  // Case 3.2: Whitespace customerName
  res = await fetch(`${BASE_URL}/api/testimonials`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${validToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerName: '   ', feedback: 'Great service indeed' }),
  });
  data = await res.json();
  assert(res.status === 400 && data.error?.includes('Customer name is required'), 
    `Whitespace customerName rejected with 400 (got "${data.error}")`);

  // Case 3.3: Feedback too short (<6 characters)
  res = await fetch(`${BASE_URL}/api/testimonials`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${validToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerName: 'John', feedback: 'Short' }),
  });
  data = await res.json();
  assert(res.status === 400 && data.error?.includes('at least 6 characters'), 
    `Short feedback rejected with 400 (got "${data.error}")`);

  // Case 3.4: Invalid rating (rating 0, 6, "abc")
  res = await fetch(`${BASE_URL}/api/testimonials`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${validToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerName: 'John', feedback: 'Great service indeed', rating: 6 }),
  });
  data = await res.json();
  assert(res.status === 400 && data.error?.includes('between 1 and 5'), 
    `Rating > 5 rejected with 400 (got "${data.error}")`);

  res = await fetch(`${BASE_URL}/api/testimonials`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${validToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerName: 'John', feedback: 'Great service indeed', rating: 0 }),
  });
  data = await res.json();
  assert(res.status === 400 && data.error?.includes('between 1 and 5'), 
    `Rating < 1 rejected with 400 (got "${data.error}")`);

  // Case 3.5: Invalid email format
  res = await fetch(`${BASE_URL}/api/testimonials`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${validToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerName: 'John', feedback: 'Great service indeed', rating: 5, email: 'invalid_email_no_at' }),
  });
  data = await res.json();
  assert(res.status === 400 && data.error?.includes('valid email address'), 
    `Invalid email format rejected with 400 (got "${data.error}")`);

  // Case 3.6: Non-existent ID update
  res = await fetch(`${BASE_URL}/api/testimonials/660000000000000000000000`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${validToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive: false }),
  });
  data = await res.json();
  assert(res.status === 404 && data.error?.includes('not found'), 
    `Non-existent testimonial update returns 404 (got ${res.status}: "${data.error}")`);

  // -------------------------------------------------------------
  // Category 4: Settings API Edge Cases
  // -------------------------------------------------------------
  console.log('\n--- 4. Settings API Edge Cases ---');

  // Case 4.1: Missing key on POST
  res = await fetch(`${BASE_URL}/api/settings`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${validToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ value: 'val without key' }),
  });
  data = await res.json();
  assert(res.status === 400 && data.error?.includes('Setting key is required'), 
    `Missing setting key rejected with 400 (got "${data.error}")`);

  // Case 4.2: Querying non-existent key returns null data gracefully
  res = await fetch(`${BASE_URL}/api/settings?key=completely_non_existent_key_99999`);
  data = await res.json();
  assert(res.status === 200 && data.success === true && data.data === null, 
    `Non-existent key query returns 200 with data: null`);

  // -------------------------------------------------------------
  // Category 5: Public Route Integrity & Safe Read Access
  // -------------------------------------------------------------
  console.log('\n--- 5. Public Route Read Access Integrity ---');

  const publicRoutes = [
    '/api/inquiry-section',
    '/api/footer-config',
    '/api/about-config',
    '/api/contact-config',
    '/api/settings?key=website_logo',
    '/api/settings?key=secondary_banner',
    '/api/testimonials',
  ];

  for (const route of publicRoutes) {
    res = await fetch(`${BASE_URL}${route}`);
    data = await res.json();
    assert(res.status === 200 && data.success === true, 
      `Public GET ${route} is fully accessible (HTTP 200, success: true)`);
  }

  // -------------------------------------------------------------
  // Category 6: Review Status Filtering Adversarial Checks
  // -------------------------------------------------------------
  console.log('\n--- 6. Review Status Filtering Adversarial Checks ---');

  // Create an unapproved review directly (via admin API)
  res = await fetch(`${BASE_URL}/api/testimonials`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${validToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: 'Adversarial Pending User',
      feedback: 'This review should remain unapproved and hidden!',
      rating: 5,
      approvalStatus: 'pending',
      showOnHomepage: true,
      isActive: true,
    }),
  });
  const unapprovedData = await res.json();
  const unapprovedId = unapprovedData.testimonial?._id;
  assert(res.status === 201 && !!unapprovedId, `Created pending test review`);

  // Verify it does NOT appear in public GET /api/testimonials
  res = await fetch(`${BASE_URL}/api/testimonials`);
  data = await res.json();
  const foundPending = data.testimonials.some(t => t._id === unapprovedId);
  assert(!foundPending, `Pending review is strictly EXCLUDED from public GET /api/testimonials`);

  // Clean up test review
  await fetch(`${BASE_URL}/api/testimonials/${unapprovedId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${validToken}` },
  });

  console.log(`\n=== ADVERSARIAL STRESS TEST COMPLETE: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) process.exit(1);
}

runAdversarialTests().catch(err => {
  console.error('Fatal adversarial test error:', err);
  process.exit(1);
});
