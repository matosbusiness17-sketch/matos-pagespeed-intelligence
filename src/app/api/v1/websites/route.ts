import { NextRequest, NextResponse } from 'next/server';
import { validateInternalBearerToken } from '@/lib/auth/bearer';
import { getRepository } from '@/lib/db/repository';
import { validateAndNormalizeUrl } from '@/lib/validation/url';

export async function GET(request: NextRequest) {
  const auth = validateInternalBearerToken(request);
  if (!auth.authenticated) {
    return auth.errorResponse!;
  }

  const repo = getRepository();
  const websites = repo.getWebsites();

  return NextResponse.json({
    success: true,
    count: websites.length,
    websites,
  });
}

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

  const { displayName, url, businessName, notes } = body;

  if (!displayName || typeof displayName !== 'string') {
    return NextResponse.json(
      { error: 'Field "displayName" is required and must be a string.', code: 'MISSING_DISPLAY_NAME' },
      { status: 400 }
    );
  }

  if (!url || typeof url !== 'string') {
    return NextResponse.json(
      { error: 'Field "url" is required and must be a string.', code: 'MISSING_URL' },
      { status: 400 }
    );
  }

  const validation = validateAndNormalizeUrl(url);
  if (!validation.valid || !validation.normalizedUrl || !validation.domain) {
    return NextResponse.json(
      { error: validation.error || 'Invalid URL destination.', code: 'INVALID_URL' },
      { status: 400 }
    );
  }

  const repo = getRepository();

  // Check if website with same URL already exists
  const existing = repo.findWebsiteByUrl(validation.normalizedUrl);
  if (existing) {
    return NextResponse.json(
      {
        error: `Website with URL "${validation.normalizedUrl}" already exists.`,
        code: 'DUPLICATE_WEBSITE',
        existingWebsite: existing,
      },
      { status: 409 }
    );
  }

  const website = repo.createWebsite({
    displayName,
    url: validation.normalizedUrl,
    domain: validation.domain,
    businessName: typeof businessName === 'string' ? businessName : null,
    notes: typeof notes === 'string' ? notes : null,
  });

  return NextResponse.json(
    {
      success: true,
      website,
    },
    { status: 201 }
  );
}
