import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { validateInternalBearerToken } from '@/lib/auth/bearer';

describe('Bearer Token Authentication Guard', () => {
  const origToken = process.env.MATOS_INTERNAL_API_TOKEN;

  beforeEach(() => {
    process.env.MATOS_INTERNAL_API_TOKEN = 'secret-test-token-xyz';
  });

  afterEach(() => {
    process.env.MATOS_INTERNAL_API_TOKEN = origToken;
  });

  it('rejects requests without Authorization header', () => {
    const req = new NextRequest('http://localhost:3000/api/v1/scans');
    const result = validateInternalBearerToken(req);
    expect(result.authenticated).toBe(false);
    expect(result.errorResponse?.status).toBe(401);
  });

  it('rejects invalid token', () => {
    const req = new NextRequest('http://localhost:3000/api/v1/scans', {
      headers: { authorization: 'Bearer wrong-token' },
    });
    const result = validateInternalBearerToken(req);
    expect(result.authenticated).toBe(false);
    expect(result.errorResponse?.status).toBe(401);
  });

  it('authenticates valid token successfully', () => {
    const req = new NextRequest('http://localhost:3000/api/v1/scans', {
      headers: { authorization: 'Bearer secret-test-token-xyz' },
    });
    const result = validateInternalBearerToken(req);
    expect(result.authenticated).toBe(true);
    expect(result.errorResponse).toBeUndefined();
  });
});
