import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ icon: Icon, label, value, trend, trendLabel, color = 'blue', loading }) {
  const colorMap = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-100' },
    green: { bg: 'bg-green-50', icon: 'text-green-600', border: 'border-green-100' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-100' },
    red: { bg: 'bg-red-50', icon: 'text-red-600', border: 'border-red-100' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-100' },
  };

  const colors = colorMap[color] || colorMap.blue;

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 bg-gray-200 rounded-lg" />
          <div className="w-16 h-4 bg-gray-200 rounded" />
        </div>
        <div className="w-24 h-7 bg-gray-200 rounded mb-1" />
        <div className="w-32 h-4 bg-gray-100 rounded" />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border ${colors.border} p-6 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`${colors.bg} p-2.5 rounded-lg`}>
          {Icon && <Icon size={22} className={colors.icon} />}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
      {trendLabel && <p className="text-xs text-gray-400 mt-1">{trendLabel}</p>}
    </div>
  );
}
