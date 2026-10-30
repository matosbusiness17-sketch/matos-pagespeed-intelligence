import { randomUUID } from 'node:crypto';
import type { Database as DatabaseType } from 'better-sqlite3';
import { getDb } from './index';
import type {
  Website,
  ScanResult,
  ScanStrategy,
  ScanStatus,
  ScanMetrics,
  DiagnosticRecommendation,
  DashboardSummary,
} from '@/types';

interface WebsiteRow {
  id: string;
  display_name: string;
  url: string;
  domain: string;
  business_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface ScanRow {
  id: string;
  website_id: string | null;
  requested_url: string;
  resolved_url: string;
  strategy: string;
  status: string;
  performance_score: number | null;
  metrics_json: string | null;
  diagnostics_json: string | null;
  lighthouse_version: string | null;
  user_agent: string | null;
  error_message: string | null;
  scanned_at: string;
}

function mapWebsiteRow(row: WebsiteRow): Website {
  return {
    id: row.id,
    displayName: row.display_name,
    url: row.url,
    domain: row.domain,
    businessName: row.business_name,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapScanRow(row: ScanRow): ScanResult {
  let metrics: ScanMetrics | null = null;
  if (row.metrics_json) {
    try {
      metrics = JSON.parse(row.metrics_json) as ScanMetrics;
    } catch {
      metrics = null;
    }
  }

  let diagnostics: DiagnosticRecommendation[] = [];
  if (row.diagnostics_json) {
    try {
      diagnostics = JSON.parse(row.diagnostics_json) as DiagnosticRecommendation[];
    } catch {
      diagnostics = [];
    }
  }

  return {
    id: row.id,
    websiteId: row.website_id,
    requestedUrl: row.requested_url,
    resolvedUrl: row.resolved_url,
    strategy: row.strategy as ScanStrategy,
    status: row.status as ScanStatus,
    performanceScore: row.performance_score,
    metrics,
    diagnostics,
    lighthouseVersion: row.lighthouse_version,
    userAgent: row.user_agent,
    errorMessage: row.error_message,
    scannedAt: row.scanned_at,
  };
}

export class Repository {
  constructor(private db: DatabaseType = getDb()) {}

  // ================= Websites =================

  createWebsite(data: {
    displayName: string;
    url: string;
    domain: string;
    businessName?: string | null;
    notes?: string | null;
  }): Website {
    const id = randomUUID();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO websites (id, display_name, url, domain, business_name, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.displayName.trim(),
      data.url.trim(),
      data.domain.trim(),
      data.businessName ? data.businessName.trim() : null,
      data.notes ? data.notes.trim() : null,
      now,
      now
    );

    return {
      id,
      displayName: data.displayName.trim(),
      url: data.url.trim(),
      domain: data.domain.trim(),
      businessName: data.businessName ? data.businessName.trim() : null,
      notes: data.notes ? data.notes.trim() : null,
      createdAt: now,
      updatedAt: now,
    };
  }

  getWebsites(): Website[] {
    const stmt = this.db.prepare('SELECT * FROM websites ORDER BY created_at DESC');
    const rows = stmt.all() as WebsiteRow[];
    const websites = rows.map(mapWebsiteRow);

    // Attach latest mobile and desktop scans for each website
    for (const site of websites) {
      site.latestScans = {
        mobile: this.getLatestScanForWebsite(site.id, 'mobile'),
        desktop: this.getLatestScanForWebsite(site.id, 'desktop'),
      };
    }

    return websites;
  }

  getWebsiteById(id: string): Website | null {
    const stmt = this.db.prepare('SELECT * FROM websites WHERE id = ?');
    const row = stmt.get(id) as WebsiteRow | undefined;
    if (!row) return null;

    const site = mapWebsiteRow(row);
    site.latestScans = {
      mobile: this.getLatestScanForWebsite(site.id, 'mobile'),
      desktop: this.getLatestScanForWebsite(site.id, 'desktop'),
    };
    return site;
  }

  findWebsiteByUrl(url: string): Website | null {
    const stmt = this.db.prepare('SELECT * FROM websites WHERE url = ? LIMIT 1');
    const row = stmt.get(url) as WebsiteRow | undefined;
    return row ? mapWebsiteRow(row) : null;
  }

  findWebsiteByDomain(domain: string): Website | null {
    const stmt = this.db.prepare('SELECT * FROM websites WHERE domain = ? LIMIT 1');
    const row = stmt.get(domain) as WebsiteRow | undefined;
    return row ? mapWebsiteRow(row) : null;
  }

  updateWebsite(
    id: string,
    data: {
      displayName?: string;
      businessName?: string | null;
      notes?: string | null;
    }
  ): Website | null {
    const current = this.getWebsiteById(id);
    if (!current) return null;

    const now = new Date().toISOString();
    const displayName = data.displayName !== undefined ? data.displayName.trim() : current.displayName;
    const businessName = data.businessName !== undefined ? (data.businessName ? data.businessName.trim() : null) : current.businessName;
    const notes = data.notes !== undefined ? (data.notes ? data.notes.trim() : null) : current.notes;

    const stmt = this.db.prepare(`
      UPDATE websites
      SET display_name = ?, business_name = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(displayName, businessName, notes, now, id);

    return this.getWebsiteById(id);
  }

  deleteWebsite(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM websites WHERE id = ?');
    const res = stmt.run(id);
    return res.changes > 0;
  }

  // ================= Scans =================

  saveScan(scan: ScanResult): ScanResult {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO scans (
        id, website_id, requested_url, resolved_url, strategy, status,
        performance_score, metrics_json, diagnostics_json,
        lighthouse_version, user_agent, error_message, scanned_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      scan.id,
      scan.websiteId ?? null,
      scan.requestedUrl,
      scan.resolvedUrl,
      scan.strategy,
      scan.status,
      scan.performanceScore,
      scan.metrics ? JSON.stringify(scan.metrics) : null,
      scan.diagnostics ? JSON.stringify(scan.diagnostics) : null,
      scan.lighthouseVersion ?? null,
      scan.userAgent ?? null,
      scan.errorMessage ?? null,
      scan.scannedAt
    );

    return scan;
  }

  getScanById(id: string): ScanResult | null {
    const stmt = this.db.prepare('SELECT * FROM scans WHERE id = ?');
    const row = stmt.get(id) as ScanRow | undefined;
    return row ? mapScanRow(row) : null;
  }

  getLatestScanForWebsite(websiteId: string, strategy: ScanStrategy): ScanResult | null {
    const stmt = this.db.prepare(`
      SELECT * FROM scans
      WHERE website_id = ? AND strategy = ? AND status = 'completed'
      ORDER BY scanned_at DESC
      LIMIT 1
    `);
    const row = stmt.get(websiteId, strategy) as ScanRow | undefined;
    return row ? mapScanRow(row) : null;
  }

  getScans(options: {
    websiteId?: string;
    requestedUrl?: string;
    strategy?: ScanStrategy;
    limit?: number;
    offset?: number;
  } = {}): ScanResult[] {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (options.websiteId) {
      conditions.push('website_id = ?');
      params.push(options.websiteId);
    }
    if (options.requestedUrl) {
      conditions.push('requested_url = ?');
      params.push(options.requestedUrl);
    }
    if (options.strategy) {
      conditions.push('strategy = ?');
      params.push(options.strategy);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = options.limit ?? 50;
    const offset = options.offset ?? 0;

    const stmt = this.db.prepare(`
      SELECT * FROM scans
      ${whereClause}
      ORDER BY scanned_at DESC
      LIMIT ? OFFSET ?
    `);

    const rows = stmt.all(...params, limit, offset) as ScanRow[];
    return rows.map(mapScanRow);
  }

  /**
   * Retrieves the most recent prior successful scan for the exact same normalized URL and strategy,
   * excluding the current scan if provided.
   */
  getPreviousScan(requestedUrl: string, strategy: ScanStrategy, currentScanId?: string): ScanResult | null {
    let query = `
      SELECT * FROM scans
      WHERE requested_url = ? AND strategy = ? AND status = 'completed'
    `;
    const params: string[] = [requestedUrl, strategy];

    if (currentScanId) {
      query += ` AND id != ? `;
      params.push(currentScanId);
    }

    query += ` ORDER BY scanned_at DESC LIMIT 1 `;

    const stmt = this.db.prepare(query);
    const row = stmt.get(...params) as ScanRow | undefined;
    return row ? mapScanRow(row) : null;
  }

  getDashboardSummary(): DashboardSummary {
    const websitesCountRow = this.db.prepare('SELECT COUNT(*) as count FROM websites').get() as { count: number };
    const totalScansRow = this.db.prepare('SELECT COUNT(*) as count FROM scans').get() as { count: number };

    // Websites needing attention: latest completed mobile scan score < 60 or latest completed desktop scan score < 70
    const websites = this.getWebsites();
    let attentionCount = 0;
    let totalScoreSum = 0;
    let totalScoredCount = 0;

    for (const site of websites) {
      const mobileScore = site.latestScans?.mobile?.performanceScore;
      const desktopScore = site.latestScans?.desktop?.performanceScore;

      let siteNeedsAttention = false;
      if (typeof mobileScore === 'number') {
        totalScoreSum += mobileScore;
        totalScoredCount++;
        if (mobileScore < 60) siteNeedsAttention = true;
      }
      if (typeof desktopScore === 'number') {
        totalScoreSum += desktopScore;
        totalScoredCount++;
        if (desktopScore < 60) siteNeedsAttention = true;
      }

      if (siteNeedsAttention) {
        attentionCount++;
      }
    }

    const avgScore = totalScoredCount > 0 ? Math.round(totalScoreSum / totalScoredCount) : null;
    const recentScans = this.getScans({ limit: 10 });

    return {
      totalWebsites: websitesCountRow.count,
      totalScans: totalScansRow.count,
      attentionNeededCount: attentionCount,
      averageScore: avgScore,
      recentScans,
    };
  }
}

let repositoryInstance: Repository | null = null;

export function getRepository(): Repository {
  if (!repositoryInstance) {
    repositoryInstance = new Repository();
  }
  return repositoryInstance;
}
