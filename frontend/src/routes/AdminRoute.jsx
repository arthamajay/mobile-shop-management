import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && !isAdmin) {
      toast.error('Access denied. Admin only.');
    }
  }, [loading, user, isAdmin]);

  if (loading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  return children;
}
