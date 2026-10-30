export type ScanStrategy = 'mobile' | 'desktop';

export type ScanStatus = 'pending' | 'running' | 'completed' | 'failed';

export type MetricCategory = 'good' | 'needs-improvement' | 'poor';

export type AuditPriority = 'critical' | 'high' | 'medium' | 'low';

export interface PerformanceMetric {
  id: 'fcp' | 'lcp' | 'tbt' | 'cls' | 'speed-index';
  name: string;
  displayValue: string;
  numericValue: number;
  unit: string;
  score: number | null;
  category: MetricCategory;
  description: string;
  isLaboratory: true;
}

export interface DiagnosticRecommendation {
  id: string;
  title: string;
  description: string;
  displayValue: string | null;
  estimatedSavingsMs: number | null;
  estimatedSavingsBytes: number | null;
  priority: AuditPriority;
  suggestedAction: string;
  details?: Record<string, unknown> | null;
}

export interface ScanMetrics {
  fcp: PerformanceMetric;
  lcp: PerformanceMetric;
  tbt: PerformanceMetric;
  cls: PerformanceMetric;
  speedIndex: PerformanceMetric;
}

export interface ScanResult {
  id: string;
  websiteId: string | null;
  requestedUrl: string;
  resolvedUrl: string;
  strategy: ScanStrategy;
  status: ScanStatus;
  performanceScore: number | null; // 0-100
  metrics: ScanMetrics | null;
  diagnostics: DiagnosticRecommendation[];
  lighthouseVersion: string | null;
  userAgent: string | null;
  scannedAt: string; // ISO 8601
  errorMessage: string | null;
  rawAuditCount?: number;
}

export interface Website {
  id: string;
  displayName: string;
  url: string;
  domain: string;
  businessName: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  latestScans?: {
    mobile?: ScanResult | null;
    desktop?: ScanResult | null;
  };
}

export interface MetricComparison {
  currentValue: number;
  previousValue: number;
  diff: number;
  unit: string;
  improved: boolean;
}

export interface HistoricalComparison {
  previousScanId: string;
  previousScannedAt: string;
  scoreDelta: number | null;
  previousScore: number | null;
  metrics: {
    fcp?: MetricComparison;
    lcp?: MetricComparison;
    tbt?: MetricComparison;
    cls?: MetricComparison;
    speedIndex?: MetricComparison;
  };
}

export interface DashboardSummary {
  totalWebsites: number;
  totalScans: number;
  attentionNeededCount: number;
  averageScore: number | null;
  recentScans: ScanResult[];
}
