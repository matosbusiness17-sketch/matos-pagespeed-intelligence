'use client';

import React, { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { Website } from '@/types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  website: Website | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({
  isOpen,
  website,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !website) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/websites/${website.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete website.');
      }

      onConfirm();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error deleting website.';
      setError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div
        className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-5 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Remove Tracked Website</h3>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to remove{' '}
              <strong className="text-slate-700">{website.displayName}</strong> ({website.domain})?
              Historical scan records will be preserved.
            </p>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-xs text-rose-600 bg-rose-50 p-2 rounded border border-rose-200">
            {error}
          </p>
        )}

        <div className="mt-5 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            id="confirm-delete-btn"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 rounded-lg transition-colors shadow-sm"
          >
            {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Delete Website</span>
          </button>
        </div>
      </div>
    </div>
  );
}
