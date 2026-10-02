import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext.jsx';
import { AlertProvider } from './context/AlertContext.jsx';

import Layout from './components/layout/Layout.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import AdminRoute from './routes/AdminRoute.jsx';

import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import BillingPage from './pages/BillingPage.jsx';
import TransfersPage from './pages/TransfersPage.jsx';
import AlertsPage from './pages/AlertsPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import ReconciliationPage from './pages/ReconciliationPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <AuthProvider>
      <AlertProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { fontSize: '14px' },
          }}
        />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="transfers" element={<TransfersPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route
              path="analytics"
              element={
                <AdminRoute>
                  <AnalyticsPage />
                </AdminRoute>
              }
            />
            <Route path="reconciliation" element={<ReconciliationPage />} />
            <Route
              path="users"
              element={
                <AdminRoute>
                  <UsersPage />
                </AdminRoute>
              }
            />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AlertProvider>
    </AuthProvider>
  );
}
