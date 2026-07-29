/**
 * Beeper Desktop v1 HTTP transport
 *
 * The pinned @beeper/desktop-api SDK (0.1.5) targets the older RPC-style
 * `/v0/*` routes, which return 404 on current Beeper Desktop builds. The app
 * now serves a REST-style `/v1/*` API (see GET /v1/spec on the running app).
 * This is a dependency-free client for the endpoints this workflow needs.
 */

const DEFAULT_TIMEOUT = 5000;

/**
 * Perform a request against the local Beeper Desktop API
 * @param {Object} options - Request options
 * @param {string} options.method - HTTP method
 * @param {string} options.path - Path beginning with /v1
 * @param {Object} options.query - Query string parameters
 * @param {Object} options.body - JSON body
 * @param {string} options.token - Bearer access token
 * @param {string} options.baseUrl - API base URL
 * @returns {Promise<*>} Parsed JSON response, or null for empty responses
 */
async function request({
  method = 'GET',
  path,
  query = null,
  body = null,
  token,
  baseUrl = 'http://localhost:23373',
  timeout = DEFAULT_TIMEOUT
}) {
  const url = new URL(path, baseUrl);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        return;
      }
      // Repeat the key for array params (e.g. accountIDs)
      if (Array.isArray(value)) {
        value.forEach(v => url.searchParams.append(key, v));
      } else {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        // Unauthenticated endpoints (OAuth registration, /v1/info) pass no token
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {})
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Beeper API request timed out after ${timeout}ms`);
    }
    // Undici wraps connection failures; surface the cause so callers can match
    const cause = error.cause?.code || error.code;
    if (cause === 'ECONNREFUSED') {
      throw new Error('ECONNREFUSED: Beeper Desktop is not running');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text();
  let payload = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const detail = payload?.message || payload?.error || response.statusText;
    const error = new Error(`${response.status}: ${detail}`);
    error.status = response.status;
    throw error;
  }

  return payload;
}

module.exports = { request };
