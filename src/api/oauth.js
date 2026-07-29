/**
 * Beeper Desktop OAuth 2.0 client (authorization code + PKCE)
 *
 * Current Beeper builds authenticate via OAuth rather than a static token
 * pasted from settings. The contract, per GET /v1/spec on the running app:
 *
 *   POST /oauth/register  -> dynamic client registration, returns client_id
 *   GET  /oauth/authorize -> HTML consent page (needs a real browser)
 *   POST /oauth/token     -> form-encoded exchange, returns access_token
 *
 * PKCE is mandatory: `code_challenge` is required on /oauth/authorize and
 * `code_verifier` on the token exchange. The client is public
 * (token_endpoint_auth_method: none), so there is no client secret.
 *
 * No refresh_token is issued and the only supported grant is
 * authorization_code, so an expired token means re-running `bp setup`.
 */

const crypto = require('crypto');
const http = require('http');
const { exec } = require('child_process');
const { request } = require('./http');

const CLIENT_NAME = 'Alfred';
const SCOPE = 'read write';

/**
 * Base64url-encode a buffer (RFC 7636 uses base64url, not standard base64)
 * @param {Buffer} buf - Bytes to encode
 * @returns {string} base64url string
 */
function base64url(buf) {
  return buf.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generate a PKCE verifier/challenge pair
 * @returns {{verifier: string, challenge: string}}
 */
function createPkcePair() {
  // 32 random bytes -> 43-char verifier, within RFC 7636's 43..128 range
  const verifier = base64url(crypto.randomBytes(32));
  const challenge = base64url(
    crypto.createHash('sha256').update(verifier).digest()
  );
  return { verifier, challenge };
}

/**
 * Register a public OAuth client with the local Beeper app.
 * Registration is cheap and idempotent enough to redo per setup run, which
 * avoids persisting a client_id that may be revoked out from under us.
 * @param {string} baseUrl - API base URL
 * @param {string} redirectUri - Loopback redirect URI
 * @returns {Promise<string>} client_id
 */
async function registerClient(baseUrl, redirectUri) {
  const result = await request({
    method: 'POST',
    path: '/oauth/register',
    baseUrl,
    // Registration is unauthenticated; there is no token yet.
    token: null,
    body: {
      client_name: CLIENT_NAME,
      redirect_uris: [redirectUri],
      grant_types: ['authorization_code'],
      response_types: ['code'],
      scope: SCOPE,
      token_endpoint_auth_method: 'none'
    }
  });

  if (!result?.client_id) {
    throw new Error('Beeper did not return a client_id during registration');
  }

  return result.client_id;
}

/**
 * Exchange an authorization code for an access token.
 * This endpoint takes form-encoded data, not JSON.
 * @param {Object} options - Exchange parameters
 * @returns {Promise<Object>} Token response ({access_token, expires_in, ...})
 */
async function exchangeCode({ baseUrl, clientId, code, verifier, redirectUri }) {
  const form = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    code_verifier: verifier,
    client_id: clientId,
    redirect_uri: redirectUri
  });

  const response = await fetch(new URL('/oauth/token', baseUrl), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString()
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = payload?.error_description || payload?.error || response.statusText;
    throw new Error(`Token exchange failed: ${detail}`);
  }

  if (!payload?.access_token) {
    throw new Error('Token exchange succeeded but returned no access_token');
  }

  return payload;
}

/**
 * Start a loopback server that captures the OAuth redirect.
 * Binds to 127.0.0.1 on an ephemeral port so nothing is exposed off-machine.
 * @param {string} expectedState - CSRF state to verify against
 * @param {number} timeoutMs - How long to wait for the user to approve
 * @returns {Promise<{redirectUri: string, code: Promise<string>}>}
 */
