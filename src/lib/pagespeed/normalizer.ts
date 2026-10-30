import type {
  ScanResult,
  ScanStrategy,
  ScanMetrics,
  PerformanceMetric,
  DiagnosticRecommendation,
  AuditPriority,
  MetricCategory,
} from '@/types';
import type { GooglePageSpeedResponse, LighthouseAuditItem } from './types';

export function categorizeScore(score: number): MetricCategory {
  if (score >= 90) return 'good';
  if (score >= 50) return 'needs-improvement';
  return 'poor';
}

function categorizeFcp(ms: number): MetricCategory {
  if (ms <= 1800) return 'good';
  if (ms <= 3000) return 'needs-improvement';
  return 'poor';
}

function categorizeLcp(ms: number): MetricCategory {
  if (ms <= 2500) return 'good';
  if (ms <= 4000) return 'needs-improvement';
  return 'poor';
}

function categorizeTbt(ms: number): MetricCategory {
  if (ms <= 200) return 'good';
  if (ms <= 600) return 'needs-improvement';
  return 'poor';
}

function categorizeCls(val: number): MetricCategory {
  if (val <= 0.1) return 'good';
  if (val <= 0.25) return 'needs-improvement';
  return 'poor';
}

function categorizeSpeedIndex(ms: number): MetricCategory {
  if (ms <= 3400) return 'good';
  if (ms <= 5800) return 'needs-improvement';
  return 'poor';
}

function getSuggestedAction(auditId: string): string {
  switch (auditId) {
    case 'render-blocking-resources':
      return 'Eliminate render-blocking styles and scripts by inlining critical CSS, deferring non-critical scripts with defer/async, and loading stylesheets asynchronously.';
    case 'modern-image-formats':
      return 'Convert legacy PNG and JPEG assets to modern AVIF or WebP formats to reduce transfer payload while preserving visual fidelity.';
    case 'uses-optimized-images':
      return 'Compress raster images to optimal quality levels (e.g. 80-85%) or use automated image CDN optimization.';
    case 'unused-javascript':
      return 'Code-split large bundles and tree-shake unused library exports to prevent parsing and compiling dead code on initial load.';
    case 'unused-css-rules':
      return 'Remove dead CSS rules or split stylesheet imports by route so only essential viewport styles are delivered.';
    case 'unminified-javascript':
      return 'Enable minification and dead-code stripping in your JavaScript build pipeline.';
    case 'unminified-css':
      return 'Minify CSS files to eliminate unnecessary whitespace, comments, and redundant selectors.';
    case 'server-response-time':
      return 'Optimize backend database queries, implement edge caching (CDN / Reverse Proxy), or upgrade hosting resources to lower Time To First Byte (TTFB).';
    case 'mainthread-work-breakdown':
      return 'Reduce main-thread CPU bottlenecks by breaking up long tasks, offloading heavy compute to Web Workers, and deferring non-essential computation.';
    case 'total-byte-weight':
      return 'Reduce overall network payload by compressing assets (Brotli/Gzip), lazy-loading below-the-fold media, and trimming third-party script tags.';
    case 'uses-rel-preconnect':
    case 'uses-rel-preload':
      return 'Establish early network handshakes with critical third-party domains via preconnect or preload key web fonts.';
    case 'layout-shift-elements':
      return 'Set explicit width and height dimensions on image/video containers and reserve space for dynamic ads/embeds to eliminate layout shifts.';
    default:
      return 'Review and optimize this resource according to Google Web Vitals performance recommendations.';
  }
}

