import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Receipt,
  ArrowLeftRight,
  Bell,
  BarChart3,
  Calculator,
  Smartphone,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAlerts } from '../../context/AlertContext.jsx';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/billing', label: 'Billing', icon: Receipt },
  { to: '/transfers', label: 'Transfers', icon: ArrowLeftRight },
  { to: '/alerts', label: 'Alerts', icon: Bell, showBadge: true },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, adminOnly: true },
  { to: '/users', label: 'Staff', icon: Users, adminOnly: true },
  { to: '/reconciliation', label: 'Reconciliation', icon: Calculator },
];

export default function Sidebar() {
  const { user, isAdmin } = useAuth();
  const { unreadCount } = useAlerts();

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col min-h-screen fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
        <div className="bg-primary-600 rounded-lg p-2">
          <Smartphone size={22} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold text-base leading-tight">Mobile Shop</h1>
          <p className="text-xs text-gray-400">Manager</p>
        </div>
      </div>

      {/* Branch info for salesperson */}
      {!isAdmin && user?.branch && (
        <div className="px-6 py-3 bg-gray-800 border-b border-gray-700">
          <p className="text-xs text-gray-400">Branch</p>
          <p className="text-sm font-semibold text-primary-400">{user.branch}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if (item.adminOnly && !isAdmin) return null;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative group ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`
              }
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.showBadge && unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User info at bottom */}
      <div className="px-4 py-4 border-t border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-sm font-bold">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
