import React, { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Plus, X, Hash } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const BRANCHES = ['Kukatpally', 'KPHB', 'Beeramguda'];
const CATEGORIES = ['Mobile', 'Accessory', 'Other'];
const IMEI_CATEGORIES = ['Mobile'];

export default function ProductForm({ defaultValues, onSubmit, loading }) {
  const { isAdmin, user } = useAuth();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: defaultValues || {
      name: '',
      category: 'Mobile',
      price: '',
      stock: '',
      branch: isAdmin ? '' : user?.branch,
      lowStockThreshold: 5,
    },
  });

  // Watch category to show/hide IMEI section
  const category = useWatch({ control, name: 'category', defaultValue: defaultValues?.category || 'Mobile' });
  const showIMEI = IMEI_CATEGORIES.includes(category);

  // IMEI list state — pre-populate from existing product on edit
  const [imeiList, setImeiList] = useState(defaultValues?.imeiNumbers || []);
  const [imeiInput, setImeiInput] = useState('');
  const [imeiError, setImeiError] = useState('');

  // When category changes away from Mobile, clear the IMEI list
  useEffect(() => {
    if (!showIMEI) {
      setImeiList([]);
      setImeiInput('');
      setImeiError('');
    }
  }, [showIMEI]);

  const handleImeiInput = (e) => {
    // Only allow digits, max 15
    const val = e.target.value.replace(/\D/g, '').slice(0, 15);
    setImeiInput(val);
    setImeiError('');
  };

  const addImei = () => {
    const imei = imeiInput.trim();
    if (imei.length !== 15) {
      setImeiError('IMEI must be exactly 15 digits');
      return;
    }
    if (imeiList.includes(imei)) {
      setImeiError('This IMEI is already in the list');
      return;
    }
    setImeiList((prev) => [...prev, imei]);
    setImeiInput('');
    setImeiError('');
  };

  const removeImei = (imei) => {
    setImeiList((prev) => prev.filter((i) => i !== imei));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addImei();
    }
  };

  const handleFormSubmit = (data) => {
    // Attach IMEI list to submitted data
    onSubmit({ ...data, imeiNumbers: showIMEI ? imeiList : [] });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label className="label">Product Name *</label>
        <input
          className="input-field"
          placeholder="e.g. iPhone 15 Pro"
          {...register('name', { required: 'Product name is required' })}
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Category *</label>
          <select className="input-field" {...register('category', { required: true })}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Branch *</label>
          {isAdmin ? (
            <select className="input-field" {...register('branch', { required: 'Branch is required' })}>
              <option value="">Select branch</option>
              {BRANCHES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          ) : (
            <input className="input-field bg-gray-50" value={user?.branch} readOnly />
          )}
          {errors.branch && <p className="text-red-500 text-xs mt-1">{errors.branch.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Price (₹) *</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="input-field"
            placeholder="0.00"
            {...register('price', {
              required: 'Price is required',
              min: { value: 0, message: 'Price must be >= 0' },
            })}
          />
          {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
        </div>

        <div>
          <label className="label">Stock *</label>
          <input
            type="number"
            min="0"
            className="input-field"
            placeholder="0"
            {...register('stock', {
              required: 'Stock is required',
              min: { value: 0, message: 'Stock must be >= 0' },
            })}
          />
          {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock.message}</p>}
        </div>
      </div>

      <div>
        <label className="label">Low Stock Threshold</label>
        <input
          type="number"
          min="0"
          className="input-field"
          {...register('lowStockThreshold', { min: 0 })}
        />
        <p className="text-xs text-gray-400 mt-1">Alert when stock falls at or below this number</p>
      </div>

      {/* ── IMEI Section (Mobile products only) ────────────────── */}
      {showIMEI && (
        <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
          <div className="flex items-center gap-2">
            <Hash size={15} className="text-primary-600" />
            <p className="text-sm font-semibold text-gray-800">
              IMEI Numbers
              <span className="text-gray-400 font-normal ml-1">({imeiList.length} added)</span>
            </p>
          </div>
          <p className="text-xs text-gray-500">
            Enter the 15-digit IMEI for each unit in stock. Each IMEI maps to one physical device.
          </p>

          {/* Input row */}
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={15}
              className="input-field flex-1 font-mono text-sm"
              placeholder="15-digit IMEI (digits only)"
              value={imeiInput}
              onChange={handleImeiInput}
              onKeyDown={handleKeyDown}
            />
            <button
              type="button"
              onClick={addImei}
              disabled={imeiInput.length !== 15}
              className="btn-primary px-3 py-2 flex items-center gap-1 disabled:opacity-40"
            >
              <Plus size={15} /> Add
            </button>
          </div>
          {imeiError && <p className="text-red-500 text-xs">{imeiError}</p>}

          {/* IMEI list */}
          {imeiList.length > 0 && (
            <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {imeiList.map((imei, idx) => (
                <li
                  key={imei}
                  className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-1.5"
                >
                  <span className="font-mono text-xs text-gray-700">
                    <span className="text-gray-400 mr-2">{idx + 1}.</span>{imei}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeImei(imei)}
                    className="text-red-400 hover:text-red-600 p-0.5 rounded"
                    title="Remove"
                  >
                    <X size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {imeiList.length === 0 && (
            <p className="text-xs text-gray-400 italic">No IMEIs added yet.</p>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Saving...' : defaultValues ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  );
}