function classifyPriority(
  auditId: string,
  savingsMs: number | null,
  savingsBytes: number | null,
  score: number | null
): AuditPriority {
  // Critical thresholds: >= 800ms savings or >= 1MB savings
  if ((savingsMs !== null && savingsMs >= 800) || (savingsBytes !== null && savingsBytes >= 1000000)) {
    return 'critical';
  }
  if (score !== null && score < 0.3 && (auditId === 'render-blocking-resources' || auditId === 'server-response-time')) {
    return 'critical';
  }

  // High thresholds: >= 400ms savings or >= 300KB savings or score < 0.5
  if ((savingsMs !== null && savingsMs >= 400) || (savingsBytes !== null && savingsBytes >= 300000)) {
    return 'high';
  }
  if (score !== null && score < 0.5) {
    return 'high';
  }

  // Medium thresholds: >= 100ms savings or >= 100KB savings or score < 0.85
  if ((savingsMs !== null && savingsMs >= 100) || (savingsBytes !== null && savingsBytes >= 100000)) {
    return 'medium';
  }
  if (score !== null && score < 0.85) {
    return 'medium';
  }

  return 'low';
}

export function extractCoreMetrics(audits: Record<string, LighthouseAuditItem>): ScanMetrics | null {
  const fcpAudit = audits['first-contentful-paint'];
  const lcpAudit = audits['largest-contentful-paint'];
  const tbtAudit = audits['total-blocking-time'];
  const clsAudit = audits['cumulative-layout-shift'];
  const siAudit = audits['speed-index'];

  if (!fcpAudit && !lcpAudit && !tbtAudit && !clsAudit && !siAudit) {
    return null;
  }

  const fcpMs = fcpAudit?.numericValue ?? 0;
  const lcpMs = lcpAudit?.numericValue ?? 0;
  const tbtMs = tbtAudit?.numericValue ?? 0;
  const clsVal = clsAudit?.numericValue ?? 0;
  const siMs = siAudit?.numericValue ?? 0;

  const fcp: PerformanceMetric = {
    id: 'fcp',
    name: 'First Contentful Paint',
    displayValue: fcpAudit?.displayValue ?? `${(fcpMs / 1000).toFixed(1)} s`,
    numericValue: fcpMs,
    unit: 'ms',
    score: fcpAudit?.score ?? null,
    category: categorizeFcp(fcpMs),
    description: 'Marks the time at which the first text or image is painted in the viewport during simulated lab testing.',
    isLaboratory: true,
  };

  const lcp: PerformanceMetric = {
    id: 'lcp',
    name: 'Largest Contentful Paint',
    displayValue: lcpAudit?.displayValue ?? `${(lcpMs / 1000).toFixed(1)} s`,
    numericValue: lcpMs,
    unit: 'ms',
    score: lcpAudit?.score ?? null,
    category: categorizeLcp(lcpMs),
    description: 'Marks the time at which the largest text block or image element is rendered during simulated lab testing.',
    isLaboratory: true,
  };

  const tbt: PerformanceMetric = {
    id: 'tbt',
    name: 'Total Blocking Time',
    displayValue: tbtAudit?.displayValue ?? `${Math.round(tbtMs)} ms`,
    numericValue: tbtMs,
    unit: 'ms',
    score: tbtAudit?.score ?? null,
    category: categorizeTbt(tbtMs),
    description: 'Sum of all time periods between FCP and Time to Interactive when task duration exceeded 50ms (simulated laboratory responsiveness).',
    isLaboratory: true,
  };

  const cls: PerformanceMetric = {
    id: 'cls',
    name: 'Cumulative Layout Shift',
    displayValue: clsAudit?.displayValue ?? clsVal.toFixed(3),
    numericValue: clsVal,
    unit: 'unitless',
    score: clsAudit?.score ?? null,
    category: categorizeCls(clsVal),
    description: 'Measures unexpected movement of visible elements within the viewport during page lifecycle.',
    isLaboratory: true,
  };

  const speedIndex: PerformanceMetric = {
    id: 'speed-index',
    name: 'Speed Index',
    displayValue: siAudit?.displayValue ?? `${(siMs / 1000).toFixed(1)} s`,
    numericValue: siMs,
    unit: 'ms',
    score: siAudit?.score ?? null,
    category: categorizeSpeedIndex(siMs),
    description: 'Shows how quickly the contents of a page are visibly populated during simulated loading.',
    isLaboratory: true,
  };

  return { fcp, lcp, tbt, cls, speedIndex };
}

