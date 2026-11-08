/**
 * AVXBS Frontend API Service Layer
 * Centralized API and media resolution configuration for development and production.
 * Includes controlled retry, in-flight request deduplication, protocol security,
 * and resilient error handling.
 */

// Centralized API base URL sanitized against trailing slashes
const rawApiUrl =
  import.meta.env.VITE_API_URL || 'https://avxadmin.visital.in/api';

// Route through Vite proxy in localhost development to prevent CORS origin blocking while querying live production backend
const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

let computedApiBase = rawApiUrl.replace(/\/+$/, '');
if (isLocalhost) {
  if (
    !rawApiUrl ||
    rawApiUrl.includes('localhost') ||
    rawApiUrl.includes('127.0.0.1') ||
    rawApiUrl.includes('avxadmin.visital.in') ||
    rawApiUrl.startsWith('/api')
  ) {
    computedApiBase = '/api';
  }
}

// Ensure HTTPS is used for live remote API when frontend is served over HTTPS to avoid Mixed Content
if (
  typeof window !== 'undefined' &&
  window.location.protocol === 'https:' &&
  computedApiBase.startsWith('http://') &&
  !computedApiBase.includes('localhost') &&
  !computedApiBase.includes('127.0.0.1')
) {
  computedApiBase = computedApiBase.replace(/^http:\/\//i, 'https://');
}

export const API_BASE = computedApiBase;

// Centralized Backend origin (without /api suffix) for resolving media and uploads
const rawBackendUrl =
  import.meta.env.VITE_BACKEND_URL ||
  (isLocalhost ? '' : API_BASE.replace(/\/api$/, ''));

let computedBackendBase = isLocalhost ? '' : rawBackendUrl.replace(/\/+$/, '');
if (
  typeof window !== 'undefined' &&
  window.location.protocol === 'https:' &&
  computedBackendBase.startsWith('http://') &&
  !computedBackendBase.includes('localhost') &&
  !computedBackendBase.includes('127.0.0.1')
) {
  computedBackendBase = computedBackendBase.replace(/^http:\/\//i, 'https://');
}

export const BACKEND_BASE = computedBackendBase;

/**
 * Universal media and asset URL resolver
 * - Preserves local frontend assets (/images/..., /assets/..., /videos/...)
 * - Resolves dynamic backend uploads (/uploads/...) against BACKEND_BASE
 * - Automatically upgrades insecure HTTP URLs to HTTPS on HTTPS pages to prevent Mixed-Content errors
 * - Provides graceful fallbacks when URL is missing
 */
export function resolveMediaUrl(url, fallbackUrl = '') {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return fallbackUrl;
  }

  const cleanUrl = url.trim();

  // Handle data URIs or blob URLs
  if (cleanUrl.startsWith('data:') || cleanUrl.startsWith('blob:')) {
    return cleanUrl;
  }

  // Handle absolute URLs
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    // If it's pointing to localhost:3000 or 127.0.0.1:3000 for /images/ or /assets/, point to local asset
    if (
      cleanUrl.includes('localhost:3000/images/') ||
      cleanUrl.includes('localhost:3000/assets/') ||
      cleanUrl.includes('127.0.0.1:3000/images/') ||
      cleanUrl.includes('127.0.0.1:3000/assets/')
    ) {
      return cleanUrl.replace(/^https?:\/\/(localhost|127\.0\.0\.1):3000/i, '');
    }
    // If it's pointing to localhost:3000 or 127.0.0.1:3000 for /uploads/
    if (
      cleanUrl.includes('localhost:3000/uploads/') ||
      cleanUrl.includes('127.0.0.1:3000/uploads/')
    ) {
      const uploadPath = cleanUrl.replace(/^https?:\/\/(localhost|127\.0\.0\.1):3000/i, '');
      return `${BACKEND_BASE}${uploadPath}`;
    }
    // Prevent Mixed-Content when frontend is loaded over HTTPS
    if (
      typeof window !== 'undefined' &&
      window.location.protocol === 'https:' &&
      cleanUrl.startsWith('http://') &&
      !cleanUrl.includes('localhost') &&
      !cleanUrl.includes('127.0.0.1')
    ) {
      return cleanUrl.replace(/^http:\/\//i, 'https://');
    }
    return cleanUrl;
  }

  // Local frontend assets in public directory (e.g. /images/..., /assets/..., /videos/...)
  // These MUST load directly from the local frontend server, never from the backend!
  if (
    cleanUrl.startsWith('/images/') ||
    cleanUrl.startsWith('images/') ||
    cleanUrl.startsWith('/assets/') ||
    cleanUrl.startsWith('assets/') ||
    cleanUrl.startsWith('/videos/') ||
    cleanUrl.startsWith('videos/')
  ) {
    return cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
  }

  // Backend dynamic uploads (e.g. /uploads/... or uploads/...)
  if (cleanUrl.startsWith('/uploads/') || cleanUrl.startsWith('uploads/')) {
    const uploadPath = cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
    return `${BACKEND_BASE}${uploadPath}`;
  }

  // Default: preserve relative path
  return cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
}

// In-flight request deduplication map and short-TTL response cache to prevent duplicate requests
const inFlightRequests = new Map();
const responseCache = new Map();
const CACHE_TTL_MS = 2500; // 2.5s window avoids redundant duplicate queries on mount

/**
 * Robust JSON fetch wrapper with:
 * - Simultaneous request deduplication
 * - Controlled retry on temporary network / 5xx server errors (never on 4xx client errors)
 * - Safe JSON parsing and informative error logging
 */
async function safeFetchJson(url, options = {}, retries = 1) {
  const method = (options.method || 'GET').toUpperCase();
  const cacheKey = `${method}:${url}`;

  const shouldSkipCache = Boolean(options.skipCache || options.cache === 'no-store' || options.cache === 'no-cache');
  if (method === 'GET' && !shouldSkipCache) {
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    if (inFlightRequests.has(cacheKey)) {
      return inFlightRequests.get(cacheKey);
    }
  }

  const executeRequest = (async () => {
    let lastError = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 9000);
        if (options.signal) {
          if (options.signal.aborted) {
            controller.abort();
          } else {
            options.signal.addEventListener('abort', () => controller.abort(), { once: true });
          }
        }

        const res = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            ...(options.headers || {})
          }
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          let errorData = null;
          try {
            errorData = await res.json();
          } catch {
            // non-json response body
          }

          const errorMessage =
            errorData?.error || errorData?.message || `HTTP ${res.status}: ${res.statusText}`;
          const err = new Error(errorMessage);
          err.status = res.status;
          err.data = errorData;

          // 5xx server errors on GET can be retried once after brief backoff
          if (res.status >= 500 && attempt < retries && method === 'GET') {
            console.warn(`[API] Server status ${res.status} on ${url}. Retrying attempt ${attempt + 1}/${retries}...`);
            await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
            continue;
          }

          throw err;
        }

        const text = await res.text();
        if (!text || !text.trim()) {
          return null;
        }

        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch (jsonErr) {
          console.error(`[API] Invalid JSON response from ${url}:`, text.slice(0, 150));
          throw new Error(`Invalid JSON received from ${url}: ${jsonErr.message}`);
        }

        if (method === 'GET') {
          responseCache.set(cacheKey, { timestamp: Date.now(), data: parsed });
        }

        return parsed;
      } catch (err) {
        lastError = err;
        // Never retry client errors (4xx) or mutations
        if (err.status && err.status < 500) {
          break;
        }
        if (attempt < retries && method === 'GET') {
          console.warn(`[API] Network failure on ${url}: ${err.message}. Retrying in 350ms...`);
          await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
        } else {
          break;
        }
      }
    }

    console.error(`[API] Request failed [${method} ${url}]:`, lastError?.message || lastError);
    throw lastError;
  })();

  if (method === 'GET') {
    inFlightRequests.set(cacheKey, executeRequest);
    executeRequest.finally(() => {
      inFlightRequests.delete(cacheKey);
    });
  }

  return executeRequest;
}

