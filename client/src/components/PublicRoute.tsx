import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PublicRouteProps {
  children: ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, redirect based on status
  if (isAuthenticated && user) {
    switch (user.status) {
      case 'pending':
        return <Navigate to="/pending" replace />;
      case 'approved':
        return <Navigate to="/app/dashboard" replace />;
      case 'rejected':
      case 'inactive':
        return <Navigate to="/blocked" replace />;
    }
  }

  return <>{children}</>;
};

export default PublicRoute;

