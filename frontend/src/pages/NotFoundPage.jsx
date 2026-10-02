import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Smartphone } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <Smartphone size={48} className="text-gray-300 mx-auto mb-4" />
          <h1 className="text-7xl font-bold text-gray-200 mb-2">404</h1>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Page Not Found</h2>
          <p className="text-gray-500">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-5 rounded-xl transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
