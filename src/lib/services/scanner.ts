import { randomUUID } from 'node:crypto';
import type { ScanResult, ScanStrategy, HistoricalComparison } from '@/types';
import { validateAndNormalizeUrl } from '@/lib/validation/url';
import { fetchPageSpeedAudit } from '@/lib/pagespeed/client';
import { normalizePageSpeedResponse } from '@/lib/pagespeed/normalizer';
import { getRepository, Repository } from '@/lib/db/repository';
import { computeHistoricalComparison } from './comparison';

// In-flight concurrency lock to prevent duplicate simultaneous scans for same URL and strategy
const activeScanLocks = new Set<string>();

export interface ExecuteScanOptions {
  url: string;
  strategy: ScanStrategy;
  websiteId?: string | null;
  useMock?: boolean;
}

export interface ScanExecutionOutcome {
  scan: ScanResult;
  comparison: HistoricalComparison | null;
}

export class ScanOrchestrator {
  constructor(private repo: Repository = getRepository()) {}

  /**
   * Executes a single performance scan (mobile or desktop).
   */
  async executeScan(options: ExecuteScanOptions): Promise<ScanExecutionOutcome> {
    const { url, strategy, websiteId, useMock } = options;

    // 1. Validate and normalize URL
    const urlValidation = validateAndNormalizeUrl(url);
    if (!urlValidation.valid || !urlValidation.normalizedUrl) {
      throw new Error(urlValidation.error || 'Invalid destination URL.');
    }

    const normalizedUrl = urlValidation.normalizedUrl;
    const lockKey = `${normalizedUrl}:${strategy}`;

    // 2. Prevent duplicate concurrent scans for same URL & strategy
    if (activeScanLocks.has(lockKey)) {
      throw new Error(`A scan for ${normalizedUrl} (${strategy}) is already running. Please wait for it to complete.`);
    }

    activeScanLocks.add(lockKey);

    // 3. Resolve website association
    let targetWebsiteId = websiteId || null;
    if (!targetWebsiteId) {
      let existing = this.repo.findWebsiteByUrl(normalizedUrl);
      if (!existing && urlValidation.domain) {
        existing = this.repo.findWebsiteByDomain(urlValidation.domain);
      }
      if (!existing) {
        const domain = urlValidation.domain || new URL(normalizedUrl).hostname;
        existing = this.repo.createWebsite({
          displayName: domain,
          url: normalizedUrl,
          domain,
          notes: 'Added via quick performance audit',
        });
      }
      targetWebsiteId = existing.id;
    }

    const scanId = randomUUID();

    try {
      // 4. Request PageSpeed audit
      const rawResponse = await fetchPageSpeedAudit({
        url: normalizedUrl,
        strategy,
        useMock,
      });

      // 5. Normalize response
      const scanResult = normalizePageSpeedResponse(
        rawResponse,
        normalizedUrl,
        strategy,
        scanId,
        targetWebsiteId
      );

      // 6. Find previous like-for-like completed scan
      const previousScan = this.repo.getPreviousScan(normalizedUrl, strategy, scanId);
      const comparison = computeHistoricalComparison(scanResult, previousScan);

      // 7. Persist to SQLite
      this.repo.saveScan(scanResult);

      return { scan: scanResult, comparison };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown scan error';

      // Persist failed scan record for traceability
      const failedScan: ScanResult = {
        id: scanId,
        websiteId: targetWebsiteId,
        requestedUrl: normalizedUrl,
        resolvedUrl: normalizedUrl,
        strategy,
        status: 'failed',
        performanceScore: null,
        metrics: null,
        diagnostics: [],
        lighthouseVersion: null,
        userAgent: null,
        errorMessage,
        scannedAt: new Date().toISOString(),
      };

      this.repo.saveScan(failedScan);
      throw err;
    } finally {
      activeScanLocks.delete(lockKey);
    }
  }

  /**
   * Executes mobile and desktop scans sequentially.
   */
  async executeBothScans(
    url: string,
    websiteId?: string | null,
    useMock?: boolean
  ): Promise<{ mobile: ScanExecutionOutcome; desktop: ScanExecutionOutcome }> {
    const mobile = await this.executeScan({ url, strategy: 'mobile', websiteId, useMock });
    const desktop = await this.executeScan({ url, strategy: 'desktop', websiteId, useMock });
    return { mobile, desktop };
  }
}

let orchestratorInstance: ScanOrchestrator | null = null;

export function getScanOrchestrator(): ScanOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new ScanOrchestrator();
  }
  return orchestratorInstance;
}
