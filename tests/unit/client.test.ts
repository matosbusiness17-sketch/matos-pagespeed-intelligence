import { describe, it, expect } from 'vitest';
import { scrubApiKey, fetchPageSpeedAudit, PageSpeedApiError } from '@/lib/pagespeed/client';

describe('PageSpeed client & security scrubbing', () => {
  it('scrubs API key from error strings and query parameters', () => {
    const rawError = 'Failed request: https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed?url=https%3A%2F%2Fexample.com&key=AIzaSyD_SecretKey12345';
    const scrubbed = scrubApiKey(rawError, 'AIzaSyD_SecretKey12345');

    expect(scrubbed).not.toContain('AIzaSyD_SecretKey12345');
    expect(scrubbed).toContain('[REDACTED_KEY]');
  });

  it('throws PageSpeedApiError if API key is missing and mock is not enabled', async () => {
    const origKey = process.env.PAGESPEED_API_KEY;
    const origNodeEnv = process.env.NODE_ENV;
    try {
      delete process.env.PAGESPEED_API_KEY;
      // @ts-expect-error mutating for test
      process.env.NODE_ENV = 'production';

      await expect(
        fetchPageSpeedAudit({ url: 'https://example.com', strategy: 'mobile', useMock: false })
      ).rejects.toThrow(PageSpeedApiError);
    } finally {
      process.env.PAGESPEED_API_KEY = origKey;
      // @ts-expect-error restoring
      process.env.NODE_ENV = origNodeEnv;
    }
  });

  it('returns mock fixture when useMock is true', async () => {
    const res = await fetchPageSpeedAudit({ url: 'https://example.com', strategy: 'mobile', useMock: true });
    expect(res.lighthouseResult).toBeDefined();
    expect(res.lighthouseResult.categories.performance?.score).toBe(0.78);
  });
});
