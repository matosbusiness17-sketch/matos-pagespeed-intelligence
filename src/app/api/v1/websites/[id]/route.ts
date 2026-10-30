import { NextRequest, NextResponse } from 'next/server';
import { validateInternalBearerToken } from '@/lib/auth/bearer';
import { getRepository } from '@/lib/db/repository';

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
  const website = repo.getWebsiteById(id);

  if (!website) {
    return NextResponse.json(
      { error: `Website with ID "${id}" was not found.`, code: 'NOT_FOUND' },
      { status: 404 }
    );
  }

  // Get recent scans for this website
  const recentScans = repo.getScans({ websiteId: id, limit: 20 });

  return NextResponse.json({
    success: true,
    website,
    recentScans,
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = validateInternalBearerToken(request);
  if (!auth.authenticated) {
    return auth.errorResponse!;
  }

  const { id } = await context.params;
  const repo = getRepository();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON request body.', code: 'INVALID_JSON' },
      { status: 400 }
    );
  }

  const updated = repo.updateWebsite(id, {
    displayName: typeof body.displayName === 'string' ? body.displayName : undefined,
    businessName: typeof body.businessName === 'string' || body.businessName === null ? body.businessName : undefined,
    notes: typeof body.notes === 'string' || body.notes === null ? body.notes : undefined,
  });

  if (!updated) {
    return NextResponse.json(
      { error: `Website with ID "${id}" was not found.`, code: 'NOT_FOUND' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    website: updated,
  });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = validateInternalBearerToken(request);
  if (!auth.authenticated) {
    return auth.errorResponse!;
  }

  const { id } = await context.params;
  const repo = getRepository();
  const deleted = repo.deleteWebsite(id);

  if (!deleted) {
    return NextResponse.json(
      { error: `Website with ID "${id}" was not found.`, code: 'NOT_FOUND' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: `Website "${id}" successfully deleted.`,
  });
}
