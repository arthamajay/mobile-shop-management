import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Badge from '../components/common/Badge.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import { getAlerts, acknowledgeAlert, getAlertHistory } from '../api/alerts';
import { useAuth } from '../context/AuthContext.jsx';

const TYPE_LABELS = {
  low_stock: 'Low Stock',
  suspicious_activity: 'Suspicious Activity',
  cash_mismatch: 'Cash Mismatch',
  quick_cancel: 'Quick Cancel',
  excess_cancels: 'Excess Cancels',
  stock_mismatch: 'Stock Mismatch',
};

const SEVERITY_COLORS = { low: 'info', medium: 'warning', high: 'danger' };
const TYPE_COLORS = {
  low_stock: 'warning',
  suspicious_activity: 'danger',
  cash_mismatch: 'danger',
  quick_cancel: 'orange',
  excess_cancels: 'danger',
  stock_mismatch: 'warning',
};

export default function AlertsPage() {
  const { isAdmin } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [histLoading, setHistLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await getAlerts();
      setAlerts(data.alerts || []);
    } catch {
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setHistLoading(true);
    try {
      const data = await getAlertHistory();
      setHistory(data.alerts || []);
    } catch {
      toast.error('Failed to load history');
    } finally {
      setHistLoading(false);
    }
  };

  useEffect(() => { loadAlerts(); }, []);

  useEffect(() => {
    if (showHistory) loadHistory();
  }, [showHistory]);

  const handleAcknowledge = async (id) => {
    try {
      await acknowledgeAlert(id);
      setAlerts((prev) => prev.filter((a) => a._id !== id));
      toast.success('Alert acknowledged');
    } catch {
      toast.error('Failed to acknowledge alert');
    }
  };

  const AlertCard = ({ alert, showAck }) => (
    <div className={`bg-white rounded-xl border-l-4 ${alert.severity === 'high' ? 'border-red-500' : alert.severity === 'medium' ? 'border-yellow-400' : 'border-blue-400'} p-4 shadow-sm`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className={`mt-0.5 p-1.5 rounded-lg ${alert.severity === 'high' ? 'bg-red-100' : alert.severity === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'}`}>
            <AlertTriangle size={16} className={alert.severity === 'high' ? 'text-red-600' : alert.severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-1">
              <Badge variant={TYPE_COLORS[alert.type] || 'gray'}>{TYPE_LABELS[alert.type] || alert.type}</Badge>
              <Badge variant={SEVERITY_COLORS[alert.severity]}>{alert.severity} severity</Badge>
              {alert.branch && <Badge variant="purple">{alert.branch}</Badge>}
            </div>
            <p className="text-sm text-gray-700 font-medium">{alert.message}</p>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <Clock size={11} /> {format(new Date(alert.createdAt), 'dd MMM yyyy, hh:mm a')}
            </p>
            {alert.acknowledgedBy && (
              <p className="text-xs text-green-600 mt-1">Acknowledged by {alert.acknowledgedBy?.name}</p>
            )}
          </div>
        </div>
        {showAck && isAdmin && (
          <button onClick={() => handleAcknowledge(alert._id)}
            className="flex-shrink-0 p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Acknowledge">
            <CheckCircle size={16} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Alerts</h1>
          <p className="text-gray-500 text-sm mt-0.5">{alerts.length} active alerts</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`btn-secondary text-sm ${showHistory ? 'bg-gray-100' : ''}`}
          >
            {showHistory ? 'Active Alerts' : 'View History'}
          </button>
        </div>
      </div>

      {!showHistory && (
        <>
          {loading ? (
            <LoadingSpinner />
          ) : alerts.length === 0 ? (
            <div className="card text-center py-16">
              <Bell size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No active alerts. All clear! ✅</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <AlertCard key={alert._id} alert={alert} showAck />
              ))}
            </div>
          )}
        </>
      )}

      {showHistory && (
        <>
          <h2 className="text-base font-semibold text-gray-700">Alert History</h2>
          {histLoading ? (
            <LoadingSpinner />
          ) : history.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-400">No alert history found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((alert) => (
                <AlertCard key={alert._id} alert={alert} showAck={false} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
