import React from 'react';

/**
 * Unified loading spinner for the Operations tool
 * Uses the dark navy theme color (#1C2739)
 */
export function LoadingSpinner({ message = 'Loading...', size = 'default' }) {
  const sizeClasses = {
    small: 'w-6 h-6 border-2',
    default: 'w-10 h-10 border-[3px]',
    large: 'w-12 h-12 border-4'
  };

  return (
    <div className="flex items-center justify-center min-h-[200px] py-12">
      <div className="text-center">
        <div
          className={`${sizeClasses[size] || sizeClasses.default} border-gray-200 border-t-[#1C2739] rounded-full animate-spin mx-auto`}
        />
        {message && (
          <p className="text-gray-500 mt-4 text-sm">{message}</p>
        )}
      </div>
    </div>
  );
}
