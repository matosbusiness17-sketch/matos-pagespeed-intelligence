import type { ScanResult, HistoricalComparison, MetricComparison } from '@/types';

function compareLowerIsBetter(current: number, previous: number, unit: string): MetricComparison {
  const diff = current - previous;
  return {
    currentValue: current,
    previousValue: previous,
    diff: Math.round(diff * 1000) / 1000,
    unit,
    improved: diff < 0,
  };
}

/**
 * Computes like-for-like historical comparison between the current scan and an earlier scan
 * for the exact same URL and strategy.
 */
export function computeHistoricalComparison(
  currentScan: ScanResult,
  previousScan: ScanResult | null
): HistoricalComparison | null {
  if (!previousScan) {
    return null;
  }

  // Ensure like-for-like comparison: same strategy
  if (currentScan.strategy !== previousScan.strategy) {
    return null;
  }

  const currentScore = currentScan.performanceScore;
  const previousScore = previousScan.performanceScore;

  const scoreDelta =
    typeof currentScore === 'number' && typeof previousScore === 'number'
      ? currentScore - previousScore
      : null;

  const metricComparisons: HistoricalComparison['metrics'] = {};

  if (currentScan.metrics && previousScan.metrics) {
    // FCP (ms)
    metricComparisons.fcp = compareLowerIsBetter(
      currentScan.metrics.fcp.numericValue,
      previousScan.metrics.fcp.numericValue,
      'ms'
    );

    // LCP (ms)
    metricComparisons.lcp = compareLowerIsBetter(
      currentScan.metrics.lcp.numericValue,
      previousScan.metrics.lcp.numericValue,
      'ms'
    );

    // TBT (ms)
    metricComparisons.tbt = compareLowerIsBetter(
      currentScan.metrics.tbt.numericValue,
      previousScan.metrics.tbt.numericValue,
      'ms'
    );

    // CLS (unitless)
    metricComparisons.cls = compareLowerIsBetter(
      currentScan.metrics.cls.numericValue,
      previousScan.metrics.cls.numericValue,
      'unitless'
    );

    // Speed Index (ms)
    metricComparisons.speedIndex = compareLowerIsBetter(
      currentScan.metrics.speedIndex.numericValue,
      previousScan.metrics.speedIndex.numericValue,
      'ms'
    );
  }

  return {
    previousScanId: previousScan.id,
    previousScannedAt: previousScan.scannedAt,
    scoreDelta,
    previousScore,
    metrics: metricComparisons,
  };
}
