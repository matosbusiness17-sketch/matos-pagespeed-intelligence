import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/db/repository';
import { computeHistoricalComparison } from '@/lib/services/comparison';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const repo = getRepository();
  const scan = repo.getScanById(id);

  if (!scan) {
    return NextResponse.json({ error: 'Scan not found.' }, { status: 404 });
  }

  const priorScan = repo.getPreviousScan(scan.requestedUrl, scan.strategy, scan.id);
  const comparison = computeHistoricalComparison(scan, priorScan);

  return NextResponse.json({
    success: true,
    scan,
    comparison,
  });
}
