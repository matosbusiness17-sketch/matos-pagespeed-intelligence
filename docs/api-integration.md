# Automation API & Integration Guide — Matos PageSpeed Intelligence

## 1. Overview

**Matos PageSpeed Intelligence** exposes a versioned, automation-ready REST API at `/api/v1/*` designed for integration with:
- **Self-hosted n8n workflows** (scheduled audits, slack notifications, weekly client summaries).
- **Matos Sales Intelligence Agent** (prospect discovery, tech stack qualification, and performance scoring).
- **Matos CopyCheck** (outreach personalization with verifiable performance diagnostics).
- **CI/CD Quality Assurance pipelines**.

---

## 2. Authentication

All `/api/v1/*` endpoints require HTTP Bearer Token authentication.

### Header Requirement
```http
Authorization: Bearer <MATOS_INTERNAL_API_TOKEN>
```

Configure `MATOS_INTERNAL_API_TOKEN` in `.env.local`:
```bash
MATOS_INTERNAL_API_TOKEN=your_secure_internal_token_here
```

Unauthenticated requests or requests with an invalid token receive HTTP `401 Unauthorized`:
```json
{
  "error": "Missing or invalid Authorization header. Expected 'Bearer <token>'.",
  "code": "UNAUTHORIZED"
}
```

---

## 3. Endpoints Reference

### 3.1 POST `/api/v1/scans`
Initiates a performance audit for a destination website URL.

#### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `url` | string | **Yes** | Destination web URL (e.g. `https://example.com`). Automatically validated and normalized. |
| `strategy` | string | No | `'mobile'` (default), `'desktop'`, or `'both'`. |
| `websiteId` | string | No | Optional UUID of an existing tracked website to associate this scan with. |
| `useMock` | boolean | No | If `true`, returns mock test fixture without contacting Google API (useful for testing). |

#### Example Request (Single Strategy)
```bash
curl -X POST http://localhost:3000/api/v1/scans \
  -H "Authorization: Bearer your_secure_internal_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "strategy": "mobile"
  }'
```

#### Example Response (HTTP 201 Created)
```json
{
  "success": true,
  "scan": {
    "id": "1d2e998e-420a-48d8-99b3-4fe65f6f69ad",
    "websiteId": "d3b07384-d113-460f-bb64-c5cb86b7235b",
    "requestedUrl": "https://example.com",
    "resolvedUrl": "https://example.com/",
    "strategy": "mobile",
    "status": "completed",
    "performanceScore": 78,
    "metrics": {
      "fcp": {
        "id": "fcp",
        "name": "First Contentful Paint",
        "displayValue": "1.8 s",
        "numericValue": 1820,
        "unit": "ms",
        "score": 0.85,
        "category": "needs-improvement",
        "description": "Marks the time at which the first text or image is painted in the viewport during simulated lab testing.",
        "isLaboratory": true
      },
      "lcp": {
        "id": "lcp",
        "name": "Largest Contentful Paint",
        "displayValue": "3.1 s",
        "numericValue": 3100,
        "unit": "ms",
        "score": 0.72,
        "category": "needs-improvement",
        "description": "Marks the time at which the largest text block or image element is rendered during simulated lab testing.",
        "isLaboratory": true
      },
      "tbt": {
        "id": "tbt",
        "name": "Total Blocking Time",
        "displayValue": "340 ms",
        "numericValue": 340,
        "unit": "ms",
        "score": 0.65,
        "category": "needs-improvement",
        "description": "Sum of all time periods between FCP and Time to Interactive when task duration exceeded 50ms.",
        "isLaboratory": true
      },
      "cls": {
        "id": "cls",
        "name": "Cumulative Layout Shift",
        "displayValue": "0.045",
        "numericValue": 0.045,
        "unit": "unitless",
        "score": 0.95,
        "category": "good",
        "description": "Measures unexpected movement of visible elements within the viewport during page lifecycle.",
        "isLaboratory": true
      },
      "speedIndex": {
        "id": "speed-index",
        "name": "Speed Index",
        "displayValue": "2.4 s",
        "numericValue": 2400,
        "unit": "ms",
        "score": 0.8,
        "category": "good",
        "description": "Shows how quickly the contents of a page are visibly populated during simulated loading.",
        "isLaboratory": true
      }
    },
    "diagnostics": [
      {
        "id": "render-blocking-resources",
        "title": "Eliminate render-blocking resources",
        "description": "Resources are blocking the first paint of your page.",
        "displayValue": "Potential savings of 480 ms",
        "estimatedSavingsMs": 480,
        "estimatedSavingsBytes": 45000,
        "priority": "high",
        "suggestedAction": "Eliminate render-blocking styles and scripts by inlining critical CSS and deferring non-critical scripts."
      }
    ],
    "lighthouseVersion": "12.2.1",
    "userAgent": "Mozilla/5.0 (Linux; Android 11; moto g power (2022))...",
    "scannedAt": "2026-10-30T16:00:00.000Z",
    "errorMessage": null,
    "rawAuditCount": 42
  },
  "comparison": {
    "previousScanId": "0a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d",
    "previousScannedAt": "2026-10-25T10:00:00.000Z",
    "scoreDelta": 8,
    "previousScore": 70,
    "metrics": {
      "fcp": { "currentValue": 1820, "previousValue": 2200, "diff": -380, "unit": "ms", "improved": true },
      "lcp": { "currentValue": 3100, "previousValue": 3600, "diff": -500, "unit": "ms", "improved": true }
    }
  }
}
```

