import React from 'react';
import { AlertCircle, Archive, Trash2, X } from 'lucide-react';
import { Button } from './button';

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default', // 'default', 'danger', 'warning'
  icon: CustomIcon
}) {
  if (!isOpen) return null;

  // Determine colors and icon based on variant
  let iconColor = 'text-gray-600';
  let buttonColor = 'bg-gray-900 hover:bg-gray-800';
  let Icon = CustomIcon || AlertCircle;

  if (variant === 'danger') {
    iconColor = 'text-red-600';
    buttonColor = 'bg-red-600 hover:bg-red-700';
    Icon = CustomIcon || Trash2;
  } else if (variant === 'warning') {
    iconColor = 'text-amber-600';
    buttonColor = 'bg-amber-600 hover:bg-amber-700';
    Icon = CustomIcon || Archive;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0`} />
            <h2 className="text-lg font-semibold text-gray-900 leading-none mt-3">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1.5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 text-base leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3 justify-end">
          <Button
            onClick={onClose}
            variant="outline"
            className="px-6"
          >
            {cancelText}
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`${buttonColor} text-white px-6`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
