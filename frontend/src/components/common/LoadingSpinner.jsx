import React from 'react';

export default function LoadingSpinner({ message = 'Loading...', size = 'md', fullScreen = false }) {
  const sizeMap = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${sizeMap[size] || sizeMap.md} border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin`}
      />
      {message && <p className="text-sm text-gray-500">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return <div className="flex justify-center items-center py-8">{spinner}</div>;
}
