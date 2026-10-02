import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Hash, Package } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import toast from 'react-hot-toast';
import Table from '../components/common/Table.jsx';
import Badge from '../components/common/Badge.jsx';
import ProductForm from '../components/forms/ProductForm.jsx';
import ConfirmModal from '../components/common/ConfirmModal.jsx';
import { getProducts, createProduct, updateProduct, deleteProduct, addIMEI } from '../api/products';
import { useAuth } from '../context/AuthContext.jsx';

const BRANCHES = ['Kukatpally', 'KPHB', 'Beeramguda'];
const CATEGORIES = ['Mobile', 'Accessory', 'Other'];

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

export default function InventoryPage() {
  const { isAdmin, user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showIMEI, setShowIMEI] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState(null);
  const [newImei, setNewImei] = useState('');
  const [filters, setFilters] = useState({ search: '', category: '', branch: '' });

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (isAdmin && filters.branch) params.branch = filters.branch;
      const data = await getProducts(params);
      setProducts(data.products || []);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [filters, isAdmin]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const handleCreate = async (data) => {
    setFormLoading(true);
    try {
      await createProduct(data);
      toast.success('Product created successfully');
      setShowAdd(false);
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create product');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (data) => {
    setFormLoading(true);
    try {
      await updateProduct(selected._id, data);
      toast.success('Product updated successfully');
      setShowEdit(false);
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update product');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    setFormLoading(true);
    try {
      await deleteProduct(selected._id);
      toast.success('Product deleted');
      setShowDelete(false);
      loadProducts();
    } catch (err) {
      toast.error('Failed to delete product');
    } finally {
      setFormLoading(false);
    }
  };

  const handleAddIMEI = async () => {
    if (!newImei.trim()) return;
    setFormLoading(true);
    try {
      await addIMEI(selected._id, newImei.trim());
      toast.success('IMEI added');
      setNewImei('');
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add IMEI');
    } finally {
      setFormLoading(false);
    }
  };

  const baseColumns = [
    { key: 'name', header: 'Product' },
    { key: 'category', header: 'Category', render: (v) => <Badge variant="info">{v}</Badge> },
    { key: 'price', header: 'Price', render: (v) => `₹${v.toLocaleString('en-IN')}` },
    {
      key: 'stock', header: 'Stock',
      render: (v, row) => (
        <span className={`font-semibold ${v <= row.lowStockThreshold ? 'text-red-600' : 'text-gray-700'}`}>
          {v} {v <= row.lowStockThreshold && <span className="text-xs font-normal">(Low)</span>}
        </span>
      ),
    },
    { key: 'branch', header: 'Branch', render: (v) => <Badge variant="purple">{v}</Badge> },
  ];

  // Admin-only columns
  const adminColumns = [
    {
      key: 'imeiNumbers', header: 'IMEIs',
      render: (v) => <span className="text-xs text-gray-500">{v?.length || 0} units</span>,
    },
    {
      key: '_id', header: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <button onClick={() => { setSelected(row); setShowEdit(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
            <Edit2 size={14} />
          </button>
          <button onClick={() => { setSelected(row); setShowIMEI(true); }} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="IMEI">
            <Hash size={14} />
          </button>
          <button onClick={() => { setSelected(row); setShowDelete(true); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  const columns = isAdmin ? [...baseColumns, ...adminColumns] : baseColumns;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="text-gray-500 text-sm mt-0.5">{products.length} products</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Product
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-9" placeholder="Search products..." value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} />
        </div>
        <select className="input-field w-auto" value={filters.category}
          onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        {isAdmin && (
          <select className="input-field w-auto" value={filters.branch}
            onChange={(e) => setFilters((f) => ({ ...f, branch: e.target.value }))}>
            <option value="">All Branches</option>
            {BRANCHES.map((b) => <option key={b}>{b}</option>)}
          </select>
        )}
      </div>

      <Table columns={columns} data={products} loading={loading} emptyMessage="No products found" />

      {/* Add Product Modal — admin only */}
      {isAdmin && (
        <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Product">
          <ProductForm onSubmit={handleCreate} loading={formLoading} />
        </Modal>
      )}

      {/* Edit Product Modal — admin only */}
      {isAdmin && (
        <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Product">
          {selected && (
            <ProductForm defaultValues={selected} onSubmit={handleUpdate} loading={formLoading} />
          )}
        </Modal>
      )}

      {/* IMEI Management Modal — admin only */}
      {isAdmin && (
        <Modal open={showIMEI} onClose={() => setShowIMEI(false)} title={`IMEI Management — ${selected?.name}`}>
          {selected && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Current IMEIs ({selected.imeiNumbers?.length || 0})</h4>
                {selected.imeiNumbers?.length > 0 ? (
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 max-h-48 overflow-y-auto">
                    {selected.imeiNumbers.map((imei, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-mono text-gray-600">
                        <Hash size={12} className="text-gray-400" />
                        {imei}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">No IMEIs registered</p>
                )}
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Add New IMEI</h4>
                <div className="flex gap-2">
                  <input
                    className="input-field flex-1"
                    placeholder="15-digit IMEI"
                    maxLength={15}
                    value={newImei}
                    onChange={(e) => setNewImei(e.target.value.replace(/\D/g, ''))}
                  />
                  <button onClick={handleAddIMEI} disabled={formLoading || newImei.length !== 15} className="btn-primary px-4">
                    Add
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">IMEI must be exactly 15 digits and pass Luhn check</p>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Delete Confirm — admin only */}
      {isAdmin && (
        <ConfirmModal
          open={showDelete}
          title="Delete Product"
          message={`Are you sure you want to delete "${selected?.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          dangerous
          onConfirm={handleDelete}
          onClose={() => setShowDelete(false)}
          loading={formLoading}
        />
      )}
    </div>
  );
}
