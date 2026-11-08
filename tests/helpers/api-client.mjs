import { TEST_ENV } from './test-env.mjs';

export class ApiClient {
  constructor(baseUrl = TEST_ENV.BACKEND_URL) {
    this.baseUrl = baseUrl;
    this.token = null;
    this.cookie = null;
  }

  setToken(token) {
    this.token = token;
    this.cookie = token ? `avxbs_token=${token}` : null;
  }

  async login(email = TEST_ENV.ADMIN_EMAIL, password = TEST_ENV.ADMIN_PASSWORD) {
    const res = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.token) {
      this.setToken(data.token);
    }
    return { status: res.status, ok: res.ok, data };
  }

  getHeaders(customHeaders = {}, includeAuth = true) {
    const headers = { ...customHeaders };
    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
      if (this.cookie) {
        headers['Cookie'] = this.cookie;
      }
    }
    return headers;
  }

  async get(endpoint, options = {}) {
    const headers = this.getHeaders(options.headers, options.auth !== false);
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers,
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, ok: res.ok, headers: res.headers, data };
  }

  async post(endpoint, body = {}, options = {}) {
    const headers = this.getHeaders(
      { 'Content-Type': 'application/json', ...options.headers },
      options.auth !== false
    );
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, ok: res.ok, headers: res.headers, data };
  }

  async put(endpoint, body = {}, options = {}) {
    const headers = this.getHeaders(
      { 'Content-Type': 'application/json', ...options.headers },
      options.auth !== false
    );
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, ok: res.ok, headers: res.headers, data };
  }

  async delete(endpoint, options = {}) {
    const headers = this.getHeaders(options.headers, options.auth !== false);
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers,
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, ok: res.ok, headers: res.headers, data };
  }

  async uploadFile(contentBufferOrBlob, filename = 'test.png', mimeType = 'image/png', options = {}) {
    const formData = new FormData();
    const blob = contentBufferOrBlob instanceof Blob
      ? contentBufferOrBlob
      : new Blob([contentBufferOrBlob], { type: mimeType });

    formData.append('file', blob, filename);
    if (options.category) formData.append('category', options.category);
    if (options.altText) formData.append('altText', options.altText);

    const headers = this.getHeaders({}, options.auth !== false);
    // Note: Do not set Content-Type header manually for FormData so fetch sets boundary automatically

    const res = await fetch(`${this.baseUrl}/api/uploads`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, ok: res.ok, data };
  }

  async getSettings(key = null, group = null) {
    let url = '/api/settings';
    const params = new URLSearchParams();
    if (key) params.set('key', key);
    if (group) params.set('group', group);
    const qs = params.toString();
    if (qs) url += `?${qs}`;
    return this.get(url, { auth: false });
  }

  async saveSetting(key, value, group = 'general', description = '') {
    return this.post('/api/settings', { key, value, group, description }, { auth: true });
  }

  async getTestimonials(params = {}) {
    let url = '/api/testimonials';
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) sp.set(k, String(v));
    }
    const qs = sp.toString();
    if (qs) url += `?${qs}`;
    const needsAuth = params.all === true || params.all === 'true';
    return this.get(url, { auth: needsAuth });
  }

  async createTestimonial(data) {
    return this.post('/api/testimonials', data, { auth: true });
  }

  async updateTestimonial(id, data) {
    return this.put(`/api/testimonials/${id}`, data, { auth: true });
  }

  async deleteTestimonial(id) {
    return this.delete(`/api/testimonials/${id}`, { auth: true });
  }
}
