import React from 'react';

const variantClasses = {
  success: 'bg-green-100 text-green-700 border border-green-200',
  warning: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  danger: 'bg-red-100 text-red-700 border border-red-200',
  info: 'bg-blue-100 text-blue-700 border border-blue-200',
  purple: 'bg-purple-100 text-purple-700 border border-purple-200',
  gray: 'bg-gray-100 text-gray-600 border border-gray-200',
  orange: 'bg-orange-100 text-orange-700 border border-orange-200',
};

export default function Badge({ children, variant = 'gray', size = 'sm' }) {
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${variantClasses[variant] || variantClasses.gray}`}>
      {children}
    </span>
  );
}
