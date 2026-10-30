export interface LighthouseAuditItem {
  id: string;
  title: string;
  description?: string;
  score?: number | null;
  scoreDisplayMode?: string;
  numericValue?: number;
  numericUnit?: string;
  displayValue?: string;
  explanation?: string;
  details?: {
    type?: string;
    overallSavingsMs?: number;
    overallSavingsBytes?: number;
    items?: Record<string, unknown>[];
    headings?: unknown[];
    [key: string]: unknown;
  };
}

export interface GooglePageSpeedResponse {
  captchaResult?: string;
  kind?: string;
  id?: string;
  loadingExperience?: {
    id?: string;
    metrics?: Record<string, unknown>;
    overall_category?: string;
    initial_url?: string;
  };
  lighthouseResult: {
    requestedUrl: string;
    finalUrl?: string;
    finalDisplayedUrl?: string;
    lighthouseVersion: string;
    userAgent: string;
    fetchTime: string;
    environment?: {
      networkUserAgent?: string;
      hostUserAgent?: string;
      benchmarkIndex?: number;
    };
    categories: {
      performance?: {
        id: string;
        title: string;
        score: number | null; // 0 to 1
        description?: string;
      };
      [key: string]: unknown;
    };
    audits: Record<string, LighthouseAuditItem>;
  };
}
