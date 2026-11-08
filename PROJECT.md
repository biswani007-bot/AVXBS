# Project: AVXBS Production Features & Enhancements

## Architecture
The AVXBS application is a full-stack system comprising:
1. **Backend**: Next.js 14.2.35 (App Router) in `backend/`.
   - Embedded Admin management portal under `backend/app/admin/`.
   - Database layer in `backend/lib/db.js` using Mongoose 8.9.5 connecting to MongoDB Atlas (`AVXBS` database with 15 collections).
   - Middleware in `backend/middleware.js` providing auth protection for `/admin/:path*` (via `avxbs_token` cookie) and CORS handling for `/api/:path*`.
   - API utils in `backend/lib/api-utils.js` providing `authenticateRequest` JWT token verification.
   - Central file uploads handler in `backend/app/api/uploads/route.js` storing to `backend/public/uploads/` and recording in `Media` collection.
   - Settings API in `backend/app/api/settings/route.js` using `SiteSetting` model for site-wide configuration.
   - Testimonials API in `backend/app/api/testimonials/` using `Testimonial` model.
2. **Frontend**: React 18.3.1 + Vite 6.4.5 in `Frontend/`.
   - Single-page application using React Router and Tailwind CSS.
   - Centralized API service layer in `Frontend/src/services/api.js`.
   - Header & Navbar in `Frontend/src/components/layout/Header.jsx` and `SamsungMegaMenu.jsx`.
   - Hero Slider in `Frontend/src/components/hero/FullPageHeroBanner.jsx`.
   - Tap Water section in `Frontend/src/components/hero/InquiryPromoBanner.jsx` (unmodified).
   - New Banner section in `Frontend/src/components/banner/SecondaryBannerSection.jsx` (~80% hero banner height).
   - Testimonials & Reviews in `Frontend/src/components/testimonials/TestimonialsSection.jsx` (Part 1 reviews preserved, Part 2 submission form removed).
   - Logo in `Frontend/src/components/layout/AVXBSLogo.jsx` (dynamic API loading with fallback).
3. **Database**: MongoDB Atlas (`cluster0.anp0ak3.mongodb.net/AVXBS`).
   - 15 active collections. Reused without destructive operations.
   - `SiteSetting` key-value model reused for dynamic logo (`key: 'website_logo'`) and secondary banner (`key: 'secondary_banner'`).
   - `Testimonial` model extended with `isActive: { type: Boolean, default: true }`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Hero Banner Slider Indicator Inside Banner | Move `.hero-progress-indicators` inside `.full-page-hero-container` at bottom-center overlaying content; semi-transparent white lines + drop shadow per Samsung style in `Frontend/docs/`; eliminate white strip; responsive across viewports; preserve autoplay, pause/play, slide navigation | M3 | R1, Survey Obs 1.1 |
| F2 | Remove Navbar Menu Button Shadows | Remove button elevation and box-shadow on `.samsung-nav-tab-btn` for Residential & Commercial; keep active indicator underline, hover states, typography, and mega-menu | M3 | R2, Survey Obs 1.2 |
| F3 | Dynamic Website Logo Backend Storage & API | Store logo in `SiteSetting` (`key: 'website_logo'`, `group: 'branding'`); GET/POST endpoints in `/api/settings` returning logo config; secure admin mutations | M1 | R3, Survey Obs 3 |
| F4 | Dynamic Website Logo Admin UI | Admin page `/admin/settings` with logo upload, client/server format validation (.svg,.png,.jpg,.jpeg,.webp), size validation (<=2MB), dual light/dark preview before saving, replacement support; sidebar nav entry | M2 | R3, Survey Obs 3 |
| F5 | Dynamic Website Logo Frontend Display with Fallback | In `AVXBSLogo.jsx`, load saved logo from API dynamically; responsive sizing & aspect ratio; graceful fallback to built-in animated logo if unconfigured | M3 | R3, Survey Obs 3 |
| F6 | New Banner Section Below Tap Water Section | Create `SecondaryBannerSection.jsx` rendered in `App.jsx` immediately after `InquiryPromoBanner`; height ~80% of hero banner height; dynamic API data; leave Tap Water section 100% unmodified | M3 | R4, Survey Obs 1.3 |
| F7 | New Banner Section Backend Storage & Admin UI | Persist banner in `SiteSetting` (`key: 'secondary_banner'`, `group: 'banners'`); admin page `/admin/banner` with upload, preview, update, persistence; sidebar nav entry; public API endpoint | M1, M2 | R4, Survey Obs 4 |
| F8 | Remove Public Customer Voice Form | Remove Part 2 submission form (`feedback-submission-section`, lines 430-557) and form state from `TestimonialsSection.jsx`; preserve Part 1 reviews display and MongoDB records | M3 | R5, Survey Obs 1.4 |
| F9 | Admin-Controlled Review Management Backend & APIs | Add `isActive: Boolean` to `Testimonial` model; filter public `GET /api/testimonials` to require `isActive: { $ne: false }` & `showOnHomepage: true`; require auth for review creation/mutations | M1 | R6, Survey Obs 2 |
| F10 | Admin-Controlled Review Management Admin UI | In `/admin/testimonials`, add "Add New Review" modal with all fields (name, type, rating, feedback, designation, email, active/inactive); explicit Active/Inactive status badges and toggle | M2 | R6, Survey Obs 5 |
| F11 | Backend Upload Validation & Auth Security Lockdown | Server-side MIME & size validation in `api/uploads`; normalize response format `{ success, url, filePath, media }`; enforce auth on `PUT /api/inquiry-section`, `PUT /api/footer-config`, and admin endpoints | M1 | R7, Survey Obs 3, 4 |
| F12 | Comprehensive E2E Testing & Final Verification | Automated opaque-box E2E test suite covering Tiers 1-4 for all public & admin workflows; Tier 5 adversarial hardening; clean builds in frontend & backend | M4 | System Policy, R1-R7 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Backend Foundation, Security, Uploads & Review APIs | F3, F7 (Backend), F9, F11 | none | DONE |
| M2 | Admin Panel Management (Logo, Banner & Reviews) | F4, F7 (Admin UI), F10 | M1 | DONE |
| M3 | Frontend UI Transformations (Hero, Navbar, Logo, Banner, Reviews) | F1, F2, F5, F6, F8 | M1, M2 | DONE |
| M4 | E2E Testing Suite & Final Integration Verification | F12 (Tiers 1-5, Builds, Audit) | M1, M2, M3 | DONE |

