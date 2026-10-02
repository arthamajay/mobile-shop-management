import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen message="Authenticating..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
