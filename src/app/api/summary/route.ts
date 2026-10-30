import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/db/repository';

export async function GET() {
  try {
    const repo = getRepository();
    const summary = repo.getDashboardSummary();
    return NextResponse.json({ success: true, ...summary });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve dashboard summary';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
