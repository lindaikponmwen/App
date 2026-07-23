import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { hasPageAccess } from '../data/authData';
import { authService } from '../services/authService';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verify session with backend on every page load/navigation
        const sessionCheck = await authService.verifySession();

        if (!sessionCheck.authenticated) {
          // Session invalid on backend, redirect to login
          navigate('/login', { replace: true });
          setIsLoading(false);
          return;
        }

        // Session valid, check page access
        if (sessionCheck.user) {
          const currentPage = getPageFromPath(location.pathname);

          if (currentPage && !hasPageAccess(currentPage, sessionCheck.user.role)) {
            navigate('/', { replace: true });
            setIsLoading(false);
            return;
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error verifying session:', error);
        navigate('/login', { replace: true });
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate, location.pathname]);

  const getPageFromPath = (pathname: string): string | null => {
    const pathMap: Record<string, string> = {
      '/': 'experiments',
      '/projects': 'projects',
      '/search': 'search',
      '/team-members': 'team-members',
      '/profile': 'profile',
      '/analytics': 'analytics',
      '/administrative': 'administrative',
      '/settings': 'settings',
      '/help': 'help',
      '/notifications': 'notifications'
    };

    return pathMap[pathname] || null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
