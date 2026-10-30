/**
 * Live Google PageSpeed API Verification Script
 *
 * Usage:
 *   node --env-file=.env.local scripts/verify-live-api.mjs
 */

import { fetchPageSpeedAudit } from '../src/lib/pagespeed/client.js';
import { normalizePageSpeedResponse } from '../src/lib/pagespeed/normalizer.js';

const testUrls = ['https://example.com'];

async function runLiveVerification() {
  const apiKey = process.env.PAGESPEED_API_KEY?.trim();

  console.log('======================================================');
  console.log('MATOS PAGESPEED INTELLIGENCE — LIVE API VERIFICATION');
  console.log('======================================================\n');

  if (!apiKey || apiKey === 'your_google_pagespeed_api_key_here') {
    console.warn('⚠️  PAGESPEED_API_KEY is not configured in .env.local.');
    console.log('Please populate PAGESPEED_API_KEY in .env.local through your IDE, then re-run:');
    console.log('   node --env-file=.env.local scripts/verify-live-api.mjs\n');
    process.exit(1);
  }

  console.log('✓ Found configured PAGESPEED_API_KEY (length: ' + apiKey.length + ' chars)');

  for (const url of testUrls) {
    console.log(`\n--- Auditing ${url} ---`);

    // 1. Mobile Scan
    console.log('1. Executing Mobile scan...');
    try {
      const startTime = Date.now();
      const mobileRaw = await fetchPageSpeedAudit({ url, strategy: 'mobile', useMock: false });
      const mobileDuration = ((Date.now() - startTime) / 1000).toFixed(1);
      const mobileScan = normalizePageSpeedResponse(mobileRaw, url, 'mobile', 'live-test-m');

      console.log(`✓ Mobile scan completed in ${mobileDuration}s`);
      console.log(`  - Performance Score: ${mobileScan.performanceScore}/100`);
      console.log(`  - FCP: ${mobileScan.metrics?.fcp.displayValue} (${mobileScan.metrics?.fcp.category})`);
      console.log(`  - LCP: ${mobileScan.metrics?.lcp.displayValue} (${mobileScan.metrics?.lcp.category})`);
      console.log(`  - TBT: ${mobileScan.metrics?.tbt.displayValue} (${mobileScan.metrics?.tbt.category})`);
      console.log(`  - CLS: ${mobileScan.metrics?.cls.displayValue} (${mobileScan.metrics?.cls.category})`);
      console.log(`  - Speed Index: ${mobileScan.metrics?.speedIndex.displayValue}`);
      console.log(`  - Diagnostics Extracted: ${mobileScan.diagnostics.length} opportunities`);
      console.log(`  - Lighthouse Engine: v${mobileScan.lighthouseVersion}`);
    } catch (err) {
      console.error(`✗ Mobile scan failed:`, err.message);
    }

    // 2. Desktop Scan
    console.log('\n2. Executing Desktop scan...');
    try {
      const startTime = Date.now();
      const desktopRaw = await fetchPageSpeedAudit({ url, strategy: 'desktop', useMock: false });
      const desktopDuration = ((Date.now() - startTime) / 1000).toFixed(1);
      const desktopScan = normalizePageSpeedResponse(desktopRaw, url, 'desktop', 'live-test-d');

      console.log(`✓ Desktop scan completed in ${desktopDuration}s`);
      console.log(`  - Performance Score: ${desktopScan.performanceScore}/100`);
      console.log(`  - FCP: ${desktopScan.metrics?.fcp.displayValue} (${desktopScan.metrics?.fcp.category})`);
      console.log(`  - LCP: ${desktopScan.metrics?.lcp.displayValue} (${desktopScan.metrics?.lcp.category})`);
      console.log(`  - TBT: ${desktopScan.metrics?.tbt.displayValue} (${desktopScan.metrics?.tbt.category})`);
      console.log(`  - CLS: ${desktopScan.metrics?.cls.displayValue} (${desktopScan.metrics?.cls.category})`);
      console.log(`  - Speed Index: ${desktopScan.metrics?.speedIndex.displayValue}`);
      console.log(`  - Diagnostics Extracted: ${desktopScan.diagnostics.length} opportunities`);
      console.log(`  - Lighthouse Engine: v${desktopScan.lighthouseVersion}`);
    } catch (err) {
      console.error(`✗ Desktop scan failed:`, err.message);
    }
  }

  console.log('\n======================================================');
  console.log('LIVE VERIFICATION RUN COMPLETE');
  console.log('======================================================');
}

runLiveVerification();
