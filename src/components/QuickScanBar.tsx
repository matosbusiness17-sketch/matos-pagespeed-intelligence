'use client';

import React, { useState } from 'react';
import { Search, Smartphone, Monitor, Layers, Loader2, AlertCircle } from 'lucide-react';
import type { Website } from '@/types';

interface QuickScanBarProps {
  websites: Website[];
  onScanComplete: () => void;
  isScanning: boolean;
  setIsScanning: (scanning: boolean) => void;
}

export function QuickScanBar({
  websites,
  onScanComplete,
  isScanning,
  setIsScanning,
}: QuickScanBarProps) {
  const [url, setUrl] = useState('');
  const [strategy, setStrategy] = useState<'mobile' | 'desktop' | 'both'>('mobile');
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // When website is selected from dropdown, sync URL
  const handleWebsiteSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const siteId = e.target.value;
    setSelectedWebsiteId(siteId);
    if (siteId) {
      const site = websites.find((w) => w.id === siteId);
      if (site) {
        setUrl(site.url);
      }
    }
  };

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusMessage(null);

    const targetUrl = url.trim();
    if (!targetUrl) {
      setError('Please enter a website URL to audit.');
      return;
    }

    setIsScanning(true);
    setStatusMessage(
      strategy === 'both'
        ? 'Executing sequential Mobile & Desktop audits via Google PageSpeed Insights...'
        : `Executing ${strategy.toUpperCase()} audit via Google PageSpeed Insights...`
    );

    try {
      const res = await fetch('/api/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl,
          strategy,
          websiteId: selectedWebsiteId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete scan.');
      }

      setStatusMessage('Scan completed successfully!');
      setTimeout(() => setStatusMessage(null), 3000);
      onScanComplete();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Scan execution failed.';
      setError(message);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Run Website Performance Audit</h2>
          <p className="text-xs text-slate-500">
            Powered by Google PageSpeed Insights API v5 & Lighthouse
          </p>
        </div>

        {/* Website Quick Select */}
        {websites.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500">Quick select:</span>
            <select
              value={selectedWebsiteId}
              onChange={handleWebsiteSelect}
              className="text-xs rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
              disabled={isScanning}
              id="quick-scan-website-select"
            >
              <option value="">Or choose a tracked website...</option>
              {websites.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.displayName} ({w.domain})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <form onSubmit={handleScanSubmit} className="space-y-3">
        <div className="flex flex-col md:flex-row gap-2.5">
          {/* URL Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              id="quick-scan-url-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter public website URL (e.g. https://example.com)"
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
              disabled={isScanning}
            />
          </div>

          {/* Strategy Selector Buttons */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 self-start md:self-auto">
            <button
              type="button"
              id="strategy-mobile-btn"
              onClick={() => setStrategy('mobile')}
              disabled={isScanning}
              className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                strategy === 'mobile'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile</span>
            </button>

            <button
              type="button"
              id="strategy-desktop-btn"
              onClick={() => setStrategy('desktop')}
              disabled={isScanning}
              className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                strategy === 'desktop'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop</span>
            </button>

            <button
              type="button"
              id="strategy-both-btn"
              onClick={() => setStrategy('both')}
              disabled={isScanning}
              className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                strategy === 'both'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Both</span>
            </button>
          </div>

          {/* Trigger Scan CTA Button */}
          <button
            type="submit"
            id="run-audit-btn"
            disabled={isScanning}
            className="inline-flex items-center justify-center space-x-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 min-w-[130px]"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Auditing...</span>
              </>
            ) : (
              <span>Run Audit</span>
            )}
          </button>
        </div>

        {/* Status indicator */}
        {statusMessage && (
          <div className="flex items-center space-x-2 text-xs text-blue-700 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
            <span id="scan-status-message">{statusMessage}</span>
          </div>
        )}

        {/* Error alert */}
        {error && (
          <div
            id="scan-error-alert"
            className="flex items-start space-x-2 text-xs text-rose-800 bg-rose-50 px-3 py-2.5 rounded-lg border border-rose-200"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Audit Request Error</p>
              <p>{error}</p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
