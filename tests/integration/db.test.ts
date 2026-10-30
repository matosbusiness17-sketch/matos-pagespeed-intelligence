import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createInMemoryDb } from '@/lib/db';
import { Repository } from '@/lib/db/repository';
import type { Database as DatabaseType } from 'better-sqlite3';

describe('Repository & SQLite Integration', () => {
  let db: DatabaseType;
  let repo: Repository;

  beforeEach(() => {
    db = createInMemoryDb();
    repo = new Repository(db);
  });

  afterEach(() => {
    db.close();
  });

  it('creates and retrieves a website', () => {
    const site = repo.createWebsite({
      displayName: 'Matos Systems',
      url: 'https://matos.systems',
      domain: 'matos.systems',
      businessName: 'Matos Systems Ltd',
      notes: 'Main corporate portal',
    });

    expect(site.id).toBeDefined();
    expect(site.displayName).toBe('Matos Systems');

    const fetched = repo.getWebsiteById(site.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.domain).toBe('matos.systems');
    expect(fetched?.businessName).toBe('Matos Systems Ltd');
  });

  it('updates website details', () => {
    const site = repo.createWebsite({
      displayName: 'Old Name',
      url: 'https://example.com',
      domain: 'example.com',
    });

    const updated = repo.updateWebsite(site.id, {
      displayName: 'New Name',
      notes: 'Updated notes',
    });

    expect(updated?.displayName).toBe('New Name');
    expect(updated?.notes).toBe('Updated notes');
  });

  it('deletes website and sets website_id to null on associated scans', () => {
    const site = repo.createWebsite({
      displayName: 'To Delete',
      url: 'https://todelete.com',
      domain: 'todelete.com',
    });

    repo.saveScan({
      id: 'scan-1',
      websiteId: site.id,
      requestedUrl: 'https://todelete.com',
      resolvedUrl: 'https://todelete.com',
      strategy: 'mobile',
      status: 'completed',
      performanceScore: 85,
      metrics: null,
      diagnostics: [],
      lighthouseVersion: '12.0.0',
      userAgent: 'Mozilla',
      errorMessage: null,
      scannedAt: new Date().toISOString(),
    });

    const deleted = repo.deleteWebsite(site.id);
    expect(deleted).toBe(true);

    const scan = repo.getScanById('scan-1');
    expect(scan).not.toBeNull();
    expect(scan?.websiteId).toBeNull();
  });

  it('saves and retrieves scans with like-for-like previous scan matching', () => {
    const time1 = '2026-10-25T10:00:00.000Z';
    const time2 = '2026-10-26T10:00:00.000Z';
    const time3 = '2026-10-27T10:00:00.000Z';

    // Scan 1: mobile
    repo.saveScan({
      id: 'scan-m1',
      websiteId: null,
      requestedUrl: 'https://example.com',
      resolvedUrl: 'https://example.com',
      strategy: 'mobile',
      status: 'completed',
      performanceScore: 70,
      metrics: null,
      diagnostics: [],
      lighthouseVersion: '12.0.0',
      userAgent: null,
      errorMessage: null,
      scannedAt: time1,
    });

    // Scan 2: desktop (should not match mobile query)
    repo.saveScan({
      id: 'scan-d1',
      websiteId: null,
      requestedUrl: 'https://example.com',
      resolvedUrl: 'https://example.com',
      strategy: 'desktop',
      status: 'completed',
      performanceScore: 92,
      metrics: null,
      diagnostics: [],
      lighthouseVersion: '12.0.0',
      userAgent: null,
      errorMessage: null,
      scannedAt: time2,
    });

    // Scan 3: mobile
    repo.saveScan({
      id: 'scan-m2',
      websiteId: null,
      requestedUrl: 'https://example.com',
      resolvedUrl: 'https://example.com',
      strategy: 'mobile',
      status: 'completed',
      performanceScore: 78,
      metrics: null,
      diagnostics: [],
      lighthouseVersion: '12.0.0',
      userAgent: null,
      errorMessage: null,
      scannedAt: time3,
    });

    // Previous scan for scan-m2 (mobile) should be scan-m1, NOT scan-d1!
    const prevMobile = repo.getPreviousScan('https://example.com', 'mobile', 'scan-m2');
    expect(prevMobile).not.toBeNull();
    expect(prevMobile?.id).toBe('scan-m1');
    expect(prevMobile?.performanceScore).toBe(70);

    // Previous scan for scan-d1 (desktop) should be null (only 1 desktop scan)
    const prevDesktop = repo.getPreviousScan('https://example.com', 'desktop', 'scan-d1');
    expect(prevDesktop).toBeNull();
  });
});
