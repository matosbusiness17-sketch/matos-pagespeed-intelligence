/**
 * Live Google PageSpeed API Verification Script
 *
 * Runs real audits against public websites using Google's PageSpeed Insights API v5.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/verify-live-api.ts
 */

import { fetchPageSpeedAudit } from '../src/lib/pagespeed/client';
import { normalizePageSpeedResponse } from '../src/lib/pagespeed/normalizer';

const testUrls = ['https://example.com'];

async function runLiveVerification() {
  const apiKey = process.env.PAGESPEED_API_KEY?.trim();

  console.log('======================================================');
  console.log('MATOS PAGESPEED INTELLIGENCE — LIVE API VERIFICATION');
  console.log('======================================================\n');

  if (!apiKey || apiKey === 'your_google_pagespeed_api_key_here') {
    console.error('❌ PAGESPEED_API_KEY is not configured in .env.local.');
    console.log('Please populate PAGESPEED_API_KEY in .env.local through your IDE, then re-run:');
    console.log('   npm run verify:live\n');
    process.exit(1);
  }

  // Confirm key presence safely without revealing the credential
  const maskedKey = apiKey.length > 8 
    ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)} (${apiKey.length} characters)`
    : `[SET] (${apiKey.length} characters)`;
  console.log(`✓ Google API Key detected: ${maskedKey}`);
  console.log('✓ Starting real Google PageSpeed Insights v5 audits (Mock Mode: DISABLED)\n');

  let allSucceeded = true;

  for (const url of testUrls) {
    console.log(`Auditing target URL: ${url}`);
    console.log('──────────────────────────────────────────────────────');

    // 1. Mobile Scan
    console.log('1. Requesting Mobile Strategy from Google API...');
    try {
      const startTime = Date.now();
      const mobileRaw = await fetchPageSpeedAudit({ url, strategy: 'mobile', useMock: false });
      const mobileDuration = ((Date.now() - startTime) / 1000).toFixed(1);
      const mobileScan = normalizePageSpeedResponse(mobileRaw, url, 'mobile', 'live-test-m');

      // Verify that data is from genuine Google Lighthouse run
      if (!mobileRaw.lighthouseResult || !mobileScan.performanceScore) {
        throw new Error('Incomplete response received from Google API.');
      }

      console.log(`✓ Mobile audit succeeded in ${mobileDuration}s`);
      console.log(`  • Performance Score:      ${mobileScan.performanceScore}/100`);
      console.log(`  • First Contentful Paint:  ${mobileScan.metrics?.fcp.displayValue} (${mobileScan.metrics?.fcp.category})`);
      console.log(`  • Largest Contentful Paint:${mobileScan.metrics?.lcp.displayValue} (${mobileScan.metrics?.lcp.category})`);
      console.log(`  • Total Blocking Time:     ${mobileScan.metrics?.tbt.displayValue} (${mobileScan.metrics?.tbt.category})`);
      console.log(`  • Cumulative Layout Shift: ${mobileScan.metrics?.cls.displayValue} (${mobileScan.metrics?.cls.category})`);
      console.log(`  • Speed Index:             ${mobileScan.metrics?.speedIndex.displayValue} (${mobileScan.metrics?.speedIndex.category})`);
      console.log(`  • Diagnostics Extracted:   ${mobileScan.diagnostics.length} actionable opportunities`);
      console.log(`  • Resolved Final URL:      ${mobileScan.resolvedUrl}`);
      console.log(`  • Lighthouse Engine:       v${mobileScan.lighthouseVersion}`);
      console.log(`  • Google Fetch Time:       ${mobileRaw.lighthouseResult.fetchTime}`);
    } catch (err: unknown) {
      allSucceeded = false;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`✗ Mobile audit failed: ${msg}`);
    }

    // 2. Desktop Scan
    console.log('\n2. Requesting Desktop Strategy from Google API...');
    try {
      const startTime = Date.now();
      const desktopRaw = await fetchPageSpeedAudit({ url, strategy: 'desktop', useMock: false });
      const desktopDuration = ((Date.now() - startTime) / 1000).toFixed(1);
      const desktopScan = normalizePageSpeedResponse(desktopRaw, url, 'desktop', 'live-test-d');

      if (!desktopRaw.lighthouseResult || !desktopScan.performanceScore) {
        throw new Error('Incomplete response received from Google API.');
      }

      console.log(`✓ Desktop audit succeeded in ${desktopDuration}s`);
      console.log(`  • Performance Score:      ${desktopScan.performanceScore}/100`);
      console.log(`  • First Contentful Paint:  ${desktopScan.metrics?.fcp.displayValue} (${desktopScan.metrics?.fcp.category})`);
      console.log(`  • Largest Contentful Paint:${desktopScan.metrics?.lcp.displayValue} (${desktopScan.metrics?.lcp.category})`);
      console.log(`  • Total Blocking Time:     ${desktopScan.metrics?.tbt.displayValue} (${desktopScan.metrics?.tbt.category})`);
      console.log(`  • Cumulative Layout Shift: ${desktopScan.metrics?.cls.displayValue} (${desktopScan.metrics?.cls.category})`);
      console.log(`  • Speed Index:             ${desktopScan.metrics?.speedIndex.displayValue} (${desktopScan.metrics?.speedIndex.category})`);
      console.log(`  • Diagnostics Extracted:   ${desktopScan.diagnostics.length} actionable opportunities`);
      console.log(`  • Resolved Final URL:      ${desktopScan.resolvedUrl}`);
      console.log(`  • Lighthouse Engine:       v${desktopScan.lighthouseVersion}`);
      console.log(`  • Google Fetch Time:       ${desktopRaw.lighthouseResult.fetchTime}`);
    } catch (err: unknown) {
      allSucceeded = false;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`✗ Desktop audit failed: ${msg}`);
    }
  }

  console.log('\n======================================================');
  if (allSucceeded) {
    console.log('✅ LIVE VERIFICATION SUCCESSFUL: Both Mobile & Desktop audits completed with genuine Google PageSpeed Insights data.');
    console.log('======================================================');
    process.exit(0);
  } else {
    console.error('❌ LIVE VERIFICATION FAILED: One or more audit strategies failed.');
    console.log('======================================================');
    process.exit(1);
  }
}

runLiveVerification();
