'use client';

import React from 'react';
import { Activity, ShieldCheck, AlertCircle, Plus, Terminal } from 'lucide-react';

interface HeaderProps {
  hasApiKey: boolean;
  onAddWebsite: () => void;
  onOpenApiDocs?: () => void;
}

export function Header({ hasApiKey, onAddWebsite, onOpenApiDocs }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand Title */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Matos Systems
                </span>
                <span className="text-slate-300">/</span>
                <span className="text-xs font-medium text-slate-400">Intelligence</span>
              </div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                PageSpeed Intelligence
              </h1>
            </div>
          </div>

          {/* Status Badges & Controls */}
          <div className="flex items-center space-x-3">
            {/* Google API Status Pill */}
            {hasApiKey ? (
              <div
                className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
                title="Google PageSpeed API v5 Key is configured in .env.local"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Google API Live</span>
              </div>
            ) : (
              <div
                className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200"
                title="PAGESPEED_API_KEY is not set in .env.local. Test fixtures/mock mode will be used."
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>API Mock Mode</span>
              </div>
            )}

            {/* API Documentation Shortcut */}
            {onOpenApiDocs && (
              <button
                onClick={onOpenApiDocs}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
                title="View Automation API Endpoints & n8n docs"
              >
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
                <span>API Docs</span>
              </button>
            )}

            {/* Add Website CTA */}
            <button
              onClick={onAddWebsite}
              id="header-add-website-btn"
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
            >
              <Plus className="w-4 h-4" />
              <span>Add Website</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
