import type { ScanStrategy } from '@/types';
import type { GooglePageSpeedResponse } from './types';
import { mockMobilePageSpeedResponse, mockDesktopPageSpeedResponse } from './fixtures';

export class PageSpeedApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public rawCode?: string
  ) {
    super(message);
    this.name = 'PageSpeedApiError';
  }
}

/**
 * Strips sensitive API keys from strings, errors, and URLs to prevent credential leakage.
 */
export function scrubApiKey(text: string, apiKey?: string): string {
  if (!text) return text;
  let result = text;
  if (apiKey && apiKey.length > 5) {
    result = result.replaceAll(apiKey, '[REDACTED_KEY]');
  }
  // Also scrub any ?key=... or &key=... query params
  result = result.replace(/([?&]key=)[^&]+/gi, '$1[REDACTED_KEY]');
  return result;
}

export interface FetchPageSpeedOptions {
  url: string;
  strategy: ScanStrategy;
  timeoutMs?: number;
  useMock?: boolean;
}

export async function fetchPageSpeedAudit(options: FetchPageSpeedOptions): Promise<GooglePageSpeedResponse> {
  const { url, strategy, timeoutMs = 50000, useMock = false } = options;
  const apiKey = process.env.PAGESPEED_API_KEY?.trim();

  // If mock is explicitly requested or in test mode without an API key, use fixtures
  if (useMock || (!apiKey && (process.env.NODE_ENV === 'test' || process.env.ENABLE_MOCK_FALLBACK === 'true'))) {
    return strategy === 'desktop' ? mockDesktopPageSpeedResponse : mockMobilePageSpeedResponse;
  }

  if (!apiKey || apiKey === 'your_google_pagespeed_api_key_here') {
    throw new PageSpeedApiError(
      'Google PageSpeed API key is not configured. Please set PAGESPEED_API_KEY in your .env.local file.',
      401,
      'MISSING_API_KEY'
    );
  }

  const endpoint = new URL('https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed');
  endpoint.searchParams.set('url', url);
  endpoint.searchParams.set('strategy', strategy.toUpperCase());
  endpoint.searchParams.set('category', 'performance');
  endpoint.searchParams.set('key', apiKey);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(endpoint.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      let errorBody = '';
      try {
        const errorJson = await res.json();
        errorBody = errorJson?.error?.message || JSON.stringify(errorJson);
      } catch {
        errorBody = await res.text().catch(() => '');
      }

      const cleanMessage = scrubApiKey(errorBody, apiKey);

      if (res.status === 400) {
        throw new PageSpeedApiError(
          `Google PageSpeed could not analyze this URL: ${cleanMessage || 'Page was unreachable or returned an invalid response.'}`,
          400,
          'BAD_REQUEST'
        );
      }

      if (res.status === 403) {
        throw new PageSpeedApiError(
          `Google PageSpeed API access denied (403). Ensure PageSpeed Insights API is enabled on your Google Cloud project and the API key is valid.`,
          403,
          'FORBIDDEN'
        );
      }

      if (res.status === 429) {
        throw new PageSpeedApiError(
          'Google PageSpeed API quota limit exceeded. Please wait a moment before running another scan.',
          429,
          'QUOTA_EXCEEDED'
        );
      }

      if (res.status >= 500) {
        throw new PageSpeedApiError(
          `Google PageSpeed server error (${res.status}). Google services may be experiencing temporary disruptions.`,
          res.status,
          'SERVER_ERROR'
        );
      }

      throw new PageSpeedApiError(
        `Google PageSpeed API failed with status ${res.status}: ${cleanMessage}`,
        res.status,
        'API_ERROR'
      );
    }

    const data = (await res.json()) as GooglePageSpeedResponse;
    if (!data.lighthouseResult) {
      throw new PageSpeedApiError(
        'Google PageSpeed returned an incomplete response missing Lighthouse data.',
        502,
        'INCOMPLETE_RESPONSE'
      );
    }

    return data;
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    if (err instanceof PageSpeedApiError) {
      throw err;
    }

    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new PageSpeedApiError(
          `Google PageSpeed request timed out after ${Math.round(timeoutMs / 1000)} seconds. The target site may be very slow or blocking automated headless audits.`,
          504,
          'TIMEOUT'
        );
      }

      const cleanMessage = scrubApiKey(err.message, apiKey);
      throw new PageSpeedApiError(
        `Failed to communicate with Google PageSpeed API: ${cleanMessage}`,
        500,
        'NETWORK_ERROR'
      );
    }

    throw new PageSpeedApiError('Unknown error during Google PageSpeed analysis.', 500, 'UNKNOWN');
  }
}
