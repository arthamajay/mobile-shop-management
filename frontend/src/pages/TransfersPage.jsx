import React, { useEffect, useState, useCallback } from 'react';
import { Plus, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Dialog } from '@headlessui/react';
import Table from '../components/common/Table.jsx';
import Badge from '../components/common/Badge.jsx';
import TransferForm from '../components/forms/TransferForm.jsx';
import ConfirmModal from '../components/common/ConfirmModal.jsx';
import { getTransfers, requestTransfer, approveTransfer, rejectTransfer } from '../api/transfers';
import { useAuth } from '../context/AuthContext.jsx';

const STATUS_COLORS = { Pending: 'warning', Rejected: 'danger', Completed: 'success' };

function Modal({ open, onClose, title, children }) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">{title}</Dialog.Title>
          {children}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

export default function TransfersPage() {
  const { isAdmin } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const loadTransfers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTransfers(statusFilter ? { status: statusFilter } : {});
      setTransfers(data.transfers || []);
    } catch {
      toast.error('Failed to load transfers');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { loadTransfers(); }, [loadTransfers]);

  const handleCreate = async (data) => {
    setFormLoading(true);
    try {
      await requestTransfer(data);
      toast.success('Transfer request submitted');
      setShowCreate(false);
      loadTransfers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request transfer');
    } finally {
      setFormLoading(false);
    }
  };

  const handleApprove = async () => {
    setFormLoading(true);
    try {
      await approveTransfer(selected._id);
      toast.success('Transfer approved and completed');
      setShowApprove(false);
      loadTransfers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve transfer');
    } finally {
      setFormLoading(false);
    }
  };

  const handleReject = async () => {
    setFormLoading(true);
    try {
      await rejectTransfer(selected._id);
      toast.success('Transfer rejected, stock returned');
      setShowReject(false);
      loadTransfers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject transfer');
    } finally {
      setFormLoading(false);
    }
  };

  const columns = [
    { key: 'fromBranch', header: 'From', render: (v) => <Badge variant="info">{v}</Badge> },
    { key: 'toBranch', header: 'To', render: (v) => <Badge variant="purple">{v}</Badge> },
    { key: 'product', header: 'Product', render: (v) => v?.name || '—' },
    { key: 'quantity', header: 'Qty', render: (v) => <span className="font-semibold">{v}</span> },
    { key: 'requestedBy', header: 'Requested By', render: (v) => v?.name || '—' },
    { key: 'status', header: 'Status', render: (v) => <Badge variant={STATUS_COLORS[v] || 'gray'}>{v}</Badge> },
    { key: 'createdAt', header: 'Date', render: (v) => format(new Date(v), 'dd MMM yy') },
    {
      key: '_id', header: 'Actions',
      render: (_, row) => (
        <div className="flex gap-1.5">
          {isAdmin && row.status === 'Pending' && (
            <>
              <button onClick={() => { setSelected(row); setShowApprove(true); }}
                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Approve">
                <CheckCircle size={14} />
              </button>
              <button onClick={() => { setSelected(row); setShowReject(true); }}
                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Reject">
                <XCircle size={14} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Stock Transfers</h1>
          <p className="text-gray-500 text-sm mt-0.5">{transfers.length} transfers</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Request Transfer
        </button>
      </div>

      <div className="flex gap-3">
        <select className="input-field w-auto" value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {['Pending', 'Rejected', 'Completed'].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <Table columns={columns} data={transfers} loading={loading} emptyMessage="No transfers found" />

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Request Stock Transfer">
        <TransferForm onSubmit={handleCreate} loading={formLoading} />
      </Modal>

      <ConfirmModal
        open={showApprove}
        title="Approve Transfer"
        message={`Approve transfer of ${selected?.quantity} × ${selected?.product?.name} from ${selected?.fromBranch} to ${selected?.toBranch}?`}
        confirmLabel="Approve"
        onConfirm={handleApprove}
        onClose={() => setShowApprove(false)}
        loading={formLoading}
      />

      <ConfirmModal
        open={showReject}
        title="Reject Transfer"
        message={`Reject this transfer? Stock will be returned to ${selected?.fromBranch}.`}
        confirmLabel="Reject"
        dangerous
        onConfirm={handleReject}
        onClose={() => setShowReject(false)}
        loading={formLoading}
      />
    </div>
  );
}
