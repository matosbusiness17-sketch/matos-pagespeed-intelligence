'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Smartphone,
  Monitor,
  ExternalLink,
  Clock,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Info,
  RefreshCw,
  Loader2,
  Play,
} from 'lucide-react';
import type {
  Website,
  ScanResult,
  ScanStrategy,
  HistoricalComparison,
  AuditPriority,
} from '@/types';

interface ReportViewProps {
  websiteId: string;
  onBack: () => void;
  onTriggerScan: (url: string, strategy: ScanStrategy, websiteId: string) => void;
  isScanning: boolean;
}

export function ReportView({
  websiteId,
  onBack,
  onTriggerScan,
  isScanning,
}: ReportViewProps) {
  const [website, setWebsite] = useState<Website | null>(null);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [activeStrategy, setActiveStrategy] = useState<ScanStrategy>('mobile');
  const [currentScan, setCurrentScan] = useState<ScanResult | null>(null);
  const [comparison, setComparison] = useState<HistoricalComparison | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<AuditPriority | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadScanDetail = async (scanId: string) => {
    try {
      const res = await fetch(`/api/scans/${scanId}`);
      if (!res.ok) throw new Error('Failed to load scan details.');
      const data = await res.json();
      setCurrentScan(data.scan);
      setComparison(data.comparison);
    } catch (err: unknown) {
      console.error('Error fetching scan details:', err);
    }
  };

  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      try {
        const res = await fetch(`/api/websites/${websiteId}`);
        if (!res.ok) throw new Error('Failed to load website report.');
        const data = await res.json();
        if (isCancelled) return;

        setWebsite(data.website);
        setRecentScans(data.recentScans || []);

        const matchingScans = (data.recentScans || []).filter(
          (s: ScanResult) => s.strategy === activeStrategy && s.status === 'completed'
        );

        if (matchingScans.length > 0) {
          const scanRes = await fetch(`/api/scans/${matchingScans[0].id}`);
          if (scanRes.ok && !isCancelled) {
            const scanData = await scanRes.json();
            setCurrentScan(scanData.scan);
            setComparison(scanData.comparison);
          }
        } else if (!isCancelled) {
          setCurrentScan(null);
          setComparison(null);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Error loading report.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [websiteId, activeStrategy]);

  // When strategy tab switches, select the latest scan for that strategy
  const handleStrategySwitch = (newStrategy: ScanStrategy) => {
    setActiveStrategy(newStrategy);
    const matchingScans = recentScans.filter(
      (s) => s.strategy === newStrategy && s.status === 'completed'
    );
    if (matchingScans.length > 0) {
      loadScanDetail(matchingScans[0].id);
    } else {
      setCurrentScan(null);
      setComparison(null);
    }
  };

  const getScoreCategoryPill = (score: number | null) => {
    if (score === null) return null;
    if (score >= 90) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
          Good (90–100)
        </span>
      );
    }
    if (score >= 50) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
          Needs Improvement (50–89)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
        Poor (0–49)
      </span>
    );
  };

  const getMetricBadge = (category: string) => {
    switch (category) {
      case 'good':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Good
          </span>
        );
      case 'needs-improvement':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Needs Improvement
          </span>
        );
      case 'poor':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Poor
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: AuditPriority) => {
    switch (priority) {
      case 'critical':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
            Critical
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200">
            Medium
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
            Low
          </span>
        );
    }
  };

  const filteredDiagnostics = (currentScan?.diagnostics || []).filter((d) => {
    if (priorityFilter === 'all') return true;
    return d.priority === priorityFilter;
  });

  if (isLoading && !website) {
    return (
      <div className="p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
        <p className="text-sm text-slate-600 font-medium">Loading performance diagnostics report...</p>
      </div>
    );
  }

  if (error || !website) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-900">Failed to Load Report</h3>
        <p className="text-xs text-slate-500 mt-1">{error || 'Website record not found.'}</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="report-view-container">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          id="report-back-btn"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        {/* Re-run Scan Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onTriggerScan(website.url, activeStrategy, website.id)}
            disabled={isScanning}
            id="report-rerun-scan-btn"
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors shadow-sm"
          >
            {isScanning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>Re-run {activeStrategy === 'mobile' ? 'Mobile' : 'Desktop'} Audit</span>
          </button>
        </div>
      </div>

      {/* Website Meta Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900" id="report-website-name">
              {website.displayName}
            </h1>
            {website.businessName && (
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                {website.businessName}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3 mt-1 text-xs text-slate-500">
            <a
              href={website.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 space-x-1"
            >
              <span>{website.domain}</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
            {website.notes && <span>• {website.notes}</span>}
          </div>
        </div>

        {/* Strategy Switcher */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 self-start md:self-auto">
          <button
            onClick={() => handleStrategySwitch('mobile')}
            id="report-strategy-mobile-btn"
            className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeStrategy === 'mobile'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile Report</span>
          </button>

          <button
            onClick={() => handleStrategySwitch('desktop')}
            id="report-strategy-desktop-btn"
            className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeStrategy === 'desktop'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop Report</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {!currentScan ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            No {activeStrategy.toUpperCase()} Audit Performed Yet
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Run an audit to extract Google PageSpeed metrics, laboratory Web Vitals, and prioritized
            diagnostic recommendations.
          </p>
          <button
            onClick={() => onTriggerScan(website.url, activeStrategy, website.id)}
            disabled={isScanning}
            className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg shadow-sm"
          >
            {isScanning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            <span>Run {activeStrategy === 'mobile' ? 'Mobile' : 'Desktop'} Audit Now</span>
          </button>
        </div>
      ) : (
        <>
          {/* Performance Hero Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Score Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Lighthouse Score
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    v{currentScan.lighthouseVersion || '12.x'}
                  </span>
                </div>

                <div className="mt-4 flex items-baseline space-x-3">
                  <span
                    className={`text-5xl font-extrabold tracking-tight ${
                      currentScan.performanceScore !== null && currentScan.performanceScore >= 90
                        ? 'text-emerald-600'
                        : currentScan.performanceScore !== null && currentScan.performanceScore >= 50
                        ? 'text-amber-600'
                        : 'text-rose-600'
                    }`}
                    id="report-hero-score"
                  >
                    {currentScan.performanceScore !== null ? currentScan.performanceScore : '—'}
                  </span>
                  <span className="text-slate-400 text-lg font-medium">/ 100</span>
                </div>

                <div className="mt-2">{getScoreCategoryPill(currentScan.performanceScore)}</div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                <div className="flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Audited:{' '}
                    {new Date(currentScan.scannedAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
                <div className="truncate text-slate-400" title={currentScan.resolvedUrl}>
                  Resolved: {currentScan.resolvedUrl}
                </div>
              </div>
            </div>

            {/* Historical Comparison Card */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Historical Comparison (Like-for-Like)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-medium">
                      {activeStrategy.toUpperCase()}
                    </span>
                  </div>
                </div>

                {comparison ? (
                  <div className="mt-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-slate-600">Performance Score Delta:</span>
                      {comparison.scoreDelta !== null ? (
                        comparison.scoreDelta > 0 ? (
                          <span className="inline-flex items-center text-sm font-bold text-emerald-600 space-x-1">
                            <TrendingUp className="w-4 h-4" />
                            <span>+{comparison.scoreDelta} points</span>
                          </span>
                        ) : comparison.scoreDelta < 0 ? (
                          <span className="inline-flex items-center text-sm font-bold text-rose-600 space-x-1">
                            <TrendingDown className="w-4 h-4" />
                            <span>{comparison.scoreDelta} points</span>
                          </span>
                        ) : (
                          <span className="text-sm font-bold text-slate-600">No change (0 pts)</span>
                        )
                      ) : (
                        <span className="text-sm text-slate-400">N/A</span>
                      )}
                      <span className="text-xs text-slate-400">
                        (Previous: {comparison.previousScore ?? '—'}/100 on{' '}
                        {new Date(comparison.previousScannedAt).toLocaleDateString()})
                      </span>
                    </div>

                    {/* Metric differences breakdown */}
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                      {comparison.metrics.fcp && (
                        <div className="p-2 rounded bg-slate-50 border border-slate-100">
                          <span className="text-[10px] text-slate-500 block uppercase font-medium">FCP</span>
                          <span
                            className={`font-semibold ${
                              comparison.metrics.fcp.improved ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {comparison.metrics.fcp.diff > 0 ? `+${comparison.metrics.fcp.diff}ms` : `${comparison.metrics.fcp.diff}ms`}
                          </span>
                        </div>
                      )}
                      {comparison.metrics.lcp && (
                        <div className="p-2 rounded bg-slate-50 border border-slate-100">
                          <span className="text-[10px] text-slate-500 block uppercase font-medium">LCP</span>
                          <span
                            className={`font-semibold ${
                              comparison.metrics.lcp.improved ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {comparison.metrics.lcp.diff > 0 ? `+${comparison.metrics.lcp.diff}ms` : `${comparison.metrics.lcp.diff}ms`}
                          </span>
                        </div>
                      )}
                      {comparison.metrics.tbt && (
                        <div className="p-2 rounded bg-slate-50 border border-slate-100">
                          <span className="text-[10px] text-slate-500 block uppercase font-medium">TBT</span>
                          <span
                            className={`font-semibold ${
                              comparison.metrics.tbt.improved ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {comparison.metrics.tbt.diff > 0 ? `+${comparison.metrics.tbt.diff}ms` : `${comparison.metrics.tbt.diff}ms`}
                          </span>
                        </div>
                      )}
                      {comparison.metrics.cls && (
                        <div className="p-2 rounded bg-slate-50 border border-slate-100">
                          <span className="text-[10px] text-slate-500 block uppercase font-medium">CLS</span>
                          <span
                            className={`font-semibold ${
                              comparison.metrics.cls.improved ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {comparison.metrics.cls.diff > 0 ? `+${comparison.metrics.cls.diff}` : `${comparison.metrics.cls.diff}`}
                          </span>
                        </div>
                      )}
                      {comparison.metrics.speedIndex && (
                        <div className="p-2 rounded bg-slate-50 border border-slate-100">
                          <span className="text-[10px] text-slate-500 block uppercase font-medium">Speed Index</span>
                          <span
                            className={`font-semibold ${
                              comparison.metrics.speedIndex.improved ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {comparison.metrics.speedIndex.diff > 0 ? `+${comparison.metrics.speedIndex.diff}ms` : `${comparison.metrics.speedIndex.diff}ms`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600">
                    <p className="font-medium text-slate-800">First baseline audit for this strategy.</p>
                    <p className="text-slate-500 mt-0.5">
                      Future scans will automatically display like-for-like score deltas and metric improvements.
                    </p>
                  </div>
                )}
              </div>

              {/* Statistical variance notice */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-start space-x-2 text-[11px] text-slate-500">
                <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                <p>
                  Lighthouse runs in a simulated headless Chrome environment. Small fluctuations (±3–5 pts)
                  between consecutive runs are normal due to network routing, third-party server load, and CDN caching.
                </p>
              </div>
            </div>
          </div>

          {/* Core Web Vitals Lab Metrics Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Core Web Vitals & Performance Lab Metrics
                </h3>
                <p className="text-xs text-slate-500">
                  Simulated laboratory measurements under standardized network throttling
                </p>
              </div>
              <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                Laboratory Simulation (Not CrUX field data)
              </span>
            </div>

            {currentScan.metrics ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {/* FCP */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">First Contentful Paint (FCP)</span>
                      {getMetricBadge(currentScan.metrics.fcp.category)}
                    </div>
                    <p className="text-xl font-extrabold text-slate-900 mt-2">
                      {currentScan.metrics.fcp.displayValue}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {currentScan.metrics.fcp.description}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
                    Threshold: ≤ 1.8s
                  </p>
                </div>

                {/* LCP */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Largest Contentful Paint (LCP)</span>
                      {getMetricBadge(currentScan.metrics.lcp.category)}
                    </div>
                    <p className="text-xl font-extrabold text-slate-900 mt-2">
                      {currentScan.metrics.lcp.displayValue}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {currentScan.metrics.lcp.description}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
                    Threshold: ≤ 2.5s
                  </p>
                </div>

                {/* TBT */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Total Blocking Time (TBT)</span>
                      {getMetricBadge(currentScan.metrics.tbt.category)}
                    </div>
                    <p className="text-xl font-extrabold text-slate-900 mt-2">
                      {currentScan.metrics.tbt.displayValue}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {currentScan.metrics.tbt.description}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
                    Threshold: ≤ 200ms
                  </p>
                </div>

                {/* CLS */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Cumulative Layout Shift (CLS)</span>
                      {getMetricBadge(currentScan.metrics.cls.category)}
                    </div>
                    <p className="text-xl font-extrabold text-slate-900 mt-2">
                      {currentScan.metrics.cls.displayValue}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {currentScan.metrics.cls.description}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
                    Threshold: ≤ 0.1
                  </p>
                </div>

                {/* Speed Index */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Speed Index</span>
                      {getMetricBadge(currentScan.metrics.speedIndex.category)}
                    </div>
                    <p className="text-xl font-extrabold text-slate-900 mt-2">
                      {currentScan.metrics.speedIndex.displayValue}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {currentScan.metrics.speedIndex.description}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
                    Threshold: ≤ 3.4s
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Core metrics not available for this run.</p>
            )}
          </div>

          {/* Actionable Diagnostics & Recommendations Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Performance Diagnosis & Opportunities ({currentScan.diagnostics.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Evidence-based performance opportunities ordered by priority and estimated savings
                </p>
              </div>

              {/* Priority Filter Tabs */}
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                {(['all', 'critical', 'high', 'medium', 'low'] as const).map((p) => {
                  const count =
                    p === 'all'
                      ? currentScan.diagnostics.length
                      : currentScan.diagnostics.filter((d) => d.priority === p).length;

                  return (
                    <button
                      key={p}
                      onClick={() => setPriorityFilter(p)}
                      className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                        priorityFilter === p
                          ? 'bg-white text-slate-900 shadow-xs font-semibold'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <span className="capitalize">{p}</span> ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {filteredDiagnostics.length === 0 ? (
              <div className="py-10 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-800">
                  {priorityFilter === 'all'
                    ? 'No significant performance opportunities detected!'
                    : `No ${priorityFilter} opportunities detected.`}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  The page satisfies standard Lighthouse audit thresholds for this category.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 mt-2">
                {filteredDiagnostics.map((diag) => (
                  <div key={diag.id} className="py-4 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        {getPriorityBadge(diag.priority)}
                        <h4 className="text-sm font-bold text-slate-900">{diag.title}</h4>
                      </div>

                      {/* Savings Pill */}
                      {diag.displayValue && (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 self-start sm:self-auto">
                          {diag.displayValue}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{diag.description}</p>

                    {/* Corrective Action Box */}
                    <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-100 text-xs text-blue-900">
                      <span className="font-semibold text-blue-950 block mb-0.5">
                        Suggested Corrective Action:
                      </span>
                      {diag.suggestedAction}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Historical Scan Timeline for this Website */}
          {recentScans.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Audit History</h3>
              <p className="text-xs text-slate-500 mb-4">
                Prior performance records for like-for-like comparison
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-2.5">Date & Time</th>
                      <th className="px-4 py-2.5">Strategy</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5">Score</th>
                      <th className="px-4 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentScans.map((s) => (
                      <tr
                        key={s.id}
                        className={`hover:bg-slate-50 ${
                          currentScan.id === s.id ? 'bg-blue-50/50 font-medium' : ''
                        }`}
                      >
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          {new Date(s.scannedAt).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="px-4 py-2.5 capitalize">{s.strategy}</td>
                        <td className="px-4 py-2.5">
                          {s.status === 'completed' ? (
                            <span className="text-emerald-700 font-semibold">Completed</span>
                          ) : (
                            <span className="text-rose-600 font-semibold">Failed</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 font-bold">
                          {s.performanceScore !== null ? `${s.performanceScore}/100` : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            onClick={() => loadScanDetail(s.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                          >
                            {currentScan.id === s.id ? 'Viewing' : 'View Scan'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
