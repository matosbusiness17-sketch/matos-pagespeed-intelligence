'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { SummaryCards } from '@/components/SummaryCards';
import { QuickScanBar } from '@/components/QuickScanBar';
import { WebsitesTable } from '@/components/WebsitesTable';
import { WebsiteModal } from '@/components/WebsiteModal';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { ReportView } from '@/components/ReportView';
import { ApiDocsModal } from '@/components/ApiDocsModal';
import type { Website, ScanStrategy } from '@/types';

export default function DashboardPage() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [summary, setSummary] = useState({
    totalWebsites: 0,
    totalScans: 0,
    attentionNeededCount: 0,
    averageScore: null as number | null,
  });
  const [hasApiKey, setHasApiKey] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  // Modals & Navigation State
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string | null>(null);
  const [isWebsiteModalOpen, setIsWebsiteModalOpen] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState<Website | null>(null);
  const [deletingWebsite, setDeletingWebsite] = useState<Website | null>(null);
  const [isApiDocsOpen, setIsApiDocsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Fetch status and summary data
  const loadData = useCallback(async () => {
    try {
      const [statusRes, sumRes, webRes] = await Promise.all([
        fetch('/api/config-status'),
        fetch('/api/summary'),
        fetch('/api/websites'),
      ]);

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setHasApiKey(statusData.hasApiKey);
        setHasToken(statusData.hasToken);
      }

      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummary({
          totalWebsites: sumData.totalWebsites,
          totalScans: sumData.totalScans,
          attentionNeededCount: sumData.attentionNeededCount,
          averageScore: sumData.averageScore,
        });
      }

      if (webRes.ok) {
        const webData = await webRes.json();
        setWebsites(webData.websites || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;
    async function init() {
      try {
        const [statusRes, sumRes, webRes] = await Promise.all([
          fetch('/api/config-status'),
          fetch('/api/summary'),
          fetch('/api/websites'),
        ]);

        if (isCancelled) return;

        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setHasApiKey(statusData.hasApiKey);
          setHasToken(statusData.hasToken);
        }

        if (sumRes.ok) {
          const sumData = await sumRes.json();
          setSummary({
            totalWebsites: sumData.totalWebsites,
            totalScans: sumData.totalScans,
            attentionNeededCount: sumData.attentionNeededCount,
            averageScore: sumData.averageScore,
          });
        }

        if (webRes.ok) {
          const webData = await webRes.json();
          setWebsites(webData.websites || []);
        }

        setIsHydrated(true);
      } catch (err) {
        console.error('Error initializing dashboard data:', err);
        setIsHydrated(true);
      }
    }

    init();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleAddWebsite = () => {
    setEditingWebsite(null);
    setIsWebsiteModalOpen(true);
  };

  const handleEditWebsite = (site: Website) => {
    setEditingWebsite(site);
    setIsWebsiteModalOpen(true);
  };

  const handleDeleteWebsite = (site: Website) => {
    setDeletingWebsite(site);
  };

  const handleTriggerScan = async (
    url: string,
    strategy: ScanStrategy,
    websiteId: string
  ) => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, strategy, websiteId }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Scan failed.');
      } else {
        await loadData();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Scan failed.';
      alert(msg);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Header */}
      <Header
        hasApiKey={hasApiKey}
        onAddWebsite={handleAddWebsite}
        onOpenApiDocs={() => setIsApiDocsOpen(true)}
      />

      {/* Main Content Area */}
      <main
        data-hydrated={isHydrated ? "true" : "false"}
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
      >
        {selectedWebsiteId ? (
          /* Report View */
          <ReportView
            websiteId={selectedWebsiteId}
            onBack={() => setSelectedWebsiteId(null)}
            onTriggerScan={handleTriggerScan}
            isScanning={isScanning}
          />
        ) : (
          /* Agency Dashboard View */
          <>
            {/* Quick Metrics */}
            <SummaryCards
              totalWebsites={summary.totalWebsites}
              totalScans={summary.totalScans}
              attentionNeededCount={summary.attentionNeededCount}
              averageScore={summary.averageScore}
            />

            {/* Quick Scan Bar */}
            <QuickScanBar
              websites={websites}
              onScanComplete={loadData}
              isScanning={isScanning}
              setIsScanning={setIsScanning}
            />

            {/* Tracked Websites Table */}
            <WebsitesTable
              websites={websites}
              onSelectWebsite={(id) => setSelectedWebsiteId(id)}
              onEditWebsite={handleEditWebsite}
              onDeleteWebsite={handleDeleteWebsite}
              onTriggerScan={handleTriggerScan}
              isScanning={isScanning}
            />
          </>
        )}
      </main>

      {/* Modals */}
      <WebsiteModal
        isOpen={isWebsiteModalOpen}
        onClose={() => setIsWebsiteModalOpen(false)}
        onSave={loadData}
        editingWebsite={editingWebsite}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deletingWebsite)}
        website={deletingWebsite}
        onClose={() => setDeletingWebsite(null)}
        onConfirm={loadData}
      />

      <ApiDocsModal
        isOpen={isApiDocsOpen}
        onClose={() => setIsApiDocsOpen(false)}
        hasToken={hasToken}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>Matos Systems • PageSpeed Intelligence Local-First Suite</span>
          <span>Google PageSpeed Insights API v5 & Lighthouse Integration</span>
        </div>
      </footer>
    </div>
  );
}
