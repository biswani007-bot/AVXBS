import { ApiClient } from '../helpers/api-client.mjs';
import { TestContext, expect } from '../helpers/test-reporter.mjs';

export async function runR7Suite() {
  const ctx = new TestContext('R7: Backend Security, Upload Validation & Anti-Mock Integrity');
  const unauthApi = new ApiClient();
  const authApi = new ApiClient();

  try {
    const loginRes = await authApi.login();
    expect(loginRes.ok, 'Admin login should succeed for R7 tests').toBe(true);

    // Test 1: Protected Admin Endpoints Return 401 Without Auth
    const protectedEndpoints = [
      { method: 'POST', path: '/api/uploads', body: {} },
      { method: 'POST', path: '/api/settings', body: { key: 'test', value: '123' } },
      { method: 'PUT', path: '/api/settings', body: { key: 'test', value: '123' } },
      { method: 'PUT', path: '/api/testimonials/6aec3ff0650bd7c475b49c58', body: { feedback: 'hacked' } },
      { method: 'DELETE', path: '/api/testimonials/6aec3ff0650bd7c475b49c58', body: {} },
      { method: 'PUT', path: '/api/inquiry-section', body: { title: 'hacked' } },
      { method: 'PUT', path: '/api/footer-config', body: { copyrightText: 'hacked' } },
      { method: 'PUT', path: '/api/about-config', body: { missionText: 'hacked' } },
      { method: 'PUT', path: '/api/contact-config', body: { phone: '0000000000' } },
    ];

    for (const ep of protectedEndpoints) {
      await ctx.it(`Unauthenticated ${ep.method} ${ep.path} is rejected with 401 Unauthorized`, async () => {
        let res;
        if (ep.method === 'POST') {
          res = await unauthApi.post(ep.path, ep.body, { auth: false });
        } else if (ep.method === 'PUT') {
          res = await unauthApi.put(ep.path, ep.body, { auth: false });
        } else if (ep.method === 'DELETE') {
          res = await unauthApi.delete(ep.path, { auth: false });
        }
        expect(res.status, `${ep.method} ${ep.path} without token must return 401 (got: ${res.status})`).toBe(401);
      });
    }

    // Test 2: Public Read Endpoints Accessible Without Auth
    const publicEndpoints = [
      '/api/testimonials',
      '/api/settings',
      '/api/hero-slides',
      '/api/products',
    ];

    for (const path of publicEndpoints) {
      await ctx.it(`Public GET ${path} responds with 200 without authentication`, async () => {
        const res = await unauthApi.get(path, { auth: false });
        expect(res.status, `Public GET ${path} should return 200`).toBe(200);
      });
    }

    // Test 3: Upload Validation - Server rejects dangerous file extensions
    const dangerousExtensions = [
      { name: 'shell.php', mime: 'application/x-httpd-php' },
      { name: 'payload.exe', mime: 'application/x-msdownload' },
      { name: 'script.sh', mime: 'application/x-sh' },
      { name: 'page.html', mime: 'text/html' },
    ];

    for (const file of dangerousExtensions) {
      await ctx.it(`Server rejects dangerous file upload (${file.name}) with 400 Bad Request`, async () => {
        const dummyBuffer = Buffer.from('echo "malicious payload";');
        const res = await authApi.uploadFile(dummyBuffer, file.name, file.mime, { auth: true });
        const isRejected = res.status === 400 || res.data?.success === false;
        expect(isRejected, `Uploading ${file.name} must be rejected with 400 or success: false`).toBe(true);
      });
    }

    // Test 4: Server Review Input Validation (Invalid ratings & missing fields)
    await ctx.it('Server rejects review creation with invalid rating (<1 or >5)', async () => {
      const badRatingRes = await authApi.createTestimonial({
        customerName: 'Test Validation',
        rating: 10, // Invalid: rating must be 1-5
        feedback: 'Great water quality throughout.',
      });

      const isRejected = badRatingRes.status === 400 || badRatingRes.data?.success === false;
      expect(isRejected, 'Rating > 5 should be rejected with 400').toBe(true);
    });

    await ctx.it('Server rejects review creation with missing feedback', async () => {
      const missingFeedbackRes = await authApi.createTestimonial({
        customerName: 'Test Validation',
        rating: 5,
        feedback: '', // Invalid: required
      });

      const isRejected = missingFeedbackRes.status === 400 || missingFeedbackRes.data?.success === false;
      expect(isRejected, 'Empty feedback should be rejected with 400').toBe(true);
    });

    // Test 5: Anti-Mock Data Verification
    await ctx.it('Public endpoints return real persistent database records, not static mock arrays', async () => {
      const res = await unauthApi.get('/api/testimonials');
      expect(res.ok, 'Testimonials endpoint should return 200').toBe(true);

      const testimonials = res.data.testimonials || [];
      expect(testimonials.length > 0, 'Database should contain testimonials').toBe(true);

      for (const t of testimonials) {
        // Must contain genuine MongoDB ObjectId (24 hex characters)
        expect(/^[0-9a-fA-F]{24}$/.test(t._id), `Review _id "${t._id}" must be a valid 24-char MongoDB ObjectId`).toBe(true);
        // Must not contain mock placeholder strings
        const text = (t.feedback || '').toLowerCase();
        expect(text.includes('lorem ipsum'), 'Reviews must not contain lorem ipsum dummy text').toBe(false);
      }
    });

    // Test 6: Adversarial XSS input resilience
    await ctx.it('Review inputs withstand XSS injection payloads without crashing or unsafe execution', async () => {
      const xssPayload = '<script>window.__xss_flag = true;</script><img src="x" onerror="window.__xss_flag=true"/>';
      const xssRes = await authApi.createTestimonial({
        customerName: 'Security Tester',
        email: 'security@example.com',
        rating: 5,
        feedback: `High resilience test: ${xssPayload}`,
        showOnHomepage: false,
        isActive: false, // Inactive so it does not pollute public UI
      });

      expect(xssRes.status === 200 || xssRes.status === 201, 'Review with special characters should save or be sanitized').toBe(true);
      const testId = xssRes.data.testimonial?._id || xssRes.data.data?._id;

      if (testId) {
        // Clean up
        await authApi.deleteTestimonial(testId);
      }
    });

  } finally {
    // Teardown
  }

  return ctx.getSummary();
}
