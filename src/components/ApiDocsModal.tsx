'use client';

import React from 'react';
import { X, Terminal, CheckCircle, Shield } from 'lucide-react';

interface ApiDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasToken: boolean;
}

export function ApiDocsModal({ isOpen, onClose, hasToken }: ApiDocsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div
        className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              Automation API & n8n Integration Guide
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-600">
          {/* Security Notice */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start space-x-2.5">
            <Shield className="w-4 h-4 text-slate-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900">Bearer Token Authentication</p>
              <p className="text-slate-600 mt-0.5">
                All <code className="text-blue-700 font-mono">/api/v1/*</code> endpoints require the{' '}
                <code className="text-slate-800 font-mono">Authorization: Bearer &lt;TOKEN&gt;</code> header.
                Configure <code className="text-slate-800 font-mono">MATOS_INTERNAL_API_TOKEN</code> in{' '}
                <code className="text-slate-800 font-mono">.env.local</code>.
              </p>
              <div className="mt-2 flex items-center space-x-1.5">
                {hasToken ? (
                  <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Bearer Token Configured</span>
                  </span>
                ) : (
                  <span className="text-amber-700 font-semibold">
                    Token not configured in .env.local
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Endpoint 1: POST /api/v1/scans */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded font-mono font-bold bg-blue-100 text-blue-800">
                POST
              </span>
              <span className="font-mono font-semibold text-slate-900">/api/v1/scans</span>
            </div>
            <p className="text-slate-500">
              Triggers a performance audit for a URL (mobile, desktop, or both sequentially).
            </p>
            <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto">
{`curl -X POST http://localhost:3000/api/v1/scans \\
  -H "Authorization: Bearer YOUR_INTERNAL_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com",
    "strategy": "mobile"
  }'`}
            </pre>
          </div>

          {/* Endpoint 2: GET /api/v1/scans */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded font-mono font-bold bg-emerald-100 text-emerald-800">
                GET
              </span>
              <span className="font-mono font-semibold text-slate-900">/api/v1/scans</span>
            </div>
            <p className="text-slate-500">
              Retrieves historical scans with optional filtering by websiteId, url, strategy, or limit.
            </p>
            <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto">
{`curl -X GET "http://localhost:3000/api/v1/scans?strategy=mobile&limit=10" \\
  -H "Authorization: Bearer YOUR_INTERNAL_TOKEN"`}
            </pre>
          </div>

          {/* Endpoint 3: GET /api/v1/websites */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded font-mono font-bold bg-emerald-100 text-emerald-800">
                GET
              </span>
              <span className="font-mono font-semibold text-slate-900">/api/v1/websites</span>
            </div>
            <p className="text-slate-500">
              Lists all tracked websites with their latest mobile and desktop scores.
            </p>
          </div>

          {/* n8n Integration Note */}
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <p className="font-semibold text-blue-900">Future n8n Workflow Node Setup</p>
            <p className="text-blue-800 mt-1">
              In your n8n workflow, use the standard <strong>HTTP Request</strong> node with{' '}
              <code className="font-mono">Authentication: Generic Credential Type</code> (Header Auth) or{' '}
              send <code className="font-mono">Authorization: Bearer {`{{$env.MATOS_INTERNAL_API_TOKEN}}`}</code>.
              Response data is fully normalized JSON containing scores, Core Web Vitals, and prioritized diagnostics.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
