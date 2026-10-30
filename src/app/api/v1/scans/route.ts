import { NextRequest, NextResponse } from 'next/server';
import { validateInternalBearerToken } from '@/lib/auth/bearer';
import { getScanOrchestrator } from '@/lib/services/scanner';
import { getRepository } from '@/lib/db/repository';
import type { ScanStrategy } from '@/types';

export async function POST(request: NextRequest) {
  const auth = validateInternalBearerToken(request);
  if (!auth.authenticated) {
    return auth.errorResponse!;
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON request body.', code: 'INVALID_JSON' },
      { status: 400 }
    );
  }

  const { url, strategy = 'mobile', websiteId, useMock } = body;

  if (!url || typeof url !== 'string') {
    return NextResponse.json(
      { error: 'Field "url" is required and must be a string.', code: 'MISSING_URL' },
      { status: 400 }
    );
  }

  const validStrategies = ['mobile', 'desktop', 'both'];
  if (typeof strategy !== 'string' || !validStrategies.includes(strategy)) {
    return NextResponse.json(
      {
        error: `Field "strategy" must be one of: ${validStrategies.join(', ')}.`,
        code: 'INVALID_STRATEGY',
      },
      { status: 400 }
    );
  }

  const orchestrator = getScanOrchestrator();

  try {
    if (strategy === 'both') {
      const outcome = await orchestrator.executeBothScans(
        url,
        typeof websiteId === 'string' ? websiteId : undefined,
        Boolean(useMock)
      );
      return NextResponse.json(
        {
          success: true,
          scans: {
            mobile: outcome.mobile.scan,
            desktop: outcome.desktop.scan,
          },
          comparisons: {
            mobile: outcome.mobile.comparison,
            desktop: outcome.desktop.comparison,
          },
        },
        { status: 201 }
      );
    } else {
      const outcome = await orchestrator.executeScan({
        url,
        strategy: strategy as ScanStrategy,
        websiteId: typeof websiteId === 'string' ? websiteId : undefined,
        useMock: Boolean(useMock),
      });

      return NextResponse.json(
        {
          success: true,
          scan: outcome.scan,
          comparison: outcome.comparison,
        },
        { status: 201 }
      );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown scan error';
    return NextResponse.json(
      { error: message, code: 'SCAN_FAILED' },
      { status: 422 }
    );
  }
}

export async function GET(request: NextRequest) {
  const auth = validateInternalBearerToken(request);
  if (!auth.authenticated) {
    return auth.errorResponse!;
  }

  const searchParams = request.nextUrl.searchParams;
  const websiteId = searchParams.get('websiteId') || undefined;
  const requestedUrl = searchParams.get('url') || undefined;
  const strategyParam = searchParams.get('strategy');
  const strategy = strategyParam === 'mobile' || strategyParam === 'desktop' ? strategyParam : undefined;

  const limitParam = searchParams.get('limit');
  const offsetParam = searchParams.get('offset');
  const limit = limitParam ? parseInt(limitParam, 10) : 50;
  const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

  const repo = getRepository();
  const scans = repo.getScans({
    websiteId,
    requestedUrl,
    strategy,
    limit: isNaN(limit) ? 50 : Math.min(Math.max(limit, 1), 100),
    offset: isNaN(offset) ? 0 : Math.max(offset, 0),
  });

  return NextResponse.json({
    success: true,
    count: scans.length,
    scans,
  });
}
