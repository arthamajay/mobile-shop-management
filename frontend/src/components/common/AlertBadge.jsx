import React from 'react';

export default function AlertBadge({ count }) {
  if (!count || count <= 0) return null;
  return (
    <span className="inline-flex items-center justify-center w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full leading-none">
      {count > 9 ? '9+' : count}
    </span>
  );
}
