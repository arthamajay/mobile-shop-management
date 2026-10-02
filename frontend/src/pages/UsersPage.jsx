import React, { useEffect, useState, useCallback } from 'react';
import { Plus, UserCheck, UserX, Edit2 } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Badge from '../components/common/Badge.jsx';
import Table from '../components/common/Table.jsx';
import ConfirmModal from '../components/common/ConfirmModal.jsx';
import { getUsers, register as registerUser, updateUser } from '../api/auth.js';

const BRANCHES = ['Kukatpally', 'KPHB', 'Beeramguda'];

function Modal({ open, onClose, title, children }) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">{title}</Dialog.Title>
          {children}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

// ── Add Salesperson Form ──────────────────────────────────────────────────────
function AddUserForm({ onSubmit, loading }) {
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: { name: '', email: '', password: '', branch: '' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Full Name *</label>
        <input
          className="input-field"
          placeholder="e.g. Ravi Kumar"
          {...register('name', {
            required: 'Name is required',
            minLength: { value: 2, message: 'Name must be at least 2 characters' },
          })}
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="label">Email *</label>
        <input
          type="email"
          className="input-field"
          placeholder="ravi@vamshistore.com"
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email address' },
          })}
        />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <label className="label">Password *</label>
        <input
          type="password"
          className="input-field"
          placeholder="Min. 6 characters"
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 6, message: 'Password must be at least 6 characters' },
          })}
        />
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
      </div>

      <div>
        <label className="label">Branch *</label>
        <select
          className="input-field"
          {...register('branch', { required: 'Branch is required' })}
        >
          <option value="">Select branch</option>
          {BRANCHES.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        {errors.branch && <p className="text-red-500 text-xs mt-1">{errors.branch.message}</p>}
      </div>

      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Creating...' : 'Create Salesperson'}
        </button>
      </div>
    </form>
  );
}

// ── Edit Branch Form ──────────────────────────────────────────────────────────
function EditBranchForm({ user, onSubmit, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { branch: user?.branch || '' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <p className="text-sm text-gray-600">
        Updating branch for <strong>{user?.name}</strong>
      </p>
      <div>
        <label className="label">New Branch *</label>
        <select
          className="input-field"
          {...register('branch', { required: 'Branch is required' })}
        >
          <option value="">Select branch</option>
          {BRANCHES.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        {errors.branch && <p className="text-red-500 text-xs mt-1">{errors.branch.message}</p>}
      </div>
      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Saving...' : 'Update Branch'}
        </button>
      </div>
    </form>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [showEditBranch, setShowEditBranch] = useState(false);
  const [showToggleConfirm, setShowToggleConfirm] = useState(false);
  const [selected, setSelected] = useState(null);

  const [branchFilter, setBranchFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUsers(branchFilter ? { branch: branchFilter } : {});
      let list = data.users || [];
      if (roleFilter) list = list.filter((u) => u.role === roleFilter);
      setUsers(list);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [branchFilter, roleFilter]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleAdd = async (data) => {
    setFormLoading(true);
    try {
      await registerUser({ ...data, role: 'salesperson' });
      toast.success(`Salesperson ${data.name} created`);
      setShowAdd(false);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditBranch = async (data) => {
    setFormLoading(true);
    try {
      await updateUser(selected._id, { branch: data.branch });
      toast.success(`Branch updated to ${data.branch}`);
      setShowEditBranch(false);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update branch');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async () => {
    setFormLoading(true);
    try {
      await updateUser(selected._id, { isActive: !selected.isActive });
      toast.success(`${selected.name} ${selected.isActive ? 'deactivated' : 'activated'}`);
      setShowToggleConfirm(false);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    } finally {
      setFormLoading(false);
    }
  };

  // ── Table columns ────────────────────────────────────────────────────────────

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (v, row) => (
        <div>
          <p className="font-medium text-gray-900">{v}</p>
          <p className="text-xs text-gray-400">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (v) => (
        <Badge variant={v === 'admin' ? 'danger' : 'info'}>
          {v === 'admin' ? 'Admin' : 'Salesperson'}
        </Badge>
      ),
    },
    {
      key: 'branch',
      header: 'Branch',
      render: (v, row) =>
        v ? (
          <Badge variant="purple">{v}</Badge>
        ) : (
          <span className="text-xs text-gray-400 italic">All branches</span>
        ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (v) =>
        v ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="danger">Inactive</Badge>
        ),
    },
    {
      key: 'createdAt',
      header: 'Added',
      render: (v) => (
        <span className="text-sm text-gray-500">{format(new Date(v), 'dd MMM yyyy')}</span>
      ),
    },
    {
      key: '_id',
      header: 'Actions',
      render: (_, row) => (
        <div className="flex gap-1.5">
          {/* Only salespersons can have their branch changed */}
          {row.role === 'salesperson' && (
            <button
              onClick={() => { setSelected(row); setShowEditBranch(true); }}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Change Branch"
            >
              <Edit2 size={14} />
            </button>
          )}
          {/* Admins cannot deactivate themselves or other admins */}
          {row.role === 'salesperson' && (
            <button
              onClick={() => { setSelected(row); setShowToggleConfirm(true); }}
              className={`p-1.5 rounded-lg transition-colors ${
                row.isActive
                  ? 'text-orange-500 hover:bg-orange-50'
                  : 'text-green-600 hover:bg-green-50'
              }`}
              title={row.isActive ? 'Deactivate' : 'Activate'}
            >
              {row.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
            </button>
          )}
        </div>
      ),
    },
  ];

  const salespersonCount = users.filter((u) => u.role === 'salesperson').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Staff Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {salespersonCount} salesperson{salespersonCount !== 1 ? 's' : ''} across {BRANCHES.length} branches
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Add Salesperson
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          className="input-field w-auto"
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
        >
          <option value="">All Branches</option>
          {BRANCHES.map((b) => <option key={b}>{b}</option>)}
        </select>
        <select
          className="input-field w-auto"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="salesperson">Salesperson</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={users}
        loading={loading}
        emptyMessage="No users found"
      />

      {/* Add Salesperson Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Salesperson">
        <AddUserForm onSubmit={handleAdd} loading={formLoading} />
      </Modal>

      {/* Edit Branch Modal */}
      <Modal
        open={showEditBranch}
        onClose={() => setShowEditBranch(false)}
        title="Change Branch"
      >
        <EditBranchForm
          user={selected}
          onSubmit={handleEditBranch}
          loading={formLoading}
        />
      </Modal>

      {/* Toggle Active Confirm */}
      <ConfirmModal
        open={showToggleConfirm}
        title={selected?.isActive ? 'Deactivate Salesperson' : 'Activate Salesperson'}
        message={
          selected?.isActive
            ? `Deactivating ${selected?.name} will prevent them from logging in. You can re-activate them at any time.`
            : `${selected?.name} will be able to log in again.`
        }
        confirmLabel={selected?.isActive ? 'Deactivate' : 'Activate'}
        dangerous={selected?.isActive}
        onConfirm={handleToggleActive}
        onClose={() => setShowToggleConfirm(false)}
        loading={formLoading}
      />
    </div>
  );
}