const OPPORTUNITY_AUDIT_IDS = [
  'render-blocking-resources',
  'modern-image-formats',
  'uses-optimized-images',
  'unused-javascript',
  'unused-css-rules',
  'unminified-javascript',
  'unminified-css',
  'server-response-time',
  'mainthread-work-breakdown',
  'total-byte-weight',
  'uses-rel-preconnect',
  'uses-rel-preload',
  'layout-shift-elements',
  'offscreen-images',
  'uses-responsive-images',
  'efficient-animated-content',
  'duplicated-javascript',
  'legacy-javascript',
  'bootup-time',
  'third-party-summary',
];

export function extractDiagnostics(audits: Record<string, LighthouseAuditItem>): DiagnosticRecommendation[] {
  const diagnostics: DiagnosticRecommendation[] = [];

  for (const auditId of OPPORTUNITY_AUDIT_IDS) {
    const audit = audits[auditId];
    if (!audit) continue;

    // We only care about opportunities/diagnostics that have not passed perfectly (score < 1 or savings > 0)
    const score = typeof audit.score === 'number' ? audit.score : null;
    const savingsMs = typeof audit.details?.overallSavingsMs === 'number' ? Math.round(audit.details.overallSavingsMs) : null;
    const savingsBytes = typeof audit.details?.overallSavingsBytes === 'number' ? Math.round(audit.details.overallSavingsBytes) : null;

    // Filter out perfect passes
    if (score === 1 && (!savingsMs || savingsMs <= 0) && (!savingsBytes || savingsBytes <= 0)) {
      continue;
    }

    // Must have either an imperfect score (< 0.9) or measurable savings
    const hasSavings = (savingsMs !== null && savingsMs > 50) || (savingsBytes !== null && savingsBytes > 10240);
    const hasLowScore = score !== null && score < 0.9;

    if (!hasSavings && !hasLowScore) {
      continue;
    }

    // Clean description to remove Markdown links e.g. [Learn more](url)
    const cleanDescription = (audit.description || '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();

    diagnostics.push({
      id: auditId,
      title: audit.title,
      description: cleanDescription,
      displayValue: audit.displayValue || null,
      estimatedSavingsMs: savingsMs,
      estimatedSavingsBytes: savingsBytes,
      priority: classifyPriority(auditId, savingsMs, savingsBytes, score),
      suggestedAction: getSuggestedAction(auditId),
      details: audit.details ? { itemsCount: audit.details.items?.length } : null,
    });
  }

  // Sort by priority: critical -> high -> medium -> low, then by savingsMs desc
  const priorityWeight: Record<AuditPriority, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  return diagnostics.sort((a, b) => {
    const diff = priorityWeight[b.priority] - priorityWeight[a.priority];
    if (diff !== 0) return diff;
    const aSavings = a.estimatedSavingsMs || 0;
    const bSavings = b.estimatedSavingsMs || 0;
    return bSavings - aSavings;
  });
}

/**
 * Normalizes a raw Google PageSpeed response into our standardized ScanResult format.
 */
export function normalizePageSpeedResponse(
  response: GooglePageSpeedResponse,
  requestedUrl: string,
  strategy: ScanStrategy,
  scanId: string,
  websiteId: string | null = null
): ScanResult {
  const lr = response.lighthouseResult;
  const rawScore = lr.categories?.performance?.score;
  const performanceScore = typeof rawScore === 'number' ? Math.round(rawScore * 100) : null;

  const metrics = extractCoreMetrics(lr.audits || {});
  const diagnostics = extractDiagnostics(lr.audits || {});
  const resolvedUrl = lr.finalDisplayedUrl || lr.finalUrl || lr.requestedUrl || requestedUrl;

  return {
    id: scanId,
    websiteId,
    requestedUrl,
    resolvedUrl,
    strategy,
    status: 'completed',
    performanceScore,
    metrics,
    diagnostics,
    lighthouseVersion: lr.lighthouseVersion || null,
    userAgent: lr.userAgent || null,
    scannedAt: lr.fetchTime || new Date().toISOString(),
    errorMessage: null,
    rawAuditCount: lr.audits ? Object.keys(lr.audits).length : 0,
  };
}
