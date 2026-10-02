import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { getProducts } from '../../api/products';
import { useAuth } from '../../context/AuthContext.jsx';
import toast from 'react-hot-toast';

const GST_RATE = 0.18;

export default function BillForm({ onSubmit, loading }) {
  const { user, isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [totals, setTotals] = useState({ subtotal: 0, gst: 0, grand: 0 });

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      customer: { name: '', phone: '' },
      paymentMode: 'Cash',
      branch: isAdmin ? '' : user?.branch,
      items: [{ productId: '', imei: '', quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');
  const watchedBranch = watch('branch');

  useEffect(() => {
    const branch = isAdmin ? watchedBranch : user?.branch;
    if (branch) {
      getProducts({ branch })
        .then((d) => setProducts(d.products || []))
        .catch(() => toast.error('Failed to load products'));
    }
  }, [watchedBranch, user?.branch, isAdmin]);

  // Recompute totals whenever any item field or the product list changes.
  // We stringify watchedItems because useEffect does shallow comparison —
  // nested field changes (productId, quantity) don't change the array reference.
  useEffect(() => {
    let subtotal = 0;
    let gst = 0;
    (watchedItems || []).forEach((item) => {
      const product = products.find((p) => String(p._id) === String(item.productId));
      const qty = Number(item.quantity) || 0;
      if (product && qty > 0) {
        const base = product.price * qty;
        const gstAmt = base * GST_RATE;
        subtotal += base;
        gst += gstAmt;
      }
    });
    setTotals({ subtotal, gst, grand: subtotal + gst });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(watchedItems), products]);

  const handleFormSubmit = (data) => {
    const branch = isAdmin ? data.branch : user?.branch;
    onSubmit({ ...data, branch });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* Customer */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Customer Details</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Name *</label>
            <input className="input-field" placeholder="Customer name" {...register('customer.name', { required: true })} />
          </div>
          <div>
            <label className="label">Phone *</label>
            <input className="input-field" placeholder="10-digit phone" maxLength={10}
              {...register('customer.phone', { required: true, pattern: { value: /^\d{10}$/, message: '10 digits required' } })} />
            {errors.customer?.phone && <p className="text-red-500 text-xs mt-1">{errors.customer.phone.message}</p>}
          </div>
        </div>
      </div>

      {/* Branch (admin only) */}
      {isAdmin && (
        <div>
          <label className="label">Branch *</label>
          <select className="input-field" {...register('branch', { required: true })}>
            <option value="">Select branch</option>
            {['Kukatpally', 'KPHB', 'Beeramguda'].map((b) => <option key={b}>{b}</option>)}
          </select>
        </div>
      )}

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Items</h3>
          <button type="button" onClick={() => append({ productId: '', imei: '', quantity: 1 })}
            className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium">
            <Plus size={14} /> Add Item
          </button>
        </div>

        <div className="space-y-3">
          {fields.map((field, idx) => {
            const selectedProduct = products.find((p) => String(p._id) === String(watchedItems[idx]?.productId));
            const isMobile = selectedProduct?.category === 'Mobile';
            const qty = Number(watchedItems[idx]?.quantity) || 1;
            return (
              <div key={field.id} className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">Item {idx + 1}</span>
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(idx)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <select className="input-field text-xs" {...register(`items.${idx}.productId`, { required: 'Product is required' })}>
                      <option value="">Select product</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id} disabled={p.stock <= 0}>
                          {p.name} — ₹{p.price} (Stock: {p.stock})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input type="number" min="1" className="input-field text-xs" placeholder="Qty"
                      {...register(`items.${idx}.quantity`, { required: true, min: 1, valueAsNumber: true })} />
                  </div>
                </div>
                {/* IMEI — mandatory for Mobile */}
                {isMobile && (
                  <div>
                    <label className="text-xs text-gray-500 font-medium">
                      IMEI * <span className="text-gray-400 font-normal">(required for mobile)</span>
                    </label>
                    <input
                      className="input-field text-xs mt-1"
                      placeholder="15-digit IMEI"
                      maxLength={15}
                      inputMode="numeric"
                      {...register(`items.${idx}.imei`, {
                        required: 'IMEI is required for mobile products',
                        pattern: { value: /^\d{15}$/, message: 'IMEI must be exactly 15 digits' },
                      })}
                    />
                    {errors.items?.[idx]?.imei && (
                      <p className="text-red-500 text-xs mt-0.5">{errors.items[idx].imei.message}</p>
                    )}
                  </div>
                )}
                {selectedProduct && (
                  <div className="text-xs text-gray-500 flex gap-3">
                    <span>Unit: ₹{selectedProduct.price}</span>
                    <span>GST 18%: ₹{(selectedProduct.price * qty * GST_RATE).toFixed(2)}</span>
                    <span className="font-semibold text-gray-700">Total: ₹{(selectedProduct.price * qty * 1.18).toFixed(2)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment mode */}
      <div>
        <label className="label">Payment Mode *</label>
        <div className="flex gap-3">
          {['Cash', 'UPI', 'Card'].map((mode) => (
            <label key={mode} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" value={mode} {...register('paymentMode', { required: true })} className="text-primary-600" />
              <span className="text-sm">{mode}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="bg-primary-50 rounded-lg p-4 border border-primary-100">
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal (excl. GST)</span>
            <span>₹{totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>GST (18%)</span>
            <span>₹{totals.gst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 text-base border-t border-primary-200 pt-2 mt-2">
            <span>Grand Total</span>
            <span className="text-primary-700">₹{totals.grand.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Creating Bill...' : 'Create Bill'}
      </button>
    </form>
  );
}
