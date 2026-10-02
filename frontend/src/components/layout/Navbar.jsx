import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAlerts } from '../../context/AlertContext.jsx';
import AlertBadge from '../common/AlertBadge.jsx';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { unreadCount } = useAlerts();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      {/* Left: App name */}
      <div className="flex items-center gap-3">
        <h2 className="font-semibold text-gray-800 text-base">📱 Mobile Shop Manager</h2>
        {!isAdmin && user?.branch && (
          <span className="text-xs bg-primary-100 text-primary-700 px-2.5 py-1 rounded-full font-medium">
            {user.branch}
          </span>
        )}
      </div>

      {/* Right: alerts + user */}
      <div className="flex items-center gap-4">
        {/* Alert bell */}
        <button
          onClick={() => navigate('/alerts')}
          className="relative p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          title="View Alerts"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5">
              <AlertBadge count={unreadCount} />
            </span>
          )}
        </button>

        {/* User info */}
        <div className="flex items-center gap-2.5">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-800">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
          <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
          title="Logout"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