---

### 3.2 GET `/api/v1/scans`
Retrieves a filtered, paginated list of historical audits.

#### Query Parameters
- `url` (optional): Filter by exact normalized requested URL.
- `websiteId` (optional): Filter by associated website ID.
- `strategy` (optional): `'mobile'` or `'desktop'`.
- `limit` (optional): Max results (default `50`, max `100`).
- `offset` (optional): Pagination offset (default `0`).

#### Example Request
```bash
curl -X GET "http://localhost:3000/api/v1/scans?strategy=mobile&limit=10" \
  -H "Authorization: Bearer your_secure_internal_token_here"
```

#### Example Response
```json
{
  "success": true,
  "count": 1,
  "scans": [
    {
      "id": "1d2e998e-420a-48d8-99b3-4fe65f6f69ad",
      "requestedUrl": "https://example.com",
      "strategy": "mobile",
      "status": "completed",
      "performanceScore": 78,
      "scannedAt": "2026-10-30T16:00:00.000Z"
    }
  ]
}
```

---

### 3.3 GET `/api/v1/scans/:id`
Retrieves full details of a specific audit by ID, including its historical comparison against the prior scan for the same URL and strategy.

#### Example Request
```bash
curl -X GET "http://localhost:3000/api/v1/scans/1d2e998e-420a-48d8-99b3-4fe65f6f69ad" \
  -H "Authorization: Bearer your_secure_internal_token_here"
```

---

### 3.4 Website Management Endpoints
- `GET /api/v1/websites` — Lists all tracked websites with latest mobile and desktop scores.
- `POST /api/v1/websites` — Creates a tracked website (`displayName`, `url`, optional `businessName`, `notes`).
- `GET /api/v1/websites/:id` — Retrieves a tracked website with its recent scan history.
- `PATCH /api/v1/websites/:id` — Updates website metadata (`displayName`, `businessName`, `notes`).
- `DELETE /api/v1/websites/:id` — Removes website while preserving historical scan records (`ON DELETE SET NULL`).

---

## 4. n8n Workflow Integration Guide

### Step 1: Add HTTP Request Node
In your n8n workflow canvas:
1. Insert an **HTTP Request** node.
2. Set **Method** to `POST`.
3. Set **URL** to: `http://localhost:3000/api/v1/scans` (or your internal container hostname).

### Step 2: Configure Header Authentication
1. In **Send Headers**, add:
   - Name: `Authorization`
   - Value: `Bearer {{ $env.MATOS_INTERNAL_API_TOKEN }}`
2. Add header:
   - Name: `Content-Type`
   - Value: `application/json`

### Step 3: Configure JSON Payload
Under **Body Parameters** (JSON):
```json
{
  "url": "={{ $json.websiteUrl }}",
  "strategy": "both"
}
```

### Step 4: Handle Response
Google Lighthouse audits take between 15 to 35 seconds to evaluate a site. Configure the n8n HTTP Request node **Timeout** to `60000` (60 seconds) to prevent premature timeout before Google completes the audit.

Response data is directly accessible downstream in n8n expressions:
- `{{ $json.scans.mobile.performanceScore }}` — Mobile performance score.
- `{{ $json.scans.mobile.metrics.lcp.displayValue }}` — Largest Contentful Paint.
- `{{ $json.scans.mobile.diagnostics[0].title }}` — Top critical opportunity.
- `{{ $json.scans.mobile.diagnostics[0].suggestedAction }}` — Actionable technical remedy for outreach.
