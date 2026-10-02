import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { getProducts } from '../../api/products';
import { useAuth } from '../../context/AuthContext.jsx';
import toast from 'react-hot-toast';

const BRANCHES = ['Kukatpally', 'KPHB', 'Beeramguda'];

export default function TransferForm({ onSubmit, loading }) {
  const { user, isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      fromBranch: isAdmin ? '' : user?.branch,
      toBranch: '',
      productId: '',
      quantity: 1,
      notes: '',
    },
  });

  const fromBranch = watch('fromBranch');

  useEffect(() => {
    if (fromBranch) {
      getProducts({ branch: fromBranch })
        .then((d) => setProducts(d.products || []))
        .catch(() => toast.error('Failed to load products'));
    } else {
      setProducts([]);
    }
  }, [fromBranch]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">From Branch *</label>
          {isAdmin ? (
            <select className="input-field" {...register('fromBranch', { required: true })}>
              <option value="">Select branch</option>
              {BRANCHES.map((b) => <option key={b}>{b}</option>)}
            </select>
          ) : (
            <input className="input-field bg-gray-50" value={user?.branch} readOnly />
          )}
        </div>
        <div>
          <label className="label">To Branch *</label>
          <select className="input-field" {...register('toBranch', { required: 'Destination branch required' })}>
            <option value="">Select branch</option>
            {BRANCHES.filter((b) => b !== fromBranch).map((b) => <option key={b}>{b}</option>)}
          </select>
          {errors.toBranch && <p className="text-red-500 text-xs mt-1">{errors.toBranch.message}</p>}
        </div>
      </div>

      <div>
        <label className="label">Product *</label>
        <select className="input-field" {...register('productId', { required: 'Product is required' })}>
          <option value="">Select product</option>
          {products.map((p) => (
            <option key={p._id} value={p._id} disabled={p.stock <= 0}>
              {p.name} — Stock: {p.stock}
            </option>
          ))}
        </select>
        {errors.productId && <p className="text-red-500 text-xs mt-1">{errors.productId.message}</p>}
      </div>

      <div>
        <label className="label">Quantity *</label>
        <input type="number" min="1" className="input-field"
          {...register('quantity', { required: true, min: { value: 1, message: 'Min 1' }, valueAsNumber: true })} />
        {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity.message}</p>}
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea className="input-field" rows={2} {...register('notes')} placeholder="Optional notes..." />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Submitting...' : 'Request Transfer'}
      </button>
    </form>
  );
}
