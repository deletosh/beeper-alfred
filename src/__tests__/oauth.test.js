/**
 * Tests for the OAuth authorization-code + PKCE flow
 */

const crypto = require('crypto');
const {
  createPkcePair,
  startCallbackServer,
  exchangeCode
} = require('../api/oauth');

describe('PKCE', () => {
  test('derives an S256 challenge from the verifier', () => {
    const { verifier, challenge } = createPkcePair();

    const expected = crypto.createHash('sha256').update(verifier).digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    expect(challenge).toBe(expected);
  });

  test('verifier length is within the range RFC 7636 requires', () => {
    const { verifier } = createPkcePair();

    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(verifier.length).toBeLessThanOrEqual(128);
  });

  test('uses only unreserved URL characters', () => {
    const { verifier, challenge } = createPkcePair();

    expect(verifier).toMatch(/^[A-Za-z0-9\-._~]+$/);
    expect(challenge).toMatch(/^[A-Za-z0-9\-._~]+$/);
  });

  test('generates a distinct verifier per call', () => {
    expect(createPkcePair().verifier).not.toBe(createPkcePair().verifier);
  });
});

describe('callback server', () => {
  test('resolves with the code when state matches', async () => {
    const server = await startCallbackServer('state-123', 5000);

    await fetch(`${server.redirectUri}?code=auth-code&state=state-123`);

    await expect(server.code).resolves.toBe('auth-code');
  });

  test('rejects a code that arrives with a mismatched state', async () => {
    const server = await startCallbackServer('state-123', 5000);

    // An attacker-supplied code must never be exchanged
    await fetch(`${server.redirectUri}?code=stolen&state=attacker`);

    await expect(server.code).rejects.toThrow(/state mismatch/i);
  });

  test('surfaces a denial from the provider', async () => {
    const server = await startCallbackServer('state-123', 5000);

    await fetch(`${server.redirectUri}?error=access_denied&state=state-123`);

    await expect(server.code).rejects.toThrow(/access_denied/);
  });

  test('rejects a callback carrying no code', async () => {
    const server = await startCallbackServer('state-123', 5000);

    await fetch(`${server.redirectUri}?state=state-123`);

    await expect(server.code).rejects.toThrow(/no authorization code/i);
  });

  test('binds to loopback only', async () => {
    const server = await startCallbackServer('state-123', 5000);

    expect(server.redirectUri).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/callback$/);

    // Settle the pending promise so the server closes
    await fetch(`${server.redirectUri}?code=c&state=state-123`);
    await server.code;
  });
});

describe('token exchange', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('posts form-encoded credentials including the verifier', async () => {
    let captured;
    global.fetch = jest.fn(async (url, init) => {
      captured = { url: url.toString(), init };
      return {
        ok: true,
        json: async () => ({ access_token: 'bdapi_x', token_type: 'Bearer' })
      };
    });

    await exchangeCode({
      baseUrl: 'http://localhost:23373',
      clientId: 'client-1',
      code: 'auth-code',
      verifier: 'verifier-1',
      redirectUri: 'http://127.0.0.1:5000/callback'
    });

    expect(captured.url).toBe('http://localhost:23373/oauth/token');
    expect(captured.init.headers['Content-Type']).toBe('application/x-www-form-urlencoded');

    const body = new URLSearchParams(captured.init.body);
    expect(body.get('grant_type')).toBe('authorization_code');
    expect(body.get('code')).toBe('auth-code');
    expect(body.get('code_verifier')).toBe('verifier-1');
    expect(body.get('client_id')).toBe('client-1');
  });

  test('surfaces the provider error description', async () => {
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ error: 'invalid_grant', error_description: 'Code expired' })
    }));

    await expect(exchangeCode({
      baseUrl: 'http://localhost:23373',
      clientId: 'c',
      code: 'c',
      verifier: 'v',
      redirectUri: 'http://127.0.0.1:1/callback'
    })).rejects.toThrow(/Code expired/);
  });

  test('rejects a 200 response that carries no access_token', async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({ token_type: 'Bearer' })
    }));

    await expect(exchangeCode({
      baseUrl: 'http://localhost:23373',
      clientId: 'c',
      code: 'c',
      verifier: 'v',
      redirectUri: 'http://127.0.0.1:1/callback'
    })).rejects.toThrow(/no access_token/i);
  });
});
