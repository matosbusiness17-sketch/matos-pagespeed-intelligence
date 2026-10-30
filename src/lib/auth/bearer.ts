import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Validates the Authorization: Bearer <MATOS_INTERNAL_API_TOKEN> header.
 * Uses timing-safe string comparison to protect against timing analysis attacks.
 */
export function validateInternalBearerToken(request: NextRequest): { authenticated: boolean; errorResponse?: NextResponse } {
  const configuredToken = process.env.MATOS_INTERNAL_API_TOKEN?.trim();

  if (!configuredToken) {
    return {
      authenticated: false,
      errorResponse: NextResponse.json(
        {
          error: 'Internal API token is not configured on the server. Please set MATOS_INTERNAL_API_TOKEN.',
          code: 'SERVER_CONFIG_ERROR',
        },
        { status: 500 }
      ),
    };
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authenticated: false,
      errorResponse: NextResponse.json(
        {
          error: 'Missing or invalid Authorization header. Expected "Bearer <token>".',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      ),
    };
  }

  const providedToken = authHeader.slice(7).trim();

  // Timing safe comparison
  const configuredBuffer = Buffer.from(configuredToken, 'utf8');
  const providedBuffer = Buffer.from(providedToken, 'utf8');

  if (configuredBuffer.length !== providedBuffer.length) {
    return {
      authenticated: false,
      errorResponse: NextResponse.json(
        {
          error: 'Invalid bearer token provided.',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      ),
    };
  }

  const match = timingSafeEqual(configuredBuffer, providedBuffer);
  if (!match) {
    return {
      authenticated: false,
      errorResponse: NextResponse.json(
        {
          error: 'Invalid bearer token provided.',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      ),
    };
  }

  return { authenticated: true };
}