/**
 * Fetch total submission count from MongoDB
 */
export async function fetchSubmissionCount() {
  try {
    const data = await safeFetchJson(`${API_BASE}/inquiries?countOnly=true`);
    return typeof data?.count === 'number' ? data.count : 0;
  } catch (error) {
    console.warn('[API] Could not fetch live count from backend:', error.message);
    return 0;
  }
}

/**
 * Submit an inquiry from drawer or contact page to MongoDB
 */
export async function submitInquiry(inquiryData) {
  try {
    const data = await safeFetchJson(`${API_BASE}/inquiries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inquiryData),
    }, 0);

    // Invalidate inquiries count cache
    responseCache.delete(`GET:${API_BASE}/inquiries?countOnly=true`);

    return data;
  } catch (error) {
    console.error('[API] Inquiry submission error:', error.message);
    throw error;
  }
}

/**
 * Fetch active products for the slider
 */
export async function fetchSliderProducts() {
  try {
    const data = await safeFetchJson(`${API_BASE}/products?sliderOnly=true`);
    return data?.products || null;
  } catch (error) {
    console.warn('[API] Could not fetch slider products:', error.message);
    return null;
  }
}

/**
 * Fetch mega menu navigation items
 */
export async function fetchMenuItems(scope) {
  try {
    const url = scope ? `${API_BASE}/menu-items?scope=${encodeURIComponent(scope)}` : `${API_BASE}/menu-items`;
    const data = await safeFetchJson(url);
    return data?.items || null;
  } catch (error) {
    console.warn('[API] Could not fetch menu items:', error.message);
    return null;
  }
}

/**
 * Fetch site settings (headline, address, phone, email, bio)
 */
export async function fetchSiteSettings(group) {
  try {
    const url = group ? `${API_BASE}/settings?group=${encodeURIComponent(group)}` : `${API_BASE}/settings`;
    const data = await safeFetchJson(url);
    return data?.settings || null;
  } catch (error) {
    console.warn('[API] Could not fetch settings:', error.message);
    return null;
  }
}

/**
 * Fetch dynamic website brand logo from MongoDB SiteSetting
 */
export async function fetchWebsiteLogo() {
  try {
    const data = await safeFetchJson(`${API_BASE}/settings?key=website_logo`);
    if (data && data.success) {
      const val = data.data?.value || data.setting || data.settings?.website_logo;
      if (val) {
        if (typeof val === 'string') {
          const isVid = /\.(mp4|webm)(\?.*)?$/i.test(val);
          return {
            imageUrl: val,
            url: val,
            mediaType: isVid ? 'video' : 'image',
            mimeType: isVid ? (val.endsWith('.webm') ? 'video/webm' : 'video/mp4') : 'image/png',
            altText: 'AVXBS Water Solutions',
          };
        }
        return val;
      }
    }
    return null;
  } catch (error) {
    console.warn('[API] Website logo fallback to animated logo:', error.message);
    return null;
  }
}

/**
 * Fetch dynamic secondary banner configuration from MongoDB SiteSetting
 */
export async function fetchSecondaryBanner() {
  try {
    const data = await safeFetchJson(`${API_BASE}/settings?key=secondary_banner`);
    if (data && data.success) {
      const val = data.data?.value || data.setting || data.settings?.secondary_banner;
      if (val && typeof val === 'object') {
        return val;
      }
    }
    return null;
  } catch (error) {
    console.warn('[API] Secondary banner fetch error:', error.message);
    return null;
  }
}

/**
 * Fetch dynamic hero banner slides and settings from MongoDB
 */
export async function fetchHeroBanner() {
  try {
    const data = await safeFetchJson(`${API_BASE}/hero-slides`);
    return data;
  } catch (error) {
    console.warn('[API] Failed to fetch hero banner:', error.message);
    return null;
  }
}

/**
 * Fetch dynamic footer directory configuration from MongoDB
 */
export async function fetchFooterConfig() {
  try {
    const data = await safeFetchJson(`${API_BASE}/footer-config`);
    return data?.config || null;
  } catch (error) {
    console.warn('[API] Could not fetch footer config:', error.message);
    return null;
  }
}

/**
 * Fetch published customer testimonials from MongoDB
 */
export async function fetchTestimonials() {
  try {
    const data = await safeFetchJson(`${API_BASE}/testimonials`);
    return data?.testimonials || [];
  } catch (error) {
    console.warn('[API] Could not fetch testimonials:', error.message);
    return [];
  }
}

/**
 * Submit customer feedback / experience to MongoDB
 */
export async function submitCustomerFeedback(feedbackData) {
  try {
    const data = await safeFetchJson(`${API_BASE}/testimonials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedbackData),
    }, 0);

    // Invalidate testimonials cache
    responseCache.delete(`GET:${API_BASE}/testimonials`);

    return data;
  } catch (error) {
    console.error('[API] Feedback submission error:', error.message);
    throw error;
  }
}

