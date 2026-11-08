# AVXBS E2E Test Infrastructure Specification

## 1. Overview
The AVXBS Automated E2E Test Suite is an opaque-box, requirement-driven testing system designed to verify full-stack functionality across all seven core project requirements (R1–R7) spanning public website workflows, admin panel operations, backend security, database persistence, and responsive UI behaviors.

## 2. Technology Stack & Principles
- **Browser Automation**: Direct Chrome DevTools Protocol (CDP) via headless Google Chrome (`chrome.exe`) and Microsoft Edge (`msedge.exe`) with zero third-party framework overhead, enabling deterministic DOM inspection, computed style evaluations, viewport emulation, and event dispatch.
- **API & Network Client**: Native Node.js `fetch` and `FormData` handling multipart image uploads, JWT authentication cookies/headers, REST mutations, and CORS preflight.
- **Opaque-Box Verification**: Tests validate behavior against user requirements and interface contracts defined in `ORIGINAL_REQUEST.md` and `PROJECT.md` without coupling to internal component implementations.
- **Anti-Mock Discipline**: Production database persistence is strictly asserted against MongoDB Atlas records, ObjectIDs, and timestamps; mock data or static placeholder fallbacks are rejected.

## 3. Directory Layout
```
tests/
├── helpers/
│   ├── test-env.mjs          # Configuration, viewports, URLs, timeouts, wait utilities
│   ├── test-reporter.mjs     # Assertion matchers (toBe, toEqual, toBeCloseTo, etc.), test context, ANSI runner
│   ├── cdp-browser.mjs       # Headless Chrome/Edge CDP controller (DOM query, styles, click, hover, viewports)
│   └── api-client.mjs        # Full-stack API client (auth, JWT, multipart uploads, settings, reviews CRUD)
├── e2e/
│   ├── r1-hero-slider.test.mjs           # R1: Hero Slider indicators inside banner, overlay, responsive viewports
│   ├── r2-navbar-elevation.test.mjs      # R2: Navbar Residential/Commercial button elevation, hover/active, mega-menus
│   ├── r3-dynamic-logo.test.mjs          # R3: Dynamic logo upload, MIME/size validation, persistence, API & fallback
│   ├── r4-secondary-banner.test.mjs      # R4: Secondary banner below Tap Water, ~80% height, admin upload & API
│   ├── r5-customer-voice-removal.test.mjs# R5: Public Customer Voice form DOM/nav removal, review display preservation
│   ├── r6-review-management.test.mjs     # R6: Admin review CRUD, Active/Inactive toggle, public API active filtering
│   └── r7-security-validation.test.mjs   # R7: Security checks (admin auth 401s, upload validation, anti-mock integrity)
├── run_all_e2e.mjs                       # Unified Test Runner orchestrating all suites with summary table & JSON output
└── test_results.json                     # Structured execution report generated on each test run
```

## 4. Test Suite Coverage & Verification Matrix

| Suite File | Scope | Authoritative Source | Requirements Covered | Tests Count |
|---|---|---|---|---|
| `r1-hero-slider.test.mjs` | Hero banner indicator placement, Samsung-style overlay, no white strip, responsive scaling (desktop/laptop/tablet/mobile), autoplay pause/play toggle, slide navigation | `ORIGINAL_REQUEST.md § R1`<br>`PROJECT.md § F1` | R1 | 12 |
| `r2-navbar-elevation.test.mjs` | Residential & Commercial button elevation & box-shadow removal, hover states, active underline, mega-menu trigger & contents, overall layout integrity | `ORIGINAL_REQUEST.md § R2`<br>`PROJECT.md § F2` | R2 | 7 |
| `r3-dynamic-logo.test.mjs` | Admin logo upload, unauthenticated 401, format/extension rejection, size limit validation, SiteSetting persistence (`website_logo`), public API loading & fallback | `ORIGINAL_REQUEST.md § R3`<br>`PROJECT.md § F3, F4, F5` | R3, R7 | 6 |
| `r4-secondary-banner.test.mjs` | Secondary banner placement immediately below Tap Water section, height ratio (~80% hero height), unmodified Tap Water section, SiteSetting persistence (`secondary_banner`), responsive scaling | `ORIGINAL_REQUEST.md § R4`<br>`PROJECT.md § F6, F7` | R4 | 9 |
| `r5-customer-voice-removal.test.mjs` | Complete removal of Customer Voice submission form from public DOM, removal of submission navigation entries, preservation and display of existing client reviews | `ORIGINAL_REQUEST.md § R5`<br>`PROJECT.md § F8` | R5 | 4 |
| `r6-review-management.test.mjs` | Admin review manual creation, review list retrieval, edit review, Active/Inactive status toggle, deletion, strict exclusion of Inactive reviews from public API | `ORIGINAL_REQUEST.md § R6`<br>`PROJECT.md § F9, F10` | R6 | 7 |
| `r7-security-validation.test.mjs` | Unauthenticated 401 on admin endpoints, public endpoint 200 accessibility, upload whitelist MIME validation, review input validation, anti-mock database checks, XSS resilience | `ORIGINAL_REQUEST.md § R7`<br>`PROJECT.md § F11` | R7 | 21 |

## 5. Execution Commands
```powershell
# Run the entire E2E test suite (all 7 suites, 66 test assertions)
node tests/run_all_e2e.mjs

# Run individual test suites
node tests/run_all_e2e.mjs --suite r1    # Hero Slider indicators & controls
node tests/run_all_e2e.mjs --suite r2    # Navbar button shadow & mega-menus
node tests/run_all_e2e.mjs --suite r3    # Dynamic logo management
node tests/run_all_e2e.mjs --suite r4    # Secondary banner section
node tests/run_all_e2e.mjs --suite r5    # Customer Voice form removal
node tests/run_all_e2e.mjs --suite r6    # Admin review management & filtering
node tests/run_all_e2e.mjs --suite r7    # Security & upload validation
```

## 6. Baseline Execution Results
- **Total Tests**: 66 assertions
- **Currently Passing**: 55 assertions (R2 100%, R3 100%, R6 100%, R7 100%, R4 78%, R5 75%, R1 33%)
- **Pending Implementation Gates**: 11 assertions (specifically awaiting Milestone 3 Frontend UI Transformations: moving slider indicators inside hero banner, mounting SecondaryBannerSection below Tap Water, and removing Customer Voice form from DOM).
