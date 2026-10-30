import type { GooglePageSpeedResponse } from './types';

export const mockMobilePageSpeedResponse: GooglePageSpeedResponse = {
  lighthouseResult: {
    requestedUrl: 'https://example.com',
    finalUrl: 'https://example.com/',
    lighthouseVersion: '12.2.1',
    userAgent: 'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36',
    fetchTime: '2026-10-30T16:00:00.000Z',
    categories: {
      performance: {
        id: 'performance',
        title: 'Performance',
        score: 0.78, // 78 / 100
      },
    },
    audits: {
      'first-contentful-paint': {
        id: 'first-contentful-paint',
        title: 'First Contentful Paint',
        description: 'First Contentful Paint marks the time at which the first text or image is painted.',
        score: 0.85,
        numericValue: 1820,
        numericUnit: 'millisecond',
        displayValue: '1.8 s',
      },
      'largest-contentful-paint': {
        id: 'largest-contentful-paint',
        title: 'Largest Contentful Paint',
        description: 'Largest Contentful Paint marks the time at which the largest text or image is painted.',
        score: 0.72,
        numericValue: 3100,
        numericUnit: 'millisecond',
        displayValue: '3.1 s',
      },
      'total-blocking-time': {
        id: 'total-blocking-time',
        title: 'Total Blocking Time',
        description: 'Sum of all time periods between FCP and Time to Interactive when task length exceeded 50ms.',
        score: 0.65,
        numericValue: 340,
        numericUnit: 'millisecond',
        displayValue: '340 ms',
      },
      'cumulative-layout-shift': {
        id: 'cumulative-layout-shift',
        title: 'Cumulative Layout Shift',
        description: 'Cumulative Layout Shift measures the movement of visible elements within the viewport.',
        score: 0.95,
        numericValue: 0.045,
        numericUnit: 'unitless',
        displayValue: '0.045',
      },
      'speed-index': {
        id: 'speed-index',
        title: 'Speed Index',
        description: 'Speed Index shows how quickly the contents of a page are visibly populated.',
        score: 0.80,
        numericValue: 2400,
        numericUnit: 'millisecond',
        displayValue: '2.4 s',
      },
      'render-blocking-resources': {
        id: 'render-blocking-resources',
        title: 'Eliminate render-blocking resources',
        description: 'Resources are blocking the first paint of your page. Consider delivering critical JS/CSS inline and deferring all non-critical JS/styles.',
        score: 0.45,
        displayValue: 'Potential savings of 480 ms',
        details: {
          overallSavingsMs: 480,
          overallSavingsBytes: 45000,
          items: [
            { url: 'https://example.com/styles/main.css', totalBytes: 25000, wastingMs: 280 },
            { url: 'https://example.com/scripts/vendor.js', totalBytes: 20000, wastingMs: 200 },
          ],
        },
      },
      'modern-image-formats': {
        id: 'modern-image-formats',
        title: 'Serve images in modern formats',
        description: 'Image formats like WebP and AVIF often provide better compression than PNG or JPEG.',
        score: 0.35,
        displayValue: 'Potential savings of 120 KB',
        details: {
          overallSavingsBytes: 122880,
          overallSavingsMs: 150,
          items: [
            { url: 'https://example.com/images/hero.jpg', totalBytes: 245760, wastedBytes: 122880 },
          ],
        },
      },
      'unused-javascript': {
        id: 'unused-javascript',
        title: 'Reduce unused JavaScript',
        description: 'Reduce unused JavaScript and defer loading scripts until they are required to decrease bytes consumed by network activity.',
        score: 0.52,
        displayValue: 'Potential savings of 210 KB',
        details: {
          overallSavingsBytes: 215040,
          overallSavingsMs: 250,
          items: [
            { url: 'https://example.com/scripts/analytics-bundle.js', totalBytes: 250000, wastedBytes: 215040 },
          ],
        },
      },
      'server-response-time': {
        id: 'server-response-time',
        title: 'Initial server response time was short',
        description: 'Keep the server response time for the main document short because all other requests depend on it.',
        score: 1.0,
        numericValue: 120,
        displayValue: 'Root document took 120 ms',
      },
    },
  },
};

export const mockDesktopPageSpeedResponse: GooglePageSpeedResponse = {
  lighthouseResult: {
    requestedUrl: 'https://example.com',
    finalUrl: 'https://example.com/',
    lighthouseVersion: '12.2.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    fetchTime: '2026-10-30T16:01:00.000Z',
    categories: {
      performance: {
        id: 'performance',
        title: 'Performance',
        score: 0.94, // 94 / 100
      },
    },
    audits: {
      'first-contentful-paint': {
        id: 'first-contentful-paint',
        title: 'First Contentful Paint',
        description: 'First Contentful Paint marks the time at which the first text or image is painted.',
        score: 0.98,
        numericValue: 650,
        numericUnit: 'millisecond',
        displayValue: '0.7 s',
      },
      'largest-contentful-paint': {
        id: 'largest-contentful-paint',
        title: 'Largest Contentful Paint',
        description: 'Largest Contentful Paint marks the time at which the largest text or image is painted.',
        score: 0.92,
        numericValue: 1200,
        numericUnit: 'millisecond',
        displayValue: '1.2 s',
      },
      'total-blocking-time': {
        id: 'total-blocking-time',
        title: 'Total Blocking Time',
        description: 'Sum of all time periods between FCP and Time to Interactive when task length exceeded 50ms.',
        score: 0.99,
        numericValue: 40,
        numericUnit: 'millisecond',
        displayValue: '40 ms',
      },
      'cumulative-layout-shift': {
        id: 'cumulative-layout-shift',
        title: 'Cumulative Layout Shift',
        description: 'Cumulative Layout Shift measures the movement of visible elements within the viewport.',
        score: 0.99,
        numericValue: 0.012,
        numericUnit: 'unitless',
        displayValue: '0.012',
      },
      'speed-index': {
        id: 'speed-index',
        title: 'Speed Index',
        description: 'Speed Index shows how quickly the contents of a page are visibly populated.',
        score: 0.95,
        numericValue: 950,
        numericUnit: 'millisecond',
        displayValue: '1.0 s',
      },
      'modern-image-formats': {
        id: 'modern-image-formats',
        title: 'Serve images in modern formats',
        description: 'Image formats like WebP and AVIF often provide better compression than PNG or JPEG.',
        score: 0.70,
        displayValue: 'Potential savings of 80 KB',
        details: {
          overallSavingsBytes: 81920,
          overallSavingsMs: 80,
          items: [
            { url: 'https://example.com/images/hero.jpg', totalBytes: 245760, wastedBytes: 81920 },
          ],
        },
      },
    },
  },
};