## Interface Contracts
### 1. File Uploads Contract (`POST /api/uploads`)
- **Headers**: `Cookie: avxbs_token=...` or `Authorization: Bearer ...`
- **Body**: `FormData` with field `file` (max 5MB; MIME: `image/jpeg`, `image/png`, `image/webp`, `image/svg+xml`)
- **Response** (HTTP 201):
  ```json
  {
    "success": true,
    "message": "File uploaded successfully",
    "url": "/uploads/<filename>",
    "filePath": "/uploads/<filename>",
    "media": {
      "_id": "...",
      "fileName": "...",
      "url": "/uploads/<filename>",
      "mimeType": "image/png",
      "fileSize": 12345
    }
  }
  ```

### 2. Website Logo Contract (`GET /api/settings?group=branding` / `GET /api/settings?key=website_logo`)
- **Response** (HTTP 200):
  ```json
  {
    "success": true,
    "data": {
      "key": "website_logo",
      "group": "branding",
      "value": {
        "imageUrl": "/uploads/logo_123456.png",
        "altText": "AVXBS Water Solutions",
        "updatedAt": "2026-11-07T00:00:00.000Z"
      }
    }
  }
  ```
- **Fallback**: If unconfigured, null, or API error -> Frontend renders built-in animated AVXBS logo.

### 3. Secondary Banner Contract (`GET /api/settings?key=secondary_banner`)
- **Response** (HTTP 200):
  ```json
  {
    "success": true,
    "data": {
      "key": "secondary_banner",
      "group": "banners",
      "value": {
        "imageUrl": "/uploads/secondary_banner_123.jpg",
        "altText": "Advanced Commercial Water Solutions",
        "title": "Pure Water, Pure Excellence",
        "subtitle": "Discover next-generation filtration technology for your facility",
        "linkUrl": "/contact",
        "isActive": true
      }
    }
  }
  ```

### 4. Testimonials Contract (`GET /api/testimonials`)
- **Public Query**: `{ isSample: { $ne: true }, showOnHomepage: true, isActive: { $ne: false }, approvalStatus: 'approved' }`
- **Response**: Array of active testimonials only. Inactive reviews (`isActive: false` or `showOnHomepage: false`) are strictly excluded.
- **Admin Mutation**: `POST /api/testimonials`, `PUT /api/testimonials/:id`, `DELETE /api/testimonials/:id` require valid admin authentication.

## Code Layout
- Backend Source Code: `D:\New folder\New folder\AVXBS\AVXBS\backend`
  - Upload API: `backend/app/api/uploads/route.js`
  - Settings API: `backend/app/api/settings/route.js`
  - Testimonials API: `backend/app/api/testimonials/route.js`, `backend/app/api/testimonials/[id]/route.js`
  - Models: `backend/models/SiteSetting.js`, `backend/models/Testimonial.js`, `backend/models/Media.js`
  - Middleware: `backend/middleware.js`
  - Auth Utils: `backend/lib/api-utils.js`
  - Admin Pages: `backend/app/admin/layout.js`, `backend/app/admin/testimonials/page.js`, `backend/app/admin/settings/page.js`, `backend/app/admin/banner/page.js`
- Frontend Source Code: `D:\New folder\New folder\AVXBS\AVXBS\Frontend`
  - App Root: `Frontend/src/App.jsx`
  - Global CSS: `Frontend/src/index.css`
  - Hero Slider: `Frontend/src/components/hero/FullPageHeroBanner.jsx`
  - Header: `Frontend/src/components/layout/Header.jsx`, `Frontend/src/components/layout/AVXBSLogo.jsx`
  - Tap Water Section (Unmodified): `Frontend/src/components/hero/InquiryPromoBanner.jsx`
  - Secondary Banner: `Frontend/src/components/banner/SecondaryBannerSection.jsx`
  - Testimonials: `Frontend/src/components/testimonials/TestimonialsSection.jsx`
  - API Service: `Frontend/src/services/api.js`
- Metadata: `D:\New folder\New folder\AVXBS\AVXBS\.agents\teamwork/`
