import React from 'react';
import { Dialog } from '@headlessui/react';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
  dangerous = false,
  loading = false,
}) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <div className="flex items-start gap-4">
            <div className={`p-2.5 rounded-full ${dangerous ? 'bg-red-100' : 'bg-yellow-100'}`}>
              <AlertTriangle size={22} className={dangerous ? 'text-red-600' : 'text-yellow-600'} />
            </div>
            <div className="flex-1">
              <Dialog.Title className="text-base font-semibold text-gray-900 mb-1">
                {title}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-gray-500">
                {message}
              </Dialog.Description>
            </div>
          </div>

          <div className="flex gap-3 mt-6 justify-end">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${
                dangerous
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-primary-600 hover:bg-primary-700'
              }`}
            >
              {loading ? 'Processing...' : confirmLabel}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
