import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText } from 'lucide-react';

export const PlanNameModal = ({ isOpen, onClose, onConfirm, title = 'Enter plan name', defaultValue = '' }) => {
  const [planName, setPlanName] = useState(defaultValue);

  useEffect(() => {
    setPlanName(defaultValue);
  }, [defaultValue, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (planName.trim()) {
      onConfirm(planName.trim());
      setPlanName('');
    }
  };

  const handleCancel = () => {
    onClose();
    setPlanName('');
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 transition-colors"
          type="button"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-8">
          {/* Icon and Title */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#117753' }}>
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {title}
            </h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="plan-name" className="block text-sm font-medium text-gray-700 mb-2">
                Plan Name
              </label>
              <input
                id="plan-name"
                type="text"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="e.g., North Valley Vineyard"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:border-transparent text-gray-900 placeholder-gray-400"
                style={{
                  outline: 'none',
                  '--tw-ring-color': '#117753'
                }}
                autoFocus
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!planName.trim()}
                className="px-6 py-2.5 rounded-lg text-white font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#117753' }}
              >
                Create Plan
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};
