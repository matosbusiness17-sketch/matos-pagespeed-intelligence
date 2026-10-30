# Future Product & Technical Roadmap — Matos PageSpeed Intelligence

This document outlines planned future enhancements for **Matos PageSpeed Intelligence** as it evolves into an enterprise-grade performance intelligence service within the Matos Systems ecosystem.

---

## 1. Automated Scheduled Monitoring & Background Cron

### Proposed Scope
- **Configurable Cadence**: Allow users to set audit intervals (daily, bi-weekly, weekly) per tracked website.
- **Background Worker**: A lightweight worker process executing scheduled jobs sequentially to avoid hitting Google Cloud rate limits.
- **Alert Triggers**: Webhook notifications triggered when a tracked domain experiences a performance drop exceeding 10 points or a Core Web Vital transitions from "Good" to "Poor".

---

## 2. Executive Weekly Digests & Outreach Reports

### Proposed Scope
- **Email & Slack Summaries**: Automated weekly email digests summarizing performance changes across all tracked client domains.
- **Client-Facing PDF Exports**: Generation of clean, branded 1-page PDF executive summaries featuring:
  - Mobile vs Desktop comparison cards.
  - Core Web Vitals health score.
  - Top 3 critical performance bottlenecks with estimated user experience impact.
  - Clear remediation roadmap.

---

## 3. Matos Sales Intelligence Agent Integration

### Proposed Scope
- **Prospect Discovery & Enrichment**: When the Matos Sales Intelligence Agent identifies potential leads, it automatically triggers a background audit via `POST /api/v1/scans`.
- **Qualification Criteria**: Prospects with mobile performance scores below 50 are automatically tagged as "High Technical Value" opportunities.
- **Automated Opportunity Extraction**: The sales agent extracts concrete evidence (e.g. "Page takes 4.2s to render due to 1.8MB uncompressed hero assets") to provide genuine technical value during initial outreach.

---

## 4. Matos CopyCheck Integration

### Proposed Scope
- **Outreach Fact-Checking & QA**: When an outreach email or proposal mentions website speed or performance issues, **Matos CopyCheck** queries `GET /api/v1/scans` to verify technical claims against genuine Lighthouse audit records.
- **Claim Grounding**: Flags and rejects exaggerated claims (e.g., claiming a site has slow server response when Lighthouse reports TTFB of 120ms).
- **Evidence Insertion**: Injects verified metrics (such as exact LCP and render-blocking millisecond savings) directly into outreach drafts.

---

## 5. Self-Hosted n8n Workflow Orchestration

### Proposed Scope
- **Ready-to-Import Workflow Templates**: Provide standard n8n JSON workflow definitions for:
  1. *Daily Health Monitor*: Reads all tracked websites from `GET /api/v1/websites`, triggers sequential scans via `POST /api/v1/scans`, and posts performance drops to Discord/Slack.
  2. *Cold Outreach Pipeline*: Accepts incoming lead domains from Google Sheets or CRM, executes PageSpeed audits, and stores structured diagnostics for the sales agent.
- **Direct Webhook Handlers**: Add an incoming webhook route in Matos PageSpeed Intelligence for headless external triggers.

---

## 6. Real-User Performance Metrics (CrUX API)

### Proposed Scope
- **Separated CrUX Client**: While Google is deprecating CrUX data from PageSpeed API v5 responses, Google maintains a dedicated *Chrome UX Report (CrUX) API*.
- **Field vs Lab Side-by-Side View**: A future dedicated module to query CrUX field metrics (real user 75th percentile Interaction to Next Paint - INP, Cumulative Layout Shift - CLS, and Largest Contentful Paint - LCP) for high-traffic websites that meet Google's eligibility thresholds.
- **Field Data Eligibility Check**: Gracefully display "Insufficient field traffic data" for smaller domains without breaking lab reports.
