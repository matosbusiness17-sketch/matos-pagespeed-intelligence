'use client';

import React, { useState } from 'react';
import {
  Globe,
  ExternalLink,
  Smartphone,
  Monitor,
  Edit2,
  Trash2,
  FileText,
  Search,
} from 'lucide-react';
import type { Website, ScanStrategy } from '@/types';

interface WebsitesTableProps {
  websites: Website[];
  onSelectWebsite: (websiteId: string) => void;
  onEditWebsite: (website: Website) => void;
  onDeleteWebsite: (website: Website) => void;
  onTriggerScan: (url: string, strategy: ScanStrategy, websiteId: string) => void;
  isScanning: boolean;
}

export function WebsitesTable({
  websites,
  onSelectWebsite,
  onEditWebsite,
  onDeleteWebsite,
  onTriggerScan,
  isScanning,
}: WebsitesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = websites.filter((site) => {
    const term = searchTerm.toLowerCase();
    return (
      site.displayName.toLowerCase().includes(term) ||
      site.domain.toLowerCase().includes(term) ||
      (site.businessName && site.businessName.toLowerCase().includes(term))
    );
  });

  const getScoreBadge = (score?: number | null) => {
    if (score === undefined || score === null) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
          Not audited
        </span>
      );
    }
    if (score >= 90) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          {score}/100
        </span>
      );
    }
    if (score >= 50) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          {score}/100
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        {score}/100
      </span>
    );
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return 'Never';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Tracked Websites</h2>
          <p className="text-xs text-slate-500">
            Monitor client domains and automated audit performance scores
          </p>
        </div>

        {/* Filter Input */}
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            id="website-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tracked websites..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
          />
        </div>
      </div>

      {/* Table or Empty State */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center" id="empty-websites-state">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <Globe className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800">
            {searchTerm ? 'No matching websites found' : 'No tracked websites yet'}
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? 'Try modifying your search term or clear the filter.'
              : 'Add your first client website above to track performance across mobile and desktop audits.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600" id="websites-table">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th scope="col" className="px-5 py-3">Website & Domain</th>
                <th scope="col" className="px-4 py-3">Client / Business</th>
                <th scope="col" className="px-4 py-3">Mobile Score</th>
                <th scope="col" className="px-4 py-3">Desktop Score</th>
                <th scope="col" className="px-4 py-3">Last Audited</th>
                <th scope="col" className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((site) => {
                const latestMobile = site.latestScans?.mobile;
                const latestDesktop = site.latestScans?.desktop;
                const lastDate = latestMobile?.scannedAt || latestDesktop?.scannedAt;

                return (
                  <tr
                    key={site.id}
                    className="hover:bg-slate-50/70 transition-colors website-row"
                    data-website-id={site.id}
                  >
                    {/* Website Name & Domain */}
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 text-sm">
                          {site.displayName}
                        </span>
                        <a
                          href={site.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 mt-0.5 space-x-1"
                        >
                          <span>{site.domain}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      </div>
                    </td>

                    {/* Business Name */}
                    <td className="px-4 py-3.5 text-slate-700">
                      {site.businessName || <span className="text-slate-400">—</span>}
                    </td>

                    {/* Mobile Score */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                        {getScoreBadge(latestMobile?.performanceScore)}
                      </div>
                    </td>

                    {/* Desktop Score */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-1.5">
                        <Monitor className="w-3.5 h-3.5 text-slate-400" />
                        {getScoreBadge(latestDesktop?.performanceScore)}
                      </div>
                    </td>

                    {/* Last Audited */}
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                      {formatDate(lastDate)}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center space-x-1.5">
                        {/* View Report Button */}
                        <button
                          onClick={() => onSelectWebsite(site.id)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors inline-flex items-center space-x-1 view-report-btn"
                          title="View detailed performance diagnosis"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Report</span>
                        </button>

                        {/* Quick Mobile Scan */}
                        <button
                          onClick={() => onTriggerScan(site.url, 'mobile', site.id)}
                          disabled={isScanning}
                          className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 transition-colors run-mobile-scan-btn"
                          title="Run Mobile Scan"
                        >
                          <Smartphone className="w-4 h-4" />
                        </button>

                        {/* Quick Desktop Scan */}
                        <button
                          onClick={() => onTriggerScan(site.url, 'desktop', site.id)}
                          disabled={isScanning}
                          className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 transition-colors run-desktop-scan-btn"
                          title="Run Desktop Scan"
                        >
                          <Monitor className="w-4 h-4" />
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => onEditWebsite(site)}
                          className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors edit-website-btn"
                          title="Edit Website"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => onDeleteWebsite(site)}
                          className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors delete-website-btn"
                          title="Delete Website"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
