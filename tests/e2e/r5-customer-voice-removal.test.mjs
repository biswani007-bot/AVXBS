import { CDPBrowser } from '../helpers/cdp-browser.mjs';
import { ApiClient } from '../helpers/api-client.mjs';
import { TestContext, expect } from '../helpers/test-reporter.mjs';
import { TEST_ENV, sleep, waitFor } from '../helpers/test-env.mjs';

export async function runR5Suite() {
  const ctx = new TestContext('R5: Public Customer Voice Form Removal');
  const api = new ApiClient();
  const browser = new CDPBrowser();

  try {
    // 1. Verify existing reviews exist in database
    await ctx.it('Existing customer reviews in database are preserved and intact', async () => {
      const res = await api.getTestimonials();
      expect(res.ok, 'Public testimonials endpoint should return 200').toBe(true);
      expect(res.data.success, 'Testimonials response success should be true').toBe(true);
      expect(Array.isArray(res.data.testimonials), 'Testimonials should be an array').toBe(true);
      expect(res.data.testimonials.length > 0, 'Database should contain existing reviews').toBe(true);
    });

    // 2. Browser DOM inspection for complete removal of submission form
    await browser.launch(TEST_ENV.FRONTEND_URL);
    await browser.navigate(TEST_ENV.FRONTEND_URL, 1500);
    await waitFor(async () => {
      const el = await browser.querySelector('.testimonials-master-section, .testimonials-container, .testimonials-section');
      return Boolean(el);
    }, 12000, 250, 'Testimonials section hydration');

    await ctx.it('Public Customer Voice submission form is completely removed from DOM', async () => {
      const formAudit = await browser.evaluate(`
        (() => {
          const submissionSection = document.querySelector('.feedback-submission-section');
          const submissionForm = document.querySelector('.feedback-form, form.feedback-submission-form');
          const customerNameInput = document.querySelector('input[name="customerName"], #customerName');
          const feedbackTextarea = document.querySelector('textarea[name="feedback"], #feedback');
          const submitReviewBtn = document.querySelector('.feedback-submit-btn, button[type="submit"]');

          const allHeadings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => h.textContent.trim());
          const hasShareExperienceHeader = allHeadings.some(h => h.includes('Share Your Experience'));

          return {
            hasSubmissionSection: Boolean(submissionSection),
            hasSubmissionForm: Boolean(submissionForm),
            hasCustomerNameInput: Boolean(customerNameInput),
            hasFeedbackTextarea: Boolean(feedbackTextarea),
            hasSubmitReviewBtn: Boolean(submitReviewBtn),
            hasShareExperienceHeader
          };
        })()
      `);

      expect(formAudit.hasSubmissionSection, 'Customer Voice submission section (.feedback-submission-section) must be removed').toBe(false);
      expect(formAudit.hasSubmissionForm, 'Customer Voice form must be removed from DOM').toBe(false);
      expect(formAudit.hasCustomerNameInput, 'Customer name input should not exist in public DOM').toBe(false);
      expect(formAudit.hasFeedbackTextarea, 'Feedback textarea should not exist in public DOM').toBe(false);
      expect(formAudit.hasShareExperienceHeader, '"Share Your Experience" form heading must be removed').toBe(false);
    });

    // 3. Navigation entry check
    await ctx.it('No navigation links or buttons point to Customer Voice review submission form', async () => {
      const navCheck = await browser.evaluate(`
        (() => {
          const links = Array.from(document.querySelectorAll('a, button'));
          const subLinks = links.filter(l => {
            const href = (l.getAttribute('href') || '').toLowerCase();
            const text = (l.textContent || '').toLowerCase();
            return href.includes('customer-voice') || href.includes('share-experience') ||
                   (text.includes('share your experience') && !text.includes('read'));
          });
          return subLinks.length;
        })()
      `);

      expect(navCheck, 'No nav links should point to customer review submission form').toBe(0);
    });

    // 4. Testimonials section review display is preserved and rendered
    await ctx.it('Reviews display section (Testimonials) remains functional and renders existing reviews', async () => {
      const displayAudit = await browser.evaluate(`
        (() => {
          const section = document.querySelector('.testimonials-master-section, .testimonials-container, .testimonials-section');
          if (!section) return { exists: false };

          const text = section.innerText || '';
          const hasReviews = text.includes('Reviews') || text.includes('Testimonials') || text.includes('Client');

          return {
            exists: true,
            hasReviews,
            textLength: text.length
          };
        })()
      `);

      expect(displayAudit.exists, 'Testimonials display section (.testimonials-master-section) must exist in DOM').toBe(true);
      expect(displayAudit.hasReviews, 'Testimonials section must display reviews/client testimonials').toBe(true);
    });

  } finally {
    await browser.close();
  }

  return ctx.getSummary();
}
