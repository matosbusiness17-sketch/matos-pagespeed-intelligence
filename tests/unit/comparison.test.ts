import { describe, it, expect } from 'vitest';
import { computeHistoricalComparison } from '@/lib/services/comparison';
import type { ScanResult } from '@/types';

const baseScan: ScanResult = {
  id: 'scan-1',
  websiteId: 'site-1',
  requestedUrl: 'https://example.com',
  resolvedUrl: 'https://example.com',
  strategy: 'mobile',
  status: 'completed',
  performanceScore: 70,
  metrics: {
    fcp: { id: 'fcp', name: 'FCP', displayValue: '2.0s', numericValue: 2000, unit: 'ms', score: 0.7, category: 'needs-improvement', description: '', isLaboratory: true },
    lcp: { id: 'lcp', name: 'LCP', displayValue: '3.5s', numericValue: 3500, unit: 'ms', score: 0.6, category: 'needs-improvement', description: '', isLaboratory: true },
    tbt: { id: 'tbt', name: 'TBT', displayValue: '300ms', numericValue: 300, unit: 'ms', score: 0.7, category: 'needs-improvement', description: '', isLaboratory: true },
    cls: { id: 'cls', name: 'CLS', displayValue: '0.05', numericValue: 0.05, unit: 'unitless', score: 0.9, category: 'good', description: '', isLaboratory: true },
    speedIndex: { id: 'speed-index', name: 'SI', displayValue: '2.5s', numericValue: 2500, unit: 'ms', score: 0.8, category: 'good', description: '', isLaboratory: true },
  },
  diagnostics: [],
  lighthouseVersion: '12.0.0',
  userAgent: null,
  errorMessage: null,
  scannedAt: '2026-10-25T10:00:00Z',
};

describe('computeHistoricalComparison', () => {
  it('returns null if there is no previous scan', () => {
    const comp = computeHistoricalComparison(baseScan, null);
    expect(comp).toBeNull();
  });

  it('returns null if strategies do not match (enforces like-for-like)', () => {
    const desktopScan = { ...baseScan, strategy: 'desktop' as const };
    const comp = computeHistoricalComparison(baseScan, desktopScan);
    expect(comp).toBeNull();
  });

  it('computes positive performance score delta and improved metrics', () => {
    const currentScan: ScanResult = {
      ...baseScan,
      id: 'scan-2',
      performanceScore: 85,
      metrics: {
        ...baseScan.metrics!,
        fcp: { ...baseScan.metrics!.fcp, numericValue: 1500, displayValue: '1.5s' }, // improved by -500ms
        tbt: { ...baseScan.metrics!.tbt, numericValue: 150, displayValue: '150ms' }, // improved by -150ms
      },
      scannedAt: '2026-10-30T10:00:00Z',
    };

    const comp = computeHistoricalComparison(currentScan, baseScan);
    expect(comp).not.toBeNull();
    expect(comp?.scoreDelta).toBe(15); // 85 - 70 = +15
    expect(comp?.previousScore).toBe(70);

    // FCP lower is better: 1500 - 2000 = -500, improved = true
    expect(comp?.metrics.fcp?.diff).toBe(-500);
    expect(comp?.metrics.fcp?.improved).toBe(true);

    // TBT lower is better: 150 - 300 = -150, improved = true
    expect(comp?.metrics.tbt?.diff).toBe(-150);
    expect(comp?.metrics.tbt?.improved).toBe(true);
  });
});
