import React from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext.jsx';

const BRANCHES = ['Kukatpally', 'KPHB', 'Beeramguda'];

export default function ReconciliationForm({ onSubmit, loading, expectedCash }) {
  const { user, isAdmin } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      branch: isAdmin ? '' : user?.branch,
      date: format(new Date(), 'yyyy-MM-dd'),
      physicalCount: '',
      notes: '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Branch *</label>
          {isAdmin ? (
            <select className="input-field" {...register('branch', { required: true })}>
              <option value="">Select branch</option>
              {BRANCHES.map((b) => <option key={b}>{b}</option>)}
            </select>
          ) : (
            <input className="input-field bg-gray-50" value={user?.branch} readOnly />
          )}
        </div>
        <div>
          <label className="label">Date *</label>
          <input type="date" className="input-field" {...register('date', { required: true })} />
        </div>
      </div>

      {expectedCash !== undefined && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-700">
            Expected Cash (from bills): <strong>₹{Number(expectedCash).toFixed(2)}</strong>
          </p>
        </div>
      )}

      <div>
        <label className="label">Physical Cash Count (₹) *</label>
        <input
          type="number"
          min="0"
          step="0.01"
          className="input-field"
          placeholder="0.00"
          {...register('physicalCount', {
            required: 'Physical count is required',
            min: { value: 0, message: 'Must be >= 0' },
            valueAsNumber: true,
          })}
        />
        {errors.physicalCount && <p className="text-red-500 text-xs mt-1">{errors.physicalCount.message}</p>}
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea className="input-field" rows={2} {...register('notes')} placeholder="Any discrepancy notes..." />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Submitting...' : 'Submit Reconciliation'}
      </button>
    </form>
  );
}
