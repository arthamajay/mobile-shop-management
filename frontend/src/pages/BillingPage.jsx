import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Eye, XCircle, CheckCircle, Download } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Table from '../components/common/Table.jsx';
import Badge from '../components/common/Badge.jsx';
import BillForm from '../components/forms/BillForm.jsx';
import ConfirmModal from '../components/common/ConfirmModal.jsx';
import { getBills, getBill, createBill, requestCancellation, approveCancellation } from '../api/bills';
import { useAuth } from '../context/AuthContext.jsx';

function Modal({ open, onClose, title, children, wide }) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className={`bg-white rounded-2xl shadow-xl ${wide ? 'max-w-2xl' : 'max-w-lg'} w-full p-6 max-h-[90vh] overflow-y-auto`}>
          <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">{title}</Dialog.Title>
          {children}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

const statusBadge = (status, cancelRequest) => {
  if (status === 'cancelled') return <Badge variant="danger">Cancelled</Badge>;
  if (cancelRequest?.requested && !cancelRequest?.approvedAt) return <Badge variant="warning">Cancel Pending</Badge>;
  return <Badge variant="success">Active</Badge>;
};

const paymentBadge = (mode) => {
  const map = { Cash: 'success', UPI: 'info', Card: 'purple' };
  return <Badge variant={map[mode] || 'gray'}>{mode}</Badge>;
};

