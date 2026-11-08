/**
 * Empirical Adversarial Security & Upload Validation Test Harness
 * Author: challenger_m1_1 (Adversarial Security Verifier)
 */

import { ApiClient } from './helpers/api-client.mjs';
import { TEST_ENV } from './helpers/test-env.mjs';

const BACKEND_URL = TEST_ENV.BACKEND_URL;

// Color helpers
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

async function runAdversarialSecurityTests() {
  console.log(`${BOLD}${CYAN}======================================================================${RESET}`);
  console.log(`${BOLD}${CYAN}     EMPIRICAL ADVERSARIAL SECURITY & VALIDATION CHALLENGE HARNESS    ${RESET}`);
  console.log(`${BOLD}${CYAN}======================================================================${RESET}`);
  console.log(`Target Backend: ${BACKEND_URL}`);

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  const failureDetails = [];

  function recordResult(name, passed, expected, actual, extra = '') {
    totalTests++;
    if (passed) {
      passedTests++;
      console.log(`  ${GREEN}✓ PASS${RESET} ${name} (status: ${actual})`);
    } else {
      failedTests++;
      console.log(`  ${RED}✗ FAIL${RESET} ${name} (expected ${expected}, got: ${actual}) ${extra}`);
      failureDetails.push({ name, expected, actual, extra });
    }
  }

  // -------------------------------------------------------------------------
  // SECTION 1: AUTHENTICATION ENFORCEMENT ON 9 ADMIN ENDPOINTS
  // -------------------------------------------------------------------------
  console.log(`\n${BOLD}--- 1. Testing Unauthenticated Access Rejection (HTTP 401) ---${RESET}`);

  const dummyMongoId = '6aec3ff0650bd7c475b49c58';

  const authEndpoints = [
    { name: 'POST /api/uploads', method: 'POST', path: '/api/uploads', body: {} },
    { name: 'POST /api/testimonials', method: 'POST', path: '/api/testimonials', body: { customerName: 'Evil', feedback: 'Hacked', rating: 5 } },
    { name: 'PUT /api/testimonials/:id', method: 'PUT', path: `/api/testimonials/${dummyMongoId}`, body: { feedback: 'Hacked' } },
    { name: 'DELETE /api/testimonials/:id', method: 'DELETE', path: `/api/testimonials/${dummyMongoId}`, body: null },
    { name: 'POST /api/settings', method: 'POST', path: '/api/settings', body: { key: 'hacked_key', value: 'evil' } },
    { name: 'PUT /api/inquiry-section', method: 'PUT', path: '/api/inquiry-section', body: { line1Text1: 'Hacked' } },
    { name: 'POST /api/footer-config', method: 'POST', path: '/api/footer-config', body: { action: 'publish' } },
    { name: 'POST /api/about-config', method: 'POST', path: '/api/about-config', body: { action: 'save_all' } },
    { name: 'POST /api/contact-config', method: 'POST', path: '/api/contact-config', body: { action: 'save_all' } },
  ];

  // Also include symmetric methods for completeness
  const extraEndpoints = [
    { name: 'PUT /api/settings', method: 'PUT', path: '/api/settings', body: { key: 'hacked_key', value: 'evil' } },
    { name: 'POST /api/inquiry-section', method: 'POST', path: '/api/inquiry-section', body: { line1Text1: 'Hacked' } },
    { name: 'PUT /api/footer-config', method: 'PUT', path: '/api/footer-config', body: { action: 'publish' } },
    { name: 'PUT /api/about-config', method: 'PUT', path: '/api/about-config', body: { action: 'save_all' } },
    { name: 'PUT /api/contact-config', method: 'PUT', path: '/api/contact-config', body: { action: 'save_all' } },
  ];

  // 1A. No credentials at all
  for (const ep of authEndpoints) {
    const res = await fetch(`${BACKEND_URL}${ep.path}`, {
      method: ep.method,
      headers: ep.body ? { 'Content-Type': 'application/json' } : {},
      body: ep.body ? JSON.stringify(ep.body) : undefined,
    });
    recordResult(
      `[No Auth] ${ep.name} -> HTTP 401`,
      res.status === 401,
      401,
      res.status
    );
  }

  // 1B. Forged JWT in Bearer header
  console.log(`\n${BOLD}--- 1B. Testing Forged Bearer Token Attack (HTTP 401) ---${RESET}`);
  for (const ep of authEndpoints) {
    const res = await fetch(`${BACKEND_URL}${ep.path}`, {
      method: ep.method,
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.fake_signature',
        ...(ep.body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: ep.body ? JSON.stringify(ep.body) : undefined,
    });
    recordResult(
      `[Forged Bearer] ${ep.name} -> HTTP 401`,
      res.status === 401,
      401,
      res.status
    );
  }

  // 1C. Invalid Cookie Attack
  console.log(`\n${BOLD}--- 1C. Testing Invalid Cookie Attack (HTTP 401) ---${RESET}`);
  for (const ep of authEndpoints) {
    const res = await fetch(`${BACKEND_URL}${ep.path}`, {
      method: ep.method,
      headers: {
        'Cookie': 'avxbs_token=malicious_fake_token_value_xyz',
        ...(ep.body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: ep.body ? JSON.stringify(ep.body) : undefined,
    });
    recordResult(
      `[Invalid Cookie] ${ep.name} -> HTTP 401`,
      res.status === 401,
      401,
      res.status
    );
  }

  // 1D. Empty Bearer & Basic Auth Attack
  console.log(`\n${BOLD}--- 1D. Testing Malformed Header Attacks (HTTP 401) ---${RESET}`);
  for (const ep of authEndpoints.slice(0, 3)) {
    const emptyBearerRes = await fetch(`${BACKEND_URL}${ep.path}`, {
      method: ep.method,
      headers: {
        'Authorization': 'Bearer ',
        ...(ep.body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: ep.body ? JSON.stringify(ep.body) : undefined,
    });
    recordResult(
      `[Empty Bearer] ${ep.name} -> HTTP 401`,
      emptyBearerRes.status === 401,
      401,
      emptyBearerRes.status
    );

    const basicAuthRes = await fetch(`${BACKEND_URL}${ep.path}`, {
      method: ep.method,
      headers: {
        'Authorization': 'Basic YWRtaW46cGFzc3dvcmQ=',
        ...(ep.body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: ep.body ? JSON.stringify(ep.body) : undefined,
    });
    recordResult(
      `[Basic Auth] ${ep.name} -> HTTP 401`,
      basicAuthRes.status === 401,
      401,
      basicAuthRes.status
    );
  }

  // -------------------------------------------------------------------------
  // SECTION 2: FILE UPLOAD ATTACKS
  // -------------------------------------------------------------------------
  console.log(`\n${BOLD}--- 2. Testing File Upload Validation Attacks (HTTP 400) ---${RESET}`);

  // Obtain legitimate admin auth token for testing validator directly
  const adminClient = new ApiClient();
  const loginRes = await adminClient.login();
  if (!loginRes.ok) {
    console.error(`${RED}Admin login failed, cannot run authenticated upload attacks!${RESET}`);
    process.exit(1);
  }
  console.log(`${GREEN}✓ Successfully authenticated as admin for upload validation attacks.${RESET}`);

  // 2A. Disallowed MIME types
  console.log(`\n${BOLD}--- 2A. Disallowed MIME Types Attacks ---${RESET}`);
  const invalidMimes = [
    { ext: 'html', mime: 'text/html', desc: 'HTML file (XSS attack)' },
    { ext: 'exe', mime: 'application/x-msdownload', desc: 'Executable binary' },
    { ext: 'js', mime: 'application/javascript', desc: 'JavaScript source' },
    { ext: 'txt', mime: 'text/plain', desc: 'Plain text file' },
    { ext: 'php', mime: 'application/x-httpd-php', desc: 'PHP web shell' },
    { ext: 'bin', mime: 'application/octet-stream', desc: 'Raw binary stream' },
    { ext: 'pdf', mime: 'application/pdf', desc: 'PDF document' },
    { ext: 'gif', mime: 'image/gif', desc: 'GIF image (not in allowed list)' },
    { ext: 'unknown', mime: '', desc: 'Empty MIME type' },
  ];

  for (const item of invalidMimes) {
    const payload = Buffer.from('TEST_PAYLOAD_CONTENT_DATA');
    const res = await adminClient.uploadFile(payload, `exploit.${item.ext}`, item.mime, { auth: true });
    recordResult(
      `Upload rejected for MIME "${item.mime || '<empty>'}" (${item.desc}) -> HTTP 400`,
      res.status === 400,
      400,
      res.status,
      JSON.stringify(res.data)
    );
  }

  // 2B. Payload Size Attacks (> 5MB = 5 * 1024 * 1024 = 5,242,880 bytes)
  console.log(`\n${BOLD}--- 2B. Oversized File Attacks (>5MB) ---${RESET}`);

  // Test exact boundary: 5MB + 1 byte
  const FIVE_MB = 5 * 1024 * 1024;
  const boundaryOver = FIVE_MB + 1; // 5,242,881 bytes
  console.log(`Creating payload: 5MB + 1 byte (${boundaryOver} bytes)...`);
  const boundaryBuffer = Buffer.alloc(boundaryOver, 0x41); // 'A'

  const boundaryRes = await adminClient.uploadFile(boundaryBuffer, 'boundary_test.png', 'image/png', { auth: true });
  recordResult(
    `Upload rejected for 5MB+1 byte payload (${boundaryOver} bytes) -> HTTP 400`,
    boundaryRes.status === 400,
    400,
    boundaryRes.status,
    JSON.stringify(boundaryRes.data)
  );

  // Test larger oversize: 6MB (6,291,456 bytes)
  const SIX_MB = 6 * 1024 * 1024;
  console.log(`Creating payload: 6MB (${SIX_MB} bytes)...`);
  const largeBuffer = Buffer.alloc(SIX_MB, 0x42);
  const largeRes = await adminClient.uploadFile(largeBuffer, 'oversize_test.jpg', 'image/jpeg', { auth: true });
  recordResult(
    `Upload rejected for 6MB payload (${SIX_MB} bytes) -> HTTP 400`,
    largeRes.status === 400,
    400,
    largeRes.status,
    JSON.stringify(largeRes.data)
  );

  // 2C. Missing / Empty file field attack
  console.log(`\n${BOLD}--- 2C. Malformed FormData Attacks ---${RESET}`);
  // FormData without 'file' key
  const emptyForm = new FormData();
  emptyForm.append('altText', 'malicious empty upload');
  const emptyRes = await fetch(`${BACKEND_URL}/api/uploads`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminClient.token}`,
      'Cookie': `avxbs_token=${adminClient.token}`,
    },
    body: emptyForm,
  });
  recordResult(
    `Upload rejected when no file key in FormData -> HTTP 400`,
    emptyRes.status === 400,
    400,
    emptyRes.status
  );

  // 2D. Control Check: Valid upload (<5MB, valid MIME) MUST succeed with 201
  console.log(`\n${BOLD}--- 2D. Control Check: Legitimate File Upload (HTTP 201) ---${RESET}`);
  // Minimal valid 1x1 transparent PNG
  const validPngBuffer = Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
    'hex'
  );
  const validRes = await adminClient.uploadFile(validPngBuffer, 'valid_logo_test.png', 'image/png', { auth: true });
  recordResult(
    `Legitimate image upload succeeds with HTTP 201 & valid URL`,
    validRes.status === 201 && validRes.data?.url && validRes.data?.success === true,
    201,
    validRes.status,
    JSON.stringify(validRes.data)
  );

  // Summary
  console.log(`\n${BOLD}${CYAN}======================================================================${RESET}`);
  console.log(`${BOLD}SUMMARY: ${passedTests}/${totalTests} tests passed (${failedTests} failed)${RESET}`);
  if (failedTests === 0) {
    console.log(`${BOLD}${GREEN}VERDICT: ALL ADVERSARIAL CHALLENGES CONFIRMED PASS!${RESET}`);
  } else {
    console.log(`${BOLD}${RED}VERDICT: ADVERSARIAL FAILURES DETECTED!${RESET}`);
    console.log(failureDetails);
  }
  console.log(`${BOLD}${CYAN}======================================================================${RESET}`);

  return { totalTests, passedTests, failedTests, failureDetails };
}

runAdversarialSecurityTests()
  .then((res) => {
    process.exit(res.failedTests > 0 ? 1 : 0);
  })
  .catch((err) => {
    console.error('Test execution crashed:', err);
    process.exit(1);
  });