function startCallbackServer(expectedState, timeoutMs) {
  return new Promise((resolveServer, rejectServer) => {
    let settle;
    const code = new Promise((resolve, reject) => {
      settle = { resolve, reject };
    });

    const server = http.createServer((req, res) => {
      const url = new URL(req.url, 'http://127.0.0.1');

      if (url.pathname !== '/callback') {
        res.writeHead(404).end();
        return;
      }

      const respond = (title, detail) => {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(
          '<!doctype html><meta charset="utf-8">' +
          `<title>${title}</title>` +
          '<body style="font-family:-apple-system,system-ui,sans-serif;' +
          'display:flex;align-items:center;justify-content:center;' +
          'height:100vh;margin:0;background:#f5f5f7;color:#1d1d1f">' +
          `<div style="text-align:center"><h1 style="font-size:20px">${title}</h1>` +
          `<p style="color:#6e6e73">${detail}</p></div></body>`
        );
      };

      const error = url.searchParams.get('error');
      const returnedState = url.searchParams.get('state');
      const returnedCode = url.searchParams.get('code');

      // Close after the response flushes so the browser tab renders the result
      const finish = (fn) => {
        res.on('finish', () => server.close());
        fn();
      };

      if (error) {
        finish(() => respond('❌ Authorization denied', error));
        settle.reject(new Error(`Authorization denied: ${error}`));
        return;
      }

      // Verify state before trusting the code (CSRF / cross-session mixups)
      if (returnedState !== expectedState) {
        finish(() => respond('❌ Authorization failed', 'State mismatch.'));
        settle.reject(new Error('OAuth state mismatch — aborting for safety'));
        return;
      }

      if (!returnedCode) {
        finish(() => respond('❌ Authorization failed', 'No code returned.'));
        settle.reject(new Error('No authorization code in callback'));
        return;
      }

      finish(() => respond('✅ Alfred is connected', 'You can close this tab.'));
      settle.resolve(returnedCode);
    });

    server.on('error', rejectServer);

    const timer = setTimeout(() => {
      server.close();
      settle.reject(new Error('Timed out waiting for authorization in the browser'));
    }, timeoutMs);
    // Don't hold the process open on the timer alone
    timer.unref?.();
    code.finally(() => clearTimeout(timer)).catch(() => {});

    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolveServer({ redirectUri: `http://127.0.0.1:${port}/callback`, code });
    });
  });
}

/**
 * Run the full authorization-code + PKCE flow.
 * Opens the consent page in the user's browser and waits for the redirect.
 * @param {Object} options - Flow options
 * @param {string} options.baseUrl - API base URL
 * @param {number} options.timeoutMs - Consent timeout
 * @param {Function} options.openBrowser - Override for opening the URL (testing)
 * @returns {Promise<Object>} Token response
 */
async function authorize({
  baseUrl = 'http://localhost:23373',
  timeoutMs = 120000,
  openBrowser = defaultOpenBrowser
} = {}) {
  const { verifier, challenge } = createPkcePair();
  const state = base64url(crypto.randomBytes(16));

  const { redirectUri, code: codePromise } = await startCallbackServer(state, timeoutMs);
  const clientId = await registerClient(baseUrl, redirectUri);

  const authUrl = new URL('/oauth/authorize', baseUrl);
  authUrl.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPE,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256'
  }).toString();

  await openBrowser(authUrl.toString());

  const code = await codePromise;

  return exchangeCode({ baseUrl, clientId, code, verifier, redirectUri });
}

/**
 * Open a URL in the user's default browser
 * @param {string} url - URL to open
 * @returns {Promise<void>}
 */
function defaultOpenBrowser(url) {
  return new Promise((resolve, reject) => {
    // Pass the URL as an argv entry, never interpolated into a shell string
    exec(`open ${JSON.stringify(url)}`, (error) => {
      if (error) {
        reject(new Error(`Could not open browser: ${error.message}`));
      } else {
        resolve();
      }
    });
  });
}

module.exports = {
  authorize,
  registerClient,
  exchangeCode,
  createPkcePair,
  startCallbackServer
};