/**
 * Fetch dynamic enquiry tabs for category (Residential / Commercial)
 */
export async function fetchEnquiryTabs(category) {
  try {
    const url = category ? `${API_BASE}/enquiry-tabs?category=${encodeURIComponent(category)}` : `${API_BASE}/enquiry-tabs`;
    const data = await safeFetchJson(url);
    return data?.tabs || [];
  } catch (error) {
    console.warn('[API] Could not fetch enquiry tabs:', error.message);
    return [];
  }
}

/**
 * Submit dynamic enquiry tab form to MongoDB
 */
export async function submitEnquiryTabForm(submissionData) {
  try {
    const data = await safeFetchJson(`${API_BASE}/enquiry-submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submissionData),
    }, 0);

    return data;
  } catch (error) {
    console.error('[API] Enquiry tab submission error:', error.message);
    throw error;
  }
}

/**
 * Invalidate cached mega menu queries
 */
export function invalidateMegaMenuCache() {
  for (const key of responseCache.keys()) {
    if (key.includes('/mega-menu')) {
      responseCache.delete(key);
    }
  }
}

/**
 * Fetch Mega Menu configuration (Residential & Commercial)
 */
export async function fetchMegaMenu(scope = null, options = {}) {
  try {
    const params = new URLSearchParams();
    if (scope) params.append('scope', scope);
    if (options.all) params.append('all', 'true');
    if (options.skipCache) params.append('_t', Date.now().toString());

    const qs = params.toString() ? `?${params.toString()}` : '';
    const url = `${API_BASE}/mega-menu${qs}`;
    const json = await safeFetchJson(url, options.skipCache ? { skipCache: true } : {});
    return json;
  } catch (error) {
    console.warn('[API] Could not fetch mega menu:', error.message);
    return null;
  }
}

/**
 * Fetch Homepage Inquiry Section Configuration (Dynamic AI Image, Headings, Colors)
 */
export async function fetchInquirySection() {
  try {
    const json = await safeFetchJson(`${API_BASE}/inquiry-section`);
    return json?.data || null;
  } catch (error) {
    console.warn('[API] Could not fetch inquiry section:', error.message);
    return null;
  }
}

/**
 * Search dynamically across website (solutions, highlights, products, technical guides)
 */
export async function searchWebsite(query) {
  if (!query || !query.trim()) return { success: true, results: [], total: 0 };
  try {
    const data = await safeFetchJson(`${API_BASE}/search?q=${encodeURIComponent(query.trim())}`);
    return data;
  } catch (error) {
    console.warn('[API] Search error:', error.message);
    return { success: false, results: [], error: error.message };
  }
}

/**
 * Fetch dynamic About Us page content from MongoDB
 */
export async function fetchAboutConfig() {
  try {
    const data = await safeFetchJson(`${API_BASE}/about-config`);
    return data?.config || null;
  } catch (error) {
    console.warn('[API] About config fallback:', error.message);
    return null;
  }
}

/**
 * Fetch dynamic Contact Us page content from MongoDB
 */
export async function fetchContactConfig() {
  try {
    const data = await safeFetchJson(`${API_BASE}/contact-config`);
    return data?.config || null;
  } catch (error) {
    console.warn('[API] Contact config fallback:', error.message);
    return null;
  }
}
