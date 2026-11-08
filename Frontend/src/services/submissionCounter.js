/**
 * Submission Counter Service
 * 
 * Manages the persistent local prototype counter for verified inquiry submissions.
 * Modular design allows seamless replacement with a real backend API endpoint later.
 */

const STORAGE_KEY = 'avxbs_inquiry_counter_v1';
const INITIAL_BASELINE = 0; // Starts at 00 if no submissions recorded

export const getSubmissionCount = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      const parsed = parseInt(stored, 10);
      return isNaN(parsed) ? INITIAL_BASELINE : parsed;
    }
  } catch (err) {
    console.warn('LocalStorage unavailable for submission counter, using memory fallback:', err);
  }
  return INITIAL_BASELINE;
};

export const incrementSubmissionCount = () => {
  try {
    const current = getSubmissionCount();
    const next = current + 1;
    localStorage.setItem(STORAGE_KEY, next.toString());
    return next;
  } catch (err) {
    console.warn('Failed to increment submission counter in localStorage:', err);
    return getSubmissionCount() + 1;
  }
};

export const formatCounterDisplay = (count) => {
  // Always pad to at least 2 digits (e.g. 00, 01, 06, 12)
  return count.toString().padStart(2, '0');
};

