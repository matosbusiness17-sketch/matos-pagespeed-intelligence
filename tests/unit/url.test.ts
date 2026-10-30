import { describe, it, expect } from 'vitest';
import { validateAndNormalizeUrl } from '@/lib/validation/url';

describe('validateAndNormalizeUrl', () => {
  it('normalizes valid https URLs', () => {
    const res = validateAndNormalizeUrl('https://Example.com/');
    expect(res.valid).toBe(true);
    expect(res.normalizedUrl).toBe('https://example.com');
    expect(res.domain).toBe('example.com');
  });

  it('adds https prefix when protocol is omitted', () => {
    const res = validateAndNormalizeUrl('matos.systems/pricing');
    expect(res.valid).toBe(true);
    expect(res.normalizedUrl).toBe('https://matos.systems/pricing');
    expect(res.domain).toBe('matos.systems');
  });

  it('removes default ports :80 and :443', () => {
    const httpRes = validateAndNormalizeUrl('http://example.com:80/page');
    expect(httpRes.valid).toBe(true);
    expect(httpRes.normalizedUrl).toBe('http://example.com/page');

    const httpsRes = validateAndNormalizeUrl('https://example.com:443/page');
    expect(httpsRes.valid).toBe(true);
    expect(httpsRes.normalizedUrl).toBe('https://example.com/page');
  });

  it('preserves non-default ports', () => {
    const res = validateAndNormalizeUrl('https://example.com:8443/test');
    expect(res.valid).toBe(true);
    expect(res.normalizedUrl).toBe('https://example.com:8443/test');
  });

  it('rejects credentials in URL', () => {
    const res = validateAndNormalizeUrl('https://admin:secret@example.com');
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/credentials/i);
  });

  it('rejects disallowed protocols (file:, ftp:, javascript:)', () => {
    expect(validateAndNormalizeUrl('ftp://example.com').valid).toBe(false);
    expect(validateAndNormalizeUrl('javascript:alert(1)').valid).toBe(false);
    expect(validateAndNormalizeUrl('file:///etc/passwd').valid).toBe(false);
  });

  it('rejects loopback and private IPv4 ranges (SSRF protection)', () => {
    expect(validateAndNormalizeUrl('http://127.0.0.1').valid).toBe(false);
    expect(validateAndNormalizeUrl('http://10.0.1.5').valid).toBe(false);
    expect(validateAndNormalizeUrl('http://192.168.1.1').valid).toBe(false);
    expect(validateAndNormalizeUrl('http://172.16.5.1').valid).toBe(false);
    expect(validateAndNormalizeUrl('http://169.254.169.254/latest/meta-data').valid).toBe(false);
    expect(validateAndNormalizeUrl('http://0.0.0.0').valid).toBe(false);
  });

  it('rejects localhost and local internal domains', () => {
    expect(validateAndNormalizeUrl('http://localhost:3000').valid).toBe(false);
    expect(validateAndNormalizeUrl('https://server.local').valid).toBe(false);
    expect(validateAndNormalizeUrl('https://api.internal').valid).toBe(false);
  });

  it('rejects invalid or malformed hostnames', () => {
    expect(validateAndNormalizeUrl('not-a-url').valid).toBe(false);
    expect(validateAndNormalizeUrl('').valid).toBe(false);
  });
});
