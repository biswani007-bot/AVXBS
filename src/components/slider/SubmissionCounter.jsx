import React from 'react';
import { formatCounterDisplay } from '../../services/submissionCounter';

/**
 * SubmissionCounter Component
 * Displays the verified inquiry submission counter on the slider card.
 * Formats count with 2-digit padding (e.g. 00, 01, 06).
 */
export default function SubmissionCounter({ count }) {
  return (
    <div className="counter-box" aria-label={`Recorded Inquiries: ${count}`}>
      <span className="counter-label">CURRENT USER ACCESS</span>
      <span className="counter-number">{formatCounterDisplay(count)}</span>
    </div>
  );
}

