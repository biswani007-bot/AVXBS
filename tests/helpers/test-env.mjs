/**
 * Test Environment Configuration and Common Utilities
 */
export const TEST_ENV = {
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3000',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@avxbs.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',
  VIEWPORTS: {
    desktop: { width: 1440, height: 900, name: 'Desktop (1440x900)' },
    laptop: { width: 1024, height: 768, name: 'Laptop (1024x768)' },
    tablet: { width: 768, height: 1024, name: 'Tablet (768x1024)' },
    mobile: { width: 375, height: 667, isMobile: true, name: 'Mobile (375x667)' },
    mobileLarge: { width: 430, height: 932, isMobile: true, name: 'Mobile Large (430x932)' },
  },
  TIMEOUTS: {
    short: 3000,
    standard: 8000,
    long: 15000,
  }
};

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitFor(conditionFn, timeoutMs = 8000, intervalMs = 200, message = 'Condition timed out') {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    try {
      const res = await conditionFn();
      if (res) return res;
    } catch (e) {
      // Continue polling
    }
    await sleep(intervalMs);
  }
  throw new Error(`${message} after ${timeoutMs}ms`);
}

export function generateTestId(prefix = 'test') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}
