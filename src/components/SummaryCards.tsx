'use client';

import React from 'react';
import { Globe, Gauge, AlertTriangle, CheckCircle } from 'lucide-react';

interface SummaryCardsProps {
  totalWebsites: number;
  totalScans: number;
  attentionNeededCount: number;
  averageScore: number | null;
}

export function SummaryCards({
  totalWebsites,
  totalScans,
  attentionNeededCount,
  averageScore,
}: SummaryCardsProps) {
  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-slate-400 bg-slate-50 border-slate-200';
    if (score >= 90) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 50) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Tracked Websites */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Tracked Websites
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1" id="summary-total-websites">
            {totalWebsites}
          </p>
          <p className="text-xs text-slate-500 mt-1">Configured for audits</p>
        </div>
        <div className="w-11 h-11 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
          <Globe className="w-5 h-5" />
        </div>
      </div>

      {/* Total Scans Completed */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Total Scans
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1" id="summary-total-scans">
            {totalScans}
          </p>
          <p className="text-xs text-slate-500 mt-1">Mobile & Desktop audits</p>
        </div>
        <div className="w-11 h-11 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
          <Gauge className="w-5 h-5" />
        </div>
      </div>

      {/* Attention Needed */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Attention Needed
          </p>
          <p
            className={`text-2xl font-bold mt-1 ${
              attentionNeededCount > 0 ? 'text-amber-600' : 'text-slate-900'
            }`}
            id="summary-attention-count"
          >
            {attentionNeededCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">Score below 60/100</p>
        </div>
        <div
          className={`w-11 h-11 rounded-lg border flex items-center justify-center ${
            attentionNeededCount > 0
              ? 'bg-amber-50 border-amber-200 text-amber-600'
              : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>

      {/* Average Performance Score */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Average Score
          </p>
          <div className="flex items-center space-x-2 mt-1">
            <span
              className={`text-2xl font-bold ${
                averageScore === null
                  ? 'text-slate-400'
                  : averageScore >= 90
                  ? 'text-emerald-600'
                  : averageScore >= 50
                  ? 'text-amber-600'
                  : 'text-rose-600'
              }`}
              id="summary-average-score"
            >
              {averageScore !== null ? `${averageScore}/100` : 'N/A'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Across latest completed audits</p>
        </div>
        <div
          className={`w-11 h-11 rounded-lg border flex items-center justify-center ${getScoreColor(
            averageScore
          )}`}
        >
          <CheckCircle className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
