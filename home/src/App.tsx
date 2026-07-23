import React, { useState, useEffect, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useIsMobile } from './hooks/useIsMobile';
import { useInactivityLock } from './hooks/useInactivityLock';
import MobileWarning from './components/MobileWarning';
import AuthGuard from './components/AuthGuard';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { authService } from './services/authService';
import { isAuthenticated, setCachedUser, getCurrentUser, initializeAuth } from './data/authData';
// Lazy load pages for code splitting
const LoginPage = React.lazy(() => import('./components/LoginPage'));
const RegisterPage = React.lazy(() => import('./components/RegisterPage'));
const ForgotPasswordPage = React.lazy(() => import('./components/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('./components/ResetPasswordPage'));
const EmailConfirmationPage = React.lazy(() => import('./components/EmailConfirmationPage'));
const EmailVerificationPage = React.lazy(() => import('./components/EmailVerificationPage'));
const PricingPage = React.lazy(() => import('./components/PricingPage'));
const ApplyForEnterprise = React.lazy(() => import('./components/ApplyForEnterprise'));
const WaitingPage = React.lazy(() => import('./components/WaitingPage'));
const LockedScreen = React.lazy(() => import('./components/LockedScreen'));
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const AppearanceSettings = React.lazy(() => import('./components/AppearanceSettings'));
const ProjectDetails = React.lazy(() => import('./components/ProjectDetails'));
const ProjectStatsPanel = React.lazy(() => import('./components/ProjectStatsPanel'));
const ProjectsPage = React.lazy(() => import('./components/ProjectsPage'));
const TeamMembersPage = React.lazy(() => import('./components/TeamMembersPage'));
const ProfilePage = React.lazy(() => import('./components/ProfilePage'));
const AnalyticsPage = React.lazy(() => import('./components/AnalyticsPage'));
const HelpPage = React.lazy(() => import('./components/HelpPage'));
const AdministrativePage = React.lazy(() => import('./components/AdministrativePage'));
const NotificationsPage = React.lazy(() => import('./components/NotificationsPage'));

const LoadingFallback = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [showAppearanceSettings, setShowAppearanceSettings] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isRightPanelExtended, setIsRightPanelExtended] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const authenticated = isAuthenticated();
  const { isLocked, unlock } = useInactivityLock(authenticated);

 
    // Initialize auth on app start
  React.useEffect(() => {
    const initialize = async () => {
      await authService.initialize();
      await initializeAuth();
      // Verify session with server
      const sessionCheck = await authService.verifySession();
      if (sessionCheck.authenticated && sessionCheck.user) {
        setCachedUser(sessionCheck.user);
      } else {
        setCachedUser(null);
      }

      setIsInitialized(true);
    };

    initialize();
  }, []);

  // Handle routing side-effects (redirects)
  useEffect(() => {
    if (!isInitialized) return;

    const currentUser = getCurrentUser();
    const isAuthPath = location.pathname.startsWith('/login') || 
                       location.pathname.startsWith('/register') || 
                       location.pathname.startsWith('/forgot-password') || 
                       location.pathname.startsWith('/reset-password') || 
                       location.pathname.startsWith('/email-confirmation') || 
                       location.pathname.startsWith('/verify-email');

    // Redirect unauthenticated users to login, except for public pages
    if (!authenticated && !isAuthPath && location.pathname !== '/pricing' && location.pathname !== '/apply-enterprise') {
      navigate('/login', { replace: true });
    } else if (authenticated && currentUser?.role === 'unsubscribed' && location.pathname !== '/pricing' && location.pathname !== '/apply-enterprise') {
      // Force reload for unsubscribed users going to pricing
      //navigate('/pricing', { replace: true });
      window.location.hash = '/pricing';
      window.location.reload();
    } else if (authenticated && currentUser?.role === 'waiting' && location.pathname !== '/waiting') {
      // Force reload for waiting users
      window.location.hash = '/waiting';
      window.location.reload();
    }
  }, [isInitialized, authenticated, location.pathname, navigate]);

  const activeView = (() => {
    const path = location.pathname;
    if (path === '/') return 'dashboard';
    if (path === '/projects') return 'projects';
    if (path === '/team-members') return 'team-members';
    if (path === '/profile') return 'profile';
    if (path === '/analytics') return 'analytics';
    if (path === '/administrative') return 'administrative';
    if (path === '/settings') return 'settings';
    return 'dashboard';
  })();

  const handleViewChange = (view: string) => {
    const routes: Record<string, string> = {
      'dashboard': '/',
      'projects': '/projects',
      'team-members': '/team-members',
      'profile': '/profile',
      'analytics': '/analytics',
      'administrative': '/administrative'
    };

    if (routes[view]) {
      navigate(routes[view]);
    }
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    setIsRightPanelExtended(false);
  };

  const toggleRightPanelExtension = () => {
    setIsRightPanelExtended(!isRightPanelExtended);
  };

  const handleSettingsClick = () => {
    if (location.pathname === '/settings') {
      setShowAppearanceSettings(true);
    } else {
      navigate('/settings');
    }
  };

  const handleProfileClick = () => navigate('/profile');
  const handleSearchClick = () => navigate('/projects');
  const handleBackToDashboard = () => navigate('/');
  const handleHelpClick = () => navigate('/help');
  const handleLogin = () => navigate('/', { replace: true });

  const handleEnroll = async (role: string, billingCycle: 'monthly' | 'yearly') => {
    try {
      const currentUser = getCurrentUser();
      if (currentUser) {
        const result = await authService.updateUserRole(role);
        if (result.success) {
           window.location.reload();
        }
      }
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  if (!isInitialized) {
    return <LoadingFallback />;
  }

  if (isMobile) return <MobileWarning />;
  if (isLocked && authenticated) return <Suspense fallback={<LoadingFallback />}><LockedScreen onUnlock={unlock} /></Suspense>;

  const isAuthPath = location.pathname.startsWith('/login') || 
                     location.pathname.startsWith('/register') || 
                     location.pathname.startsWith('/forgot-password') || 
                     location.pathname.startsWith('/reset-password') || 
                     location.pathname.startsWith('/email-confirmation') || 
                     location.pathname.startsWith('/verify-email');

  if (isAuthPath) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={handleLogin} onShowRegister={() => navigate('/register')} onShowForgotPassword={() => navigate('/forgot-password')} />} />
          <Route path="/register" element={<RegisterPage onBack={() => navigate('/login')} onRegisterSuccess={() => navigate('/login')} />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage onBack={() => navigate('/login')} />} />
          <Route path="/reset-password" element={<ResetPasswordPage onSuccess={() => navigate('/login')} />} />
          <Route path="/email-confirmation" element={<EmailConfirmationPage />} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
        </Routes>
      </Suspense>
    );
  }

  if (location.pathname === '/pricing') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <PricingPage onEnroll={handleEnroll} />
      </Suspense>
    );
  }

  if (location.pathname === '/apply-enterprise') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <ApplyForEnterprise />
      </Suspense>
    );
  }

  if (location.pathname === '/waiting') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <WaitingPage />
      </Suspense>
    );
  }

  return (
    <AuthGuard>
      <div className="h-screen bg-gray-50 flex flex-col font-['Inter',sans-serif]">
        <Header 
          onSettingsClick={handleSettingsClick}
          onSearchClick={handleSearchClick}
          onProfileClick={handleProfileClick}
          onHelpClick={handleHelpClick}
          hideSearchBar={activeView === 'projects'}
        />
        
        <div className="flex-1 flex overflow-hidden">
          {activeView !== 'settings' && location.pathname !== '/help' && (
            <Sidebar activeView={activeView} onViewChange={handleViewChange} />
          )}
          
          <motion.div 
            className={`flex-1 flex overflow-hidden ${
              activeView === 'settings' || location.pathname === '/help' ? 'w-full' : ''
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={
                  <>
                    {!isRightPanelExtended && <Dashboard onProjectSelect={handleProjectSelect} />}
                    {selectedProjectId ? (
                      <ProjectDetails
                        selectedProjectId={selectedProjectId}
                        isExtended={isRightPanelExtended}
                        onToggleExtend={toggleRightPanelExtension}
                        onCloseDetails={() => setSelectedProjectId(null)}
                      />
                    ) : (
                      <ProjectStatsPanel
                        isExtended={isRightPanelExtended}
                        onToggleExtend={toggleRightPanelExtension}
                      />
                    )}
                  </>
                } />
                <Route path="/projects" element={<ProjectsPage onBack={handleBackToDashboard} onProjectSelect={handleProjectSelect} />} />
                <Route path="/team-members" element={<TeamMembersPage onBack={handleBackToDashboard} />} />
                <Route path="/profile" element={<ProfilePage onBack={handleBackToDashboard} />} />
                <Route path="/analytics" element={<AnalyticsPage onBack={handleBackToDashboard} />} />
                <Route path="/administrative" element={<AdministrativePage onBack={handleBackToDashboard} />} />
                <Route path="/settings" element={<AppearanceSettings onBack={() => setShowAppearanceSettings(false)} />} />
                <Route path="/help" element={<HelpPage onBack={handleBackToDashboard} />} />
                <Route path="/notifications" element={<NotificationsPage onBack={handleBackToDashboard} />} />
              </Routes>
            </Suspense>
          </motion.div>
        </div>
      </div>
    </AuthGuard>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;