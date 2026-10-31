import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F6F3] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-stone-500">Verifying session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Preserve attempted URL so user is returned after successful login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
