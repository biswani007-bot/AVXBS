#!/usr/bin/env node

/**
 * Unified Automated E2E Test Suite Runner for AVXBS
 * Executes opaque-box, requirement-driven tests covering R1 through R7
 */

import fs from 'fs';
import path from 'path';
import { runR1Suite } from './e2e/r1-hero-slider.test.mjs';
import { runR2Suite } from './e2e/r2-navbar-elevation.test.mjs';
import { runR3Suite } from './e2e/r3-dynamic-logo.test.mjs';
import { runR4Suite } from './e2e/r4-secondary-banner.test.mjs';
import { runR5Suite } from './e2e/r5-customer-voice-removal.test.mjs';
import { runR6Suite } from './e2e/r6-review-management.test.mjs';
import { runR7Suite } from './e2e/r7-security-validation.test.mjs';

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  magenta: '\x1b[35m',
};

const SUITES = [
  { id: 'r1', name: 'R1: Hero Slider Indicators & Controls', runner: runR1Suite },
  { id: 'r2', name: 'R2: Navbar Residential/Commercial Shadows & Elevation', runner: runR2Suite },
  { id: 'r3', name: 'R3: Dynamic Logo Upload, Storage & Fallback', runner: runR3Suite },
  { id: 'r4', name: 'R4: Secondary Banner Below Tap Water Section', runner: runR4Suite },
  { id: 'r5', name: 'R5: Customer Voice Form Removal & Review Preservation', runner: runR5Suite },
  { id: 'r6', name: 'R6: Admin Review Management & Public Active Filtering', runner: runR6Suite },
  { id: 'r7', name: 'R7: Security Lockdown, Upload Validation & Anti-Mock Integrity', runner: runR7Suite },
];

async function main() {
  const args = process.argv.slice(2);
  const suiteFilterIndex = args.findIndex((a) => a === '--suite' || a === '-s');
  const targetSuite = suiteFilterIndex !== -1 ? args[suiteFilterIndex + 1]?.toLowerCase() : null;

  console.log(`\n${ANSI.bold}${ANSI.cyan}======================================================================${ANSI.reset}`);
  console.log(`${ANSI.bold}${ANSI.cyan}          AVXBS AUTOMATED E2E REQUIREMENT-DRIVEN TEST SUITE           ${ANSI.reset}`);
  console.log(`${ANSI.bold}${ANSI.cyan}======================================================================${ANSI.reset}`);
  console.log(`  Date: ${new Date().toISOString()}`);
  console.log(`  Node: ${process.version}`);
  console.log(`  Filter: ${targetSuite ? `Suite "${targetSuite}"` : 'All Suites (R1-R7)'}\n`);

  const activeSuites = targetSuite
    ? SUITES.filter((s) => s.id === targetSuite || s.name.toLowerCase().includes(targetSuite))
    : SUITES;

  if (activeSuites.length === 0) {
    console.error(`${ANSI.red}Error: No suites matched filter "${targetSuite}". Available: ${SUITES.map((s) => s.id).join(', ')}${ANSI.reset}`);
    process.exit(1);
  }

  const results = {
    timestamp: new Date().toISOString(),
    suites: [],
    totals: { total: 0, passed: 0, failed: 0, durationMs: 0 },
  };

  const suiteStart = Date.now();

  for (const suite of activeSuites) {
    console.log(`\n${ANSI.bold}${ANSI.magenta}▶ Running ${suite.name}${ANSI.reset}`);
    const sStart = Date.now();
    try {
      const summary = await suite.runner();
      summary.durationMs = Date.now() - sStart;
      results.suites.push(summary);
      results.totals.total += summary.total;
      results.totals.passed += summary.passed;
      results.totals.failed += summary.failed;
      await new Promise((r) => setTimeout(r, 1200));
    } catch (err) {
      const durationMs = Date.now() - sStart;
      console.error(`  ${ANSI.red}SUITE ERROR: ${err.message}${ANSI.reset}`);
      results.suites.push({
        suiteName: suite.name,
        total: 1,
        passed: 0,
        failed: 1,
        durationMs,
        tests: [{ name: suite.name, passed: false, durationMs, error: err.message, stack: err.stack }],
      });
      results.totals.total += 1;
      results.totals.failed += 1;
    }
  }

  results.totals.durationMs = Date.now() - suiteStart;

  // Print Overall Summary Table
  console.log(`\n${ANSI.bold}${ANSI.cyan}======================================================================${ANSI.reset}`);
  console.log(`${ANSI.bold}${ANSI.cyan}                          TEST SUITE SUMMARY                          ${ANSI.reset}`);
  console.log(`${ANSI.bold}${ANSI.cyan}======================================================================${ANSI.reset}`);

  for (const s of results.suites) {
    const statusColor = s.failed === 0 ? ANSI.green : ANSI.red;
    const statusIcon = s.failed === 0 ? '✓ PASS' : '✗ FAIL';
    console.log(
      `  ${statusColor}${statusIcon.padEnd(8)}${ANSI.reset} ${s.suiteName.padEnd(52)} ${String(s.passed).padStart(2)}/${String(s.total).padEnd(2)} passed (${s.durationMs}ms)`
    );
  }

  console.log(`${ANSI.cyan}----------------------------------------------------------------------${ANSI.reset}`);
  const finalColor = results.totals.failed === 0 ? ANSI.green : ANSI.red;
  console.log(
    `  ${ANSI.bold}TOTAL:    ${finalColor}${results.totals.passed} Passed, ${results.totals.failed} Failed${ANSI.reset} of ${results.totals.total} tests (${(results.totals.durationMs / 1000).toFixed(2)}s)`
  );
  console.log(`${ANSI.bold}${ANSI.cyan}======================================================================\n${ANSI.reset}`);

  // Write JSON report
  const reportPath = path.join(process.cwd(), 'tests', 'test_results.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`  Report saved to: ${reportPath}\n`);

  if (results.totals.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal runner error:', err);
  process.exit(1);
});
