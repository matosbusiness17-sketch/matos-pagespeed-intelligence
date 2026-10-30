import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/db/repository';
import { validateAndNormalizeUrl } from '@/lib/validation/url';

export async function GET() {
  try {
    const repo = getRepository();
    const websites = repo.getWebsites();
    return NextResponse.json({ success: true, count: websites.length, websites });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve websites';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
  }

  const { displayName, url, businessName, notes } = body;

  if (!displayName || typeof displayName !== 'string') {
    return NextResponse.json({ error: 'Display name is required.' }, { status: 400 });
  }

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'Website URL is required.' }, { status: 400 });
  }

  const validation = validateAndNormalizeUrl(url);
  if (!validation.valid || !validation.normalizedUrl || !validation.domain) {
    return NextResponse.json({ error: validation.error || 'Invalid URL destination.' }, { status: 400 });
  }

  const repo = getRepository();
  const existing = repo.findWebsiteByUrl(validation.normalizedUrl);
  if (existing) {
    return NextResponse.json(
      {
        error: `A tracked website with URL "${validation.normalizedUrl}" already exists.`,
        existingWebsite: existing,
      },
      { status: 409 }
    );
  }

  try {
    const website = repo.createWebsite({
      displayName,
      url: validation.normalizedUrl,
      domain: validation.domain,
      businessName: typeof businessName === 'string' ? businessName : null,
      notes: typeof notes === 'string' ? notes : null,
    });

    return NextResponse.json({ success: true, website }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create website';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
