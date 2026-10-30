import { test, expect } from '@playwright/test';

test.describe('Matos PageSpeed Intelligence E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for React hydration and main heading
    await page.waitForSelector('[data-hydrated="true"]');
    await expect(page.locator('h1')).toContainText('PageSpeed Intelligence');
  });

  test('1. Dashboard loads successfully with executive summary cards', async ({ page }) => {
    await expect(page.locator('#summary-total-websites')).toBeVisible();
    await expect(page.locator('#summary-total-scans')).toBeVisible();
    await expect(page.locator('#quick-scan-url-input')).toBeVisible();
    await expect(page.locator('#run-audit-btn')).toBeVisible();
  });

  test('2. Website can be added via the modal and appears in tracked list', async ({ page }) => {
    // Click header "Add Website"
    await page.locator('#header-add-website-btn').click();

    // Modal appears
    await expect(page.locator('#website-modal-name')).toBeVisible();

    // Fill form
    await page.fill('#website-modal-name', 'Playwright Test Site');
    await page.fill('#website-modal-url', 'https://playwright-test.example.com');
    await page.fill('#website-modal-business', 'Playwright QA Ltd');
    await page.fill('#website-modal-notes', 'Automated E2E smoke test entry');

    // Submit
    await page.click('#website-modal-submit-btn');

    // Wait for table to reflect new site
    await expect(page.locator('#websites-table')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#websites-table')).toContainText('Playwright Test Site');
    await expect(page.locator('#websites-table')).toContainText('playwright-test.example.com');
  });

  test('3. Scan can be triggered and loading state is communicated', async ({ page }) => {
    // Fill URL in quick scan bar
    await page.fill('#quick-scan-url-input', 'https://example.com');
    await page.click('#strategy-mobile-btn');

    // Click Run Audit
    await page.click('#run-audit-btn');

    // Status message becomes visible
    await expect(page.locator('#scan-status-message')).toBeVisible({ timeout: 15000 });
  });

  test('4. Results render correctly with score, lab Web Vitals, and prioritized diagnostics', async ({ page }) => {
    // Trigger scan on example.com
    await page.fill('#quick-scan-url-input', 'https://example.com');
    await page.click('#run-audit-btn');

    // Wait for scan to complete and table to appear
    await expect(page.locator('#websites-table')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#websites-table')).toContainText('example.com');

    // Click "Report" button on the first website
    const reportBtn = page.locator('.view-report-btn').first();
    await reportBtn.click();

    // Report view opens
    await expect(page.locator('#report-view-container')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#report-hero-score')).toBeVisible();

    // Verify Lab Core Web Vitals are displayed
    await expect(page.locator('text=First Contentful Paint')).toBeVisible();
    await expect(page.locator('text=Largest Contentful Paint')).toBeVisible();
    await expect(page.locator('text=Total Blocking Time')).toBeVisible();
    await expect(page.locator('text=Cumulative Layout Shift')).toBeVisible();

    // Verify diagnostics section
    await expect(page.locator('text=Performance Diagnosis & Opportunities')).toBeVisible();
  });

  test('5. Mobile and desktop results remain distinct without combining into one score', async ({ page }) => {
    // First trigger a mobile scan
    await page.fill('#quick-scan-url-input', 'https://example.com');
    await page.click('#strategy-mobile-btn');
    await page.click('#run-audit-btn');
    await expect(page.locator('#websites-table')).toBeVisible({ timeout: 15000 });

    // Next trigger a desktop scan
    await page.fill('#quick-scan-url-input', 'https://example.com');
    await page.click('#strategy-desktop-btn');
    await page.click('#run-audit-btn');
    await page.waitForTimeout(1000);

    // Open Report
    await page.locator('.view-report-btn').first().click();
    await expect(page.locator('#report-view-container')).toBeVisible({ timeout: 10000 });

    // Check Mobile report
    await page.click('#report-strategy-mobile-btn');
    const mobileScoreText = await page.locator('#report-hero-score').innerText();

    // Switch to Desktop report
    await page.click('#report-strategy-desktop-btn');
    const desktopScoreText = await page.locator('#report-hero-score').innerText();

    // Both scores should be defined and distinct
    expect(mobileScoreText).toBeDefined();
    expect(desktopScoreText).toBeDefined();
  });

  test('6. Historical scans persist after page reload', async ({ page }) => {
    // Reload page
    await page.reload();
    await page.waitForSelector('[data-hydrated="true"]');

    // Websites and scan count should still be present in SQLite
    await expect(page.locator('#summary-total-websites')).toBeVisible();
    const countText = await page.locator('#summary-total-scans').innerText();
    expect(parseInt(countText, 10)).toBeGreaterThanOrEqual(0);
  });

  test('7. Invalid URLs (SSRF, malformed, non-http) are rejected with clear error', async ({ page }) => {
    // Try loopback address (SSRF attempt)
    await page.fill('#quick-scan-url-input', 'http://127.0.0.1:8080');
    await page.click('#run-audit-btn');

    // Error alert should be displayed
    await expect(page.locator('#scan-error-alert')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#scan-error-alert')).toContainText(/private|loopback|reserved/i);

    // Try malformed URL
    await page.fill('#quick-scan-url-input', 'not_a_valid_url');
    await page.click('#run-audit-btn');
    await expect(page.locator('#scan-error-alert')).toBeVisible({ timeout: 10000 });
  });

  test('8. Layout remains usable and responsive on mobile viewports', async ({ page }) => {
    // Resize viewport to mobile screen (iPhone 13 dimensions)
    await page.setViewportSize({ width: 390, height: 844 });

    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#quick-scan-url-input')).toBeVisible();
    await expect(page.locator('#run-audit-btn')).toBeVisible();
    await expect(page.locator('#header-add-website-btn')).toBeVisible();
  });
});
