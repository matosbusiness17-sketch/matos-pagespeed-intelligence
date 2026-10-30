import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as createScan, GET as getScans } from '@/app/api/v1/scans/route';
import { POST as createWebsite, GET as getWebsites } from '@/app/api/v1/websites/route';
import { closeDb } from '@/lib/db';
import { resetRepository } from '@/lib/db/repository';

describe('/api/v1 Automation Endpoints Integration', () => {
  const token = 'test-automation-token-123';

  beforeEach(() => {
    closeDb();
    resetRepository();
    process.env.MATOS_INTERNAL_API_TOKEN = token;
    process.env.DATABASE_PATH = ':memory:';
  });

  afterEach(() => {
    closeDb();
    resetRepository();
  });

  it('rejects unauthenticated requests with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/scans', {
      method: 'GET',
    });
    const res = await getScans(req);
    expect(res.status).toBe(401);
  });

  it('rejects invalid bearer token with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/scans', {
      method: 'GET',
      headers: { authorization: 'Bearer wrong-token' },
    });
    const res = await getScans(req);
    expect(res.status).toBe(401);
  });

  it('creates website and returns 201 with valid token', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/websites', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        displayName: 'Acme Corp',
        url: 'https://acme.example.com',
        businessName: 'Acme Corporation',
        notes: 'Priority prospect',
      }),
    });

    const res = await createWebsite(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.website.displayName).toBe('Acme Corp');
    expect(body.website.domain).toBe('acme.example.com');

    // Verify GET /api/v1/websites lists the site
    const listReq = new NextRequest('http://localhost:3000/api/v1/websites', {
      method: 'GET',
      headers: { authorization: `Bearer ${token}` },
    });
    const listRes = await getWebsites(listReq);
    expect(listRes.status).toBe(200);
    const listBody = await listRes.json();
    expect(listBody.count).toBeGreaterThan(0);
  });

  it('rejects duplicate website creation with 409', async () => {
    const makeReq = () =>
      new NextRequest('http://localhost:3000/api/v1/websites', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          displayName: 'Duplicate Site',
          url: 'https://duplicate.example.com',
        }),
      });

    const first = await createWebsite(makeReq());
    expect(first.status).toBe(201);

    const second = await createWebsite(makeReq());
    expect(second.status).toBe(409);
    const body = await second.json();
    expect(body.code).toBe('DUPLICATE_WEBSITE');
  });

  it('triggers a mock performance scan via /api/v1/scans and returns 201', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/scans', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://example.com',
        strategy: 'mobile',
        useMock: true,
      }),
    });

    const res = await createScan(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.scan.performanceScore).toBe(78);
    expect(body.scan.strategy).toBe('mobile');
    expect(body.scan.metrics.fcp.isLaboratory).toBe(true);
  });
});
