import { describe, it, expect } from 'vitest';
import { normalizePageSpeedResponse, extractCoreMetrics, extractDiagnostics } from '@/lib/pagespeed/normalizer';
import { mockMobilePageSpeedResponse, mockDesktopPageSpeedResponse } from '@/lib/pagespeed/fixtures';

describe('normalizer engine', () => {
  it('normalizes mobile PageSpeed response properly', () => {
    const result = normalizePageSpeedResponse(
      mockMobilePageSpeedResponse,
      'https://example.com',
      'mobile',
      'test-scan-id',
      'site-123'
    );

    expect(result.id).toBe('test-scan-id');
    expect(result.websiteId).toBe('site-123');
    expect(result.requestedUrl).toBe('https://example.com');
    expect(result.strategy).toBe('mobile');
    expect(result.status).toBe('completed');
    expect(result.performanceScore).toBe(78);
    expect(result.lighthouseVersion).toBe('12.2.1');

    // Metrics check
    expect(result.metrics).not.toBeNull();
    expect(result.metrics?.fcp.numericValue).toBe(1820);
    expect(result.metrics?.fcp.category).toBe('needs-improvement');
    expect(result.metrics?.fcp.isLaboratory).toBe(true);

    expect(result.metrics?.lcp.numericValue).toBe(3100);
    expect(result.metrics?.lcp.category).toBe('needs-improvement');

    expect(result.metrics?.tbt.numericValue).toBe(340);
    expect(result.metrics?.tbt.category).toBe('needs-improvement');

    expect(result.metrics?.cls.numericValue).toBe(0.045);
    expect(result.metrics?.cls.category).toBe('good');

    expect(result.metrics?.speedIndex.numericValue).toBe(2400);
    expect(result.metrics?.speedIndex.category).toBe('good');

    // Diagnostics check
    expect(result.diagnostics.length).toBeGreaterThan(0);
    const renderBlocking = result.diagnostics.find((d) => d.id === 'render-blocking-resources');
    expect(renderBlocking).toBeDefined();
    expect(renderBlocking?.estimatedSavingsMs).toBe(480);
    expect(renderBlocking?.priority).toBe('high');
    expect(renderBlocking?.suggestedAction).toContain('render-blocking');
  });

  it('normalizes desktop PageSpeed response with high score', () => {
    const result = normalizePageSpeedResponse(
      mockDesktopPageSpeedResponse,
      'https://example.com',
      'desktop',
      'test-desktop-id'
    );

    expect(result.performanceScore).toBe(94);
    expect(result.metrics?.cls.category).toBe('good');
    expect(result.metrics?.tbt.numericValue).toBe(40);
    expect(result.metrics?.tbt.category).toBe('good');
  });

  it('handles empty or missing audits defensively without crashing', () => {
    const metrics = extractCoreMetrics({});
    expect(metrics).toBeNull();

    const diagnostics = extractDiagnostics({});
    expect(diagnostics).toEqual([]);
  });
});
