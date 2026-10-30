'use client';

import React, { useState } from 'react';
import { X, Globe, Building2, FileText, AlertCircle, Loader2 } from 'lucide-react';
import type { Website } from '@/types';

interface WebsiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingWebsite?: Website | null;
}

function WebsiteModalContent({
  onClose,
  onSave,
  editingWebsite,
}: {
  onClose: () => void;
  onSave: () => void;
  editingWebsite?: Website | null;
}) {
  const [displayName, setDisplayName] = useState(editingWebsite?.displayName || '');
  const [url, setUrl] = useState(editingWebsite?.url || '');
  const [businessName, setBusinessName] = useState(editingWebsite?.businessName || '');
  const [notes, setNotes] = useState(editingWebsite?.notes || '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!displayName.trim()) {
      setError('Display name is required.');
      return;
    }

    if (!editingWebsite && !url.trim()) {
      setError('Website URL is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = editingWebsite
        ? `/api/websites/${editingWebsite.id}`
        : '/api/websites';
      const method = editingWebsite ? 'PATCH' : 'POST';

      const payload = editingWebsite
        ? {
            displayName: displayName.trim(),
            businessName: businessName.trim() || null,
            notes: notes.trim() || null,
          }
        : {
            displayName: displayName.trim(),
            url: url.trim(),
            businessName: businessName.trim() || null,
            notes: notes.trim() || null,
          };

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save website.');
      }

      onSave();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error saving website.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div
        className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            {editingWebsite ? 'Edit Tracked Website' : 'Add Tracked Website'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-start space-x-2 p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Display Name */}
          <div>
            <label htmlFor="website-modal-name" className="block text-xs font-semibold text-slate-700 mb-1">
              Display Name *
            </label>
            <input
              type="text"
              id="website-modal-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Matos Systems Portal"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              disabled={isSubmitting}
            />
          </div>

          {/* URL Input */}
          <div>
            <label htmlFor="website-modal-url" className="block text-xs font-semibold text-slate-700 mb-1">
              Public Website URL *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Globe className="w-4 h-4" />
              </div>
              <input
                type="text"
                id="website-modal-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                disabled={Boolean(editingWebsite) || isSubmitting}
                className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg ${
                  editingWebsite
                    ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white'
                }`}
              />
            </div>
            {editingWebsite && (
              <p className="text-[11px] text-slate-400 mt-1">
                Domain cannot be changed after creation to preserve historical comparison continuity.
              </p>
            )}
          </div>

          {/* Business Name (Optional) */}
          <div>
            <label htmlFor="website-modal-business" className="block text-xs font-semibold text-slate-700 mb-1">
              Client / Business Name <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Building2 className="w-4 h-4" />
              </div>
              <input
                type="text"
                id="website-modal-business"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Matos Automation LLC"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Notes (Optional) */}
          <div>
            <label htmlFor="website-modal-notes" className="block text-xs font-semibold text-slate-700 mb-1">
              Internal Notes <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <div className="absolute top-2.5 left-3 pointer-events-none text-slate-400">
                <FileText className="w-4 h-4" />
              </div>
              <textarea
                id="website-modal-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="e.g. Next.js storefront, high mobile traffic from marketing campaign."
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white resize-none"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="website-modal-submit-btn"
              disabled={isSubmitting}
              className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors shadow-sm"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{editingWebsite ? 'Save Changes' : 'Create Website'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function WebsiteModal({
  isOpen,
  onClose,
  onSave,
  editingWebsite,
}: WebsiteModalProps) {
  if (!isOpen) return null;

  return (
    <WebsiteModalContent
      key={editingWebsite ? editingWebsite.id : 'new-site'}
      onClose={onClose}
      onSave={onSave}
      editingWebsite={editingWebsite}
    />
  );
}
