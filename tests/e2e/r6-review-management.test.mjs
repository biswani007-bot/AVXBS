import { ApiClient } from '../helpers/api-client.mjs';
import { TestContext, expect } from '../helpers/test-reporter.mjs';
import { generateTestId } from '../helpers/test-env.mjs';

export async function runR6Suite() {
  const ctx = new TestContext('R6: Admin-Controlled Review Management & Active Filtering');
  const api = new ApiClient();

  let createdReviewId = null;
  const uniqueName = `Customer_${generateTestId()}`;
  const testFeedback = 'Exceptional whole house filtration system. Zero scale buildup on bathroom fixtures.';

  try {
    const loginRes = await api.login();
    expect(loginRes.ok, 'Admin login should succeed for R6 tests').toBe(true);

    // Test 1: Admin manually creates a new review with full fields
    await ctx.it('Admin can manually add a new review with all required fields', async () => {
      const newReviewPayload = {
        customerName: uniqueName,
        email: `${uniqueName.toLowerCase()}@example.com`,
        designation: 'Villa Owner',
        category: 'Residential',
        rating: 5,
        feedback: testFeedback,
        showOnHomepage: true,
        isActive: true,
      };

      const createRes = await api.createTestimonial(newReviewPayload);
      expect(createRes.status === 200 || createRes.status === 201, 'Creating testimonial should return 200 or 201').toBe(true);
      expect(createRes.data.success, 'Create response should indicate success: true').toBe(true);

      const review = createRes.data.testimonial || createRes.data.data;
      expect(Boolean(review && review._id), 'Created review should have a valid _id').toBe(true);
      createdReviewId = review._id;
    });

    // Test 2: Admin list retrieval (?all=true) returns the created review
    await ctx.it('Admin review list (?all=true) includes newly added review', async () => {
      const listRes = await api.getTestimonials({ all: true });
      expect(listRes.ok, 'Admin testimonials list should return 200').toBe(true);

      const found = listRes.data.testimonials?.find((t) => t._id === createdReviewId || t.customerName === uniqueName);
      expect(Boolean(found), 'Created review must be present in admin list').toBe(true);
    });

    // Test 3: Public API returns the newly created Active review
    await ctx.it('Public API (GET /api/testimonials) returns the active review', async () => {
      const pubRes = await api.getTestimonials();
      expect(pubRes.ok, 'Public GET /api/testimonials should return 200').toBe(true);

      const found = pubRes.data.testimonials?.find((t) => t._id === createdReviewId || t.customerName === uniqueName);
      expect(Boolean(found), 'Active review must appear in public API response').toBe(true);
    });

    // Test 4: Toggle review to Inactive (isActive: false)
    await ctx.it('Admin can toggle review status to Inactive (isActive: false)', async () => {
      expect(Boolean(createdReviewId), 'Review ID must exist from previous step').toBe(true);

      const updateRes = await api.updateTestimonial(createdReviewId, {
        isActive: false,
      });

      expect(updateRes.ok, 'Updating review status to Inactive should return 200').toBe(true);
      expect(updateRes.data.success, 'Update response success should be true').toBe(true);
    });

    // Test 5: Public API strictly excludes Inactive reviews
    await ctx.it('Public API strictly excludes reviews with isActive: false', async () => {
      const pubRes = await api.getTestimonials();
      expect(pubRes.ok, 'Public GET /api/testimonials should return 200').toBe(true);

      // Verify the deactivated review is NOT present
      const found = pubRes.data.testimonials?.find((t) => t._id === createdReviewId || t.customerName === uniqueName);
      expect(Boolean(found), 'Inactive review must NOT appear in public API response').toBe(false);

      // Verify ALL returned public testimonials are active
      for (const t of pubRes.data.testimonials) {
        expect(t.isActive !== false, `Public review "${t.customerName}" must not have isActive: false`).toBe(true);
        expect(t.showOnHomepage === true, `Public review "${t.customerName}" must have showOnHomepage: true`).toBe(true);
      }
    });

    // Test 6: Toggle review back to Active (isActive: true) and edit content
    await ctx.it('Admin can edit review content and toggle status back to Active', async () => {
      const updatedFeedback = 'Updated feedback: 6 months of crystal-clear soft water and zero maintenance issues.';
      const editRes = await api.updateTestimonial(createdReviewId, {
        feedback: updatedFeedback,
        isActive: true,
        showOnHomepage: true,
      });

      expect(editRes.ok, 'Editing review should return 200').toBe(true);

      // Verify public API now includes the updated review
      const pubRes = await api.getTestimonials();
      const found = pubRes.data.testimonials?.find((t) => t._id === createdReviewId);
      expect(Boolean(found), 'Re-activated review must appear in public API').toBe(true);
      expect(found.feedback, 'Feedback content should reflect edits').toBe(updatedFeedback);
    });

    // Test 7: Admin deletes review
    await ctx.it('Admin can delete a review', async () => {
      const deleteRes = await api.deleteTestimonial(createdReviewId);
      expect(deleteRes.ok, 'DELETE /api/testimonials/:id should return 200').toBe(true);

      // Verify review no longer appears in public API
      const pubRes = await api.getTestimonials();
      const found = pubRes.data.testimonials?.find((t) => t._id === createdReviewId);
      expect(Boolean(found), 'Deleted review must not appear in public API').toBe(false);
      createdReviewId = null;
    });

  } finally {
    // Cleanup if test aborted before delete
    if (createdReviewId) {
      try {
        await api.deleteTestimonial(createdReviewId);
      } catch {}
    }
  }

  return ctx.getSummary();
}
