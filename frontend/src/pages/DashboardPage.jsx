import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Receipt, AlertTriangle, Package } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import StatCard from '../components/common/StatCard.jsx';
import { getDashboardStats } from '../api/analytics';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const branch = isAdmin ? undefined : user?.branch;
    getDashboardStats(branch)
      .then((d) => setStats(d.stats))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, [user, isAdmin]);

  const branchChartData = (stats?.branchRevenue || []).map((b) => ({
    branch: b._id,
    revenue: Number(b.revenue.toFixed(2)),
    bills: b.bills,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          {isAdmin ? 'All branches overview' : `${user?.branch} branch overview`} • {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Today's Revenue"
          value={`₹${(stats?.todayRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          color="green"
          loading={loading}
        />
        <StatCard
          icon={Receipt}
          label="Bills Today"
          value={stats?.totalBillsToday ?? 0}
          color="blue"
          loading={loading}
        />
        <StatCard
          icon={AlertTriangle}
          label="Active Alerts"
          value={stats?.activeAlerts ?? 0}
          color="orange"
          loading={loading}
        />
        <StatCard
          icon={Package}
          label="Low Stock Items"
          value={stats?.lowStockItems ?? 0}
          color="red"
          loading={loading}
        />
      </div>

      {/* Admin: branch comparison chart */}
      {isAdmin && branchChartData.length > 0 && (
        <div className="card">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Today's Revenue by Branch</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={branchChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="branch" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
              <Legend />
              <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} name="Revenue (₹)" />
              <Bar dataKey="bills" fill="#93c5fd" radius={[4, 4, 0, 0]} name="Bills" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Quick Links */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'New Bill', icon: Receipt, path: '/billing', color: 'bg-blue-500' },
            { label: 'Inventory', icon: Package, path: '/inventory', color: 'bg-green-500' },
            { label: 'Alerts', icon: AlertTriangle, path: '/alerts', color: 'bg-red-500' },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-all group"
              >
                <div className={`${action.color} p-2.5 rounded-lg`}>
                  <Icon size={18} className="text-white" />
                </div>
                <span className="text-xs font-medium text-gray-700">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
