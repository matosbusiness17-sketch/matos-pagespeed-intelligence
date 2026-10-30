import { NextRequest, NextResponse } from 'next/server';
import { validateInternalBearerToken } from '@/lib/auth/bearer';
import { getRepository } from '@/lib/db/repository';
import { computeHistoricalComparison } from '@/lib/services/comparison';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = validateInternalBearerToken(request);
  if (!auth.authenticated) {
    return auth.errorResponse!;
  }

  const { id } = await context.params;
  const repo = getRepository();
  const scan = repo.getScanById(id);

  if (!scan) {
    return NextResponse.json(
      { error: `Scan with ID "${id}" was not found.`, code: 'NOT_FOUND' },
      { status: 404 }
    );
  }

  // Retrieve prior scan for like-for-like comparison
  const priorScan = repo.getPreviousScan(scan.requestedUrl, scan.strategy, scan.id);
  const comparison = computeHistoricalComparison(scan, priorScan);

  return NextResponse.json({
    success: true,
    scan,
    comparison,
  });
}
