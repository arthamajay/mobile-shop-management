import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import Badge from '../components/common/Badge.jsx';
import {
  getBranchComparison, getTopProducts, getEmployeePerformance, getRevenueChart,
} from '../api/analytics';

export default function AnalyticsPage() {
  const [branchData, setBranchData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [revenueChart, setRevenueChart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [bc, tp, ep, rc] = await Promise.all([
          getBranchComparison(),
          getTopProducts(),
          getEmployeePerformance(),
          getRevenueChart(days),
        ]);
        setBranchData(bc.data || []);
        setTopProducts(tp.data || []);
        setEmployees(ep.data || []);
        setRevenueChart(
          (rc.data || []).map((d) => ({
            ...d,
            date: format(parseISO(d.date), 'MMM dd'),
          }))
        );
      } catch {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [days]);

  if (loading) return <LoadingSpinner message="Loading analytics..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Analytics</h1>
        <select className="input-field w-auto" value={days} onChange={(e) => setDays(Number(e.target.value))}>
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
          <option value={60}>Last 60 days</option>
        </select>
      </div>

      {/* Revenue Chart */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Daily Revenue (Last {days} days)</h2>
        {revenueChart.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={revenueChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} dot={false} name="Revenue (₹)" />
              <Line type="monotone" dataKey="bills" stroke="#93c5fd" strokeWidth={2} dot={false} name="Bills" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-400 text-center py-8">No data available</p>
        )}
      </div>

      {/* Branch Comparison */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Branch Comparison (Last 30 days)</h2>
        {branchData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={branchData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="_id" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v, name) => [name === 'revenue' ? `₹${v.toLocaleString('en-IN')}` : v, name === 'revenue' ? 'Revenue' : 'Bills']} />
              <Legend />
              <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} name="Revenue (₹)" />
              <Bar dataKey="bills" fill="#bfdbfe" radius={[4, 4, 0, 0]} name="Bills" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-400 text-center py-8">No data available</p>
        )}
      </div>

      {/* Top Products */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Top Products (This Month)</h2>
        {topProducts.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="productName" tick={{ fontSize: 11 }} width={140} />
              <Tooltip formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#2563eb" radius={[0, 4, 4, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-400 text-center py-8">No data available</p>
        )}
      </div>

      {/* Employee Performance */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Employee Performance (This Month)</h2>
        {employees.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left p-3 text-xs text-gray-500 font-semibold uppercase">Name</th>
                <th className="text-left p-3 text-xs text-gray-500 font-semibold uppercase">Branch</th>
                <th className="text-center p-3 text-xs text-gray-500 font-semibold uppercase">Bills</th>
                <th className="text-right p-3 text-xs text-gray-500 font-semibold uppercase">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-3 font-medium">{emp.name}</td>
                  <td className="p-3"><Badge variant="purple">{emp.branch}</Badge></td>
                  <td className="p-3 text-center font-semibold text-primary-700">{emp.bills}</td>
                  <td className="p-3 text-right font-semibold text-green-700">
                    ₹{emp.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-400 text-center py-8">No employee data available</p>
        )}
      </div>
    </div>
  );
}
