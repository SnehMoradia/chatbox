import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-teamsDark-rail select-none">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teams-700 via-teams-500 to-indigo-400 flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-lg animate-pulse">
          <span>TC</span>
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-teams-500 mb-2" />
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          Loading Teams Chat...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