export default function BillingPage() {
  const { isAdmin } = useAuth();
  const [bills, setBills] = useState([]);
  const [totalBills, setTotalBills] = useState(0);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [selected, setSelected] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [filters, setFilters] = useState({ search: '', status: '', startDate: '', endDate: '' });

  const loadBills = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBills(filters);
      setBills(data.bills || []);
      setTotalBills(data.total || 0);
    } catch {
      toast.error('Failed to load bills');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadBills(); }, [loadBills]);

  const openDetail = async (bill) => {
    try {
      const data = await getBill(bill._id);
      setSelected(data.bill);
      setShowDetail(true);
    } catch {
      toast.error('Failed to load bill details');
    }
  };

  const handleCreate = async (data) => {
    setFormLoading(true);
    try {
      await createBill(data);
      toast.success('Bill created successfully!');
      setShowCreate(false);
      loadBills();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create bill');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    setFormLoading(true);
    try {
      await requestCancellation(selected._id, cancelReason);
      toast.success('Cancellation request submitted');
      setShowCancel(false);
      setCancelReason('');
      loadBills();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request cancellation');
    } finally {
      setFormLoading(false);
    }
  };

  const handleApproveCancel = async () => {
    setFormLoading(true);
    try {
      await approveCancellation(selected._id);
      toast.success('Bill cancelled and stock restored');
      setShowApprove(false);
      loadBills();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve cancellation');
    } finally {
      setFormLoading(false);
    }
  };

  const columns = [
    { key: 'billNumber', header: 'Bill No', render: (v) => <span className="font-mono text-xs font-semibold text-primary-700">{v}</span> },
    { key: 'customer', header: 'Customer', render: (v) => `${v?.name} (${v?.phone})` },
    { key: 'grandTotal', header: 'Total', render: (v) => `₹${v?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
    { key: 'paymentMode', header: 'Payment', render: (v) => paymentBadge(v) },
    { key: 'branch', header: 'Branch', render: (v) => <Badge variant="purple">{v}</Badge> },
    { key: 'createdAt', header: 'Date', render: (v) => format(new Date(v), 'dd MMM yyyy, hh:mm a') },
    { key: 'status', header: 'Status', render: (v, row) => statusBadge(v, row.cancelRequest) },
    {
      key: '_id', header: 'Actions',
      render: (_, row) => (
        <div className="flex gap-1.5">
          <button onClick={() => openDetail(row)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="View">
            <Eye size={14} />
          </button>
          {row.status === 'active' && !row.cancelRequest?.requested && (
            <button onClick={() => { setSelected(row); setShowCancel(true); }} className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg" title="Request Cancel">
              <XCircle size={14} />
            </button>
          )}
          {isAdmin && row.cancelRequest?.requested && !row.cancelRequest?.approvedAt && row.status === 'active' && (
            <button onClick={() => { setSelected(row); setShowApprove(true); }} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Approve Cancel">
              <CheckCircle size={14} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Billing</h1>
          <p className="text-gray-500 text-sm mt-0.5">{totalBills} bill{totalBills !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Bill
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-9" placeholder="Search by bill no or customer..." value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} />
        </div>
        <select className="input-field w-auto" value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input type="date" className="input-field w-auto" value={filters.startDate}
          onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))} />
        <input type="date" className="input-field w-auto" value={filters.endDate}
          onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))} />
      </div>

      <Table columns={columns} data={bills} loading={loading} emptyMessage="No bills found" />

      {/* Create Bill Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Bill" wide>
        <BillForm onSubmit={handleCreate} loading={formLoading} />
      </Modal>

      {/* Bill Detail Modal */}
      <Modal open={showDetail} onClose={() => setShowDetail(false)} title={`Bill ${selected?.billNumber}`} wide>
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Customer</p>
                <p className="font-medium">{selected.customer?.name}</p>
                <p className="text-gray-600">{selected.customer?.phone}</p>
              </div>
              <div>
                <p className="text-gray-500">Details</p>
                <p className="font-medium">{selected.branch}</p>
                <p className="text-gray-600">{format(new Date(selected.createdAt), 'dd MMM yyyy, hh:mm a')}</p>
              </div>
            </div>

            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-2 text-xs text-gray-500">Product</th>
                  <th className="text-left p-2 text-xs text-gray-500">IMEI</th>
                  <th className="text-center p-2 text-xs text-gray-500">Qty</th>
                  <th className="text-right p-2 text-xs text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody>
                {selected.items?.map((item, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="p-2">{item.productName}</td>
                    <td className="p-2 font-mono text-xs text-gray-500">{item.imei || '—'}</td>
                    <td className="p-2 text-center">{item.quantity}</td>
                    <td className="p-2 text-right">₹{item.totalPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="text-right space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal:</span><span>₹{selected.subtotal?.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">GST (18%):</span><span>₹{selected.totalGST?.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-base"><span>Grand Total:</span><span className="text-primary-700">₹{selected.grandTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
            </div>

            <div className="flex gap-3 flex-wrap text-sm">
              {paymentBadge(selected.paymentMode)}
              {statusBadge(selected.status, selected.cancelRequest)}
              {selected.whatsappSent && <Badge variant="success">WhatsApp Sent</Badge>}
            </div>

            {selected.pdfUrl && (
              <a
                href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'}${selected.pdfUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary-600 hover:underline"
              >
                <Download size={14} /> Download PDF Invoice
              </a>
            )}

            {selected.cancelRequest?.requested && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                <p className="font-medium text-yellow-800">Cancel Requested</p>
                <p className="text-yellow-700">Reason: {selected.cancelRequest.reason}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Cancel Request Modal */}
      <Dialog open={showCancel} onClose={() => setShowCancel(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">Request Bill Cancellation</Dialog.Title>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Bill: <strong>{selected?.billNumber}</strong></p>
              <div>
                <label className="label">Reason for cancellation *</label>
                <textarea className="input-field" rows={3} value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)} placeholder="Please provide a reason..." />
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowCancel(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleCancelRequest} disabled={!cancelReason.trim() || formLoading} className="btn-danger">
                  {formLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Approve Cancel Modal */}
      <ConfirmModal
        open={showApprove}
        title="Approve Bill Cancellation"
        message={`Approve cancellation of bill ${selected?.billNumber}? Stock will be restored.`}
        confirmLabel="Approve & Cancel"
        dangerous
        onConfirm={handleApproveCancel}
        onClose={() => setShowApprove(false)}
        loading={formLoading}
      />
    </div>
  );
}
