import React, { useEffect, useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import ReconciliationForm from '../components/forms/ReconciliationForm.jsx';
import Badge from '../components/common/Badge.jsx';
import Table from '../components/common/Table.jsx';
import { submitReconciliation, getReconciliations } from '../api/reconciliation';
import { getDailySummary } from '../api/bills';
import { useAuth } from '../context/AuthContext.jsx';

export default function ReconciliationPage() {
  const { user, isAdmin } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expectedCash, setExpectedCash] = useState(undefined);
  const [dateFilter, setDateFilter] = useState('');

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateFilter) { params.startDate = dateFilter; params.endDate = dateFilter; }
      const data = await getReconciliations(params);
      setRecords(data.reconciliations || []);
    } catch {
      toast.error('Failed to load reconciliations');
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  const handleOpen = async () => {
    // Load expected cash for today
    try {
      const branch = isAdmin ? undefined : user?.branch;
      const data = await getDailySummary(branch, new Date().toISOString().slice(0, 10));
      setExpectedCash(data.summary?.cashRevenue || 0);
    } catch {
      setExpectedCash(undefined);
    }
    setShowForm(true);
  };

  const handleSubmit = async (data) => {
    setFormLoading(true);
    try {
      await submitReconciliation({ ...data, physicalCount: Number(data.physicalCount) });
      toast.success('Reconciliation submitted');
      setShowForm(false);
      loadRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit reconciliation');
    } finally {
      setFormLoading(false);
    }
  };

  const columns = [
    { key: 'branch', header: 'Branch', render: (v) => <Badge variant="purple">{v}</Badge> },
    { key: 'date', header: 'Date', render: (v) => format(new Date(v), 'dd MMM yyyy') },
    { key: 'submittedBy', header: 'Submitted By', render: (v) => v?.name || '—' },
    { key: 'expectedCash', header: 'Expected', render: (v) => `₹${Number(v).toFixed(2)}` },
    { key: 'physicalCount', header: 'Physical Count', render: (v) => `₹${Number(v).toFixed(2)}` },
    {
      key: 'discrepancy', header: 'Discrepancy',
      render: (v) => (
        <span className={Math.abs(v) < 1 ? 'text-green-600 font-medium' : 'text-red-600 font-semibold'}>
          {v >= 0 ? '+' : ''}₹{Number(v).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'status', header: 'Status',
      render: (v) => <Badge variant={v === 'matched' ? 'success' : 'danger'}>{v === 'matched' ? 'Matched ✓' : 'Mismatch ✗'}</Badge>,
    },
    { key: 'createdAt', header: 'Submitted At', render: (v) => format(new Date(v), 'dd MMM, hh:mm a') },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Cash Reconciliation</h1>
          <p className="text-gray-500 text-sm mt-0.5">End-of-day cash count verification</p>
        </div>
        <button onClick={handleOpen} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Submit Count
        </button>
      </div>

      <div className="flex gap-3">
        <input type="date" className="input-field w-auto" value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          placeholder="Filter by date" />
        {dateFilter && (
          <button onClick={() => setDateFilter('')} className="btn-secondary text-sm">Clear</button>
        )}
      </div>

      {/* Summary stats for today */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {['matched', 'mismatch'].map((s) => {
          const count = records.filter((r) => r.status === s).length;
          return (
            <div key={s} className={`card border-l-4 ${s === 'matched' ? 'border-green-400' : 'border-red-400'}`}>
              <p className="text-sm text-gray-500 capitalize">{s === 'matched' ? '✅ Matched' : '❌ Mismatch'}</p>
              <p className="text-2xl font-bold mt-1 text-gray-800">{count}</p>
            </div>
          );
        })}
        <div className="card border-l-4 border-primary-400">
          <p className="text-sm text-gray-500">Total Records</p>
          <p className="text-2xl font-bold mt-1 text-gray-800">{records.length}</p>
        </div>
      </div>

      <Table columns={columns} data={records} loading={loading} emptyMessage="No reconciliation records found" />

      <Dialog open={showForm} onClose={() => setShowForm(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">Submit Cash Count</Dialog.Title>
            <ReconciliationForm onSubmit={handleSubmit} loading={formLoading} expectedCash={expectedCash} />
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
