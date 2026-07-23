import React, { useState, useEffect } from 'react';   
import { Shield, Menu, X } from 'lucide-react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { PricingPage } from './components/PricingPage';
import { TeamDashboard } from './components/TeamDashboard';
import AuthPage from './components/AuthPage';
import { AdminGodMode } from './components/AdminGodMode';
import ApplyForEnterprise from './components/ApplyForEnterprise';
import { USE_PHP_BACKEND } from './constants';

import { Modal } from './components/Modal';

const Navigation: React.FC<{ user: any, billingLoading: boolean, handleManageBilling: () => void, handleLogout: () => void, formatDate: (d: string | null) => string, setShowAuthModal: (show: boolean) => void }> = ({ user, billingLoading, handleManageBilling, handleLogout, formatDate, setShowAuthModal }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isTeamPage = location.pathname === '/team';
  
  const isOwner = user?.team_role === 'owner';
  const userRole = user?.team_role;
  const isMember = userRole === 'member';
  const isAdmin = userRole === 'admin';
  const isStandardUser = !!user?.team_id && (isMember || isAdmin);
  const hasNoPlan = !user?.subscription_plan || user?.subscription_plan === 'free';
  const canManageBilling = isOwner || (!hasNoPlan && !isStandardUser);

  const getBillingTooltip = () => {
    if (isStandardUser) return "Billing is managed by your Team Owner";
    if (hasNoPlan) return "Subscribe to a plan to access the billing portal.";
    return "";
  };

  return (
    <header className="flex items-center justify-between px-4 md:px-8 py-4 md:py-6 bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="flex items-center space-x-4">
        <Link to="/" className="flex items-center">
          <img src="/logo.png" alt="DRLEVY AI" className="h-8 md:h-10" referrerPolicy="no-referrer" />
        </Link>
      </div>

      {/* Mobile Menu Toggle */}
      <div className="md:hidden flex items-center">
        {user ? (
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-900 p-2">
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        ) : (
          <button 
            onClick={() => setShowAuthModal(true)}
            className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all rounded-sm shadow-lg shadow-gray-200"
          >
            Sign In
          </button>
        )}
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center space-x-6">
        {user ? (
          <>
            <div className="relative group">
              <button
                onClick={handleManageBilling}
                disabled={billingLoading || !canManageBilling}
                className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  !canManageBilling 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-slate-400 hover:text-blue-600'
                } ${billingLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {billingLoading ? 'Processing...' : 'Manage Billing'}
              </button>
              {!canManageBilling && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[60]">
                  {getBillingTooltip()}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                </div>
              )}
            </div>

            <Link 
              to="/team" 
              className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${
                isTeamPage ? 'text-blue-600' : 'text-slate-400 hover:text-blue-600'
              }`}
            >
              Dashboard
            </Link>

            {user?.role === 'admin' && (
              <Link 
                to="/admin" 
                className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  location.pathname === '/admin' ? 'text-red-600' : 'text-slate-400 hover:text-red-600'
                }`}
              >
                Console
              </Link>
            )}

            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {user?.email || 'Protected Research Access'}
              </span>
            </div>

            <button 
              onClick={handleLogout}
              className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-red-600 transition-colors"
            >
              Logout
            </button>

            {(user?.subscription_status === 'active' || user?.subscription_status === 'canceling') && user?.subscription_plan === 'pro' && (
              <span className="bg-slate-900 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest">
                PRO
              </span>
            )}
            {(user?.subscription_status === 'active' || user?.subscription_status === 'canceling') && user?.subscription_plan === 'team' && (
              <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest">
                TEAM
              </span>
            )}
            {user?.role === 'admin' && (
              <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest">
                ADMIN
              </span>
            )}
          </>
        ) : (
          <button 
            onClick={() => setShowAuthModal(true)}
            className="px-6 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all rounded-sm shadow-lg shadow-gray-200"
          >
            Sign In / Up
          </button>
        )}
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && user && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-lg md:hidden flex flex-col p-4 space-y-4 z-50">
          <div className="flex flex-col space-y-2 pb-4 border-b border-gray-50">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {user?.email || 'Protected Research Access'}
            </span>
            <div className="flex space-x-2">
              {(user?.subscription_status === 'active' || user?.subscription_status === 'canceling') && user?.subscription_plan === 'pro' && (
                <span className="bg-slate-900 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest inline-block">
                  PRO
                </span>
              )}
              {(user?.subscription_status === 'active' || user?.subscription_status === 'canceling') && user?.subscription_plan === 'team' && (
                <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest inline-block">
                  TEAM
                </span>
              )}
              {user?.role === 'admin' && (
                <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest inline-block">
                  ADMIN
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => { handleManageBilling(); setIsMobileMenuOpen(false); }}
            disabled={billingLoading || !canManageBilling}
            className={`text-left text-xs font-bold uppercase tracking-widest transition-colors py-2 ${
              !canManageBilling 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-slate-600 hover:text-blue-600'
            }`}
          >
            {billingLoading ? 'Processing...' : 'Manage Billing'}
            {!canManageBilling && <span className="block text-[9px] text-gray-400 mt-1 normal-case tracking-normal">{getBillingTooltip()}</span>}
          </button>

          <Link 
            to="/team" 
            onClick={() => setIsMobileMenuOpen(false)}
            className={`text-xs font-bold uppercase tracking-widest transition-colors py-2 ${
              isTeamPage ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'
            }`}
          >
            Dashboard
          </Link>

          {user?.role === 'admin' && (
            <Link 
              to="/admin" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`text-xs font-bold uppercase tracking-widest transition-colors py-2 ${
                location.pathname === '/admin' ? 'text-red-600' : 'text-slate-600 hover:text-red-600'
              }`}
            >
              Console
            </Link>
          )}

          <button 
            onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
            className="text-left text-xs font-bold text-slate-600 uppercase tracking-widest hover:text-red-600 transition-colors py-2 border-t border-gray-50 mt-2 pt-4"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
};

export default function App() {
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [forceMock, setForceMock] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionLabel: string;
    actionStyle: 'blue' | 'red' | 'black';
    onAction: () => void;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    actionLabel: '',
    actionStyle: 'blue',
    onAction: () => {},
    type: 'info'
  });

  const fetchUser = async (signal?: AbortSignal) => {
    if (!USE_PHP_BACKEND || forceMock) {
      setCheckingAuth(false);
      return;
    }
    try {
      const response = await fetch('php/check_auth.php', { signal });
      const text = await response.text();

      if (text.trim().startsWith('<?php')) {
        setServerError("Backend server misconfigured (PHP not executing).");
        setCheckingAuth(false);
        return;
      }

      const data = JSON.parse(text);
      if (data.authenticated) setUser(data.user);
      else setUser(null);
    } catch (err: any) {
      if (err.name !== 'AbortError') console.error("Auth check failed:", err);
    } finally {
      setCheckingAuth(false);
    }
  };

  const refreshUser = () => fetchUser();

  useEffect(() => {
    const controller = new AbortController();
    fetchUser(controller.signal);

    // Re-fetch when window is focused (e.g. returning from Stripe)
    const onFocus = () => fetchUser();
    window.addEventListener('focus', onFocus);

    return () => {
      controller.abort();
      window.removeEventListener('focus', onFocus);
    };
  }, [forceMock]);

  const handleLogout = async () => {
    if (USE_PHP_BACKEND && !forceMock) {
      try { await fetch('php/logout.php'); } catch (e) {}
    }
    setUser(null);
  };

  const showModal = (config: {
    title: string;
    message: string;
    actionLabel: string;
    actionStyle: 'blue' | 'red' | 'black';
    onAction: () => void;
    type?: 'success' | 'error' | 'warning' | 'info';
  }) => {
    setModalConfig({
      ...config,
      isOpen: true,
      type: config.type || 'info'
    });
  };

  // ===== Updated Manage Billing handler =====
  const handleManageBilling = async () => {
    if (!user) return;

    setBillingLoading(true);

    try {
      if (!USE_PHP_BACKEND) {
        // Mock mode: direct redirect
        window.location.href = 'https://test.drlevy.ai/php/create_portal_session.php';
        return;
      }

      const response = await fetch('php/create_portal_session.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to start billing session');
      }
    } catch (err: any) {
      showModal({
        title: 'Billing Error',
        message: 'Billing session failed: ' + err.message,
        actionLabel: 'Close',
        actionStyle: 'red',
        type: 'error',
        onAction: () => {}
      });
    } finally {
      setBillingLoading(false);
    }
  };

  const handleTeamUpgrade = async () => {
    if (!user) return;
    setBillingLoading(true);
    try {
      const response = await fetch('php/start_team_upgrade.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to start team upgrade');
      }
    } catch (error: any) {
      showModal({
        title: 'Checkout Error',
        message: 'Checkout initiation failed: ' + error.message,
        actionLabel: 'Close',
        actionStyle: 'red',
        type: 'error',
        onAction: () => {}
      });
    } finally {
      setBillingLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  };

  const isSuspended = user?.team_status === 'past_due';
  const isInactive = user?.team_status === 'canceled';
  const isOwner = user?.team_role === 'owner';

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (serverError && !forceMock) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8 text-center">
        <div className="text-red-600 font-black uppercase tracking-widest text-[10px] mb-4">Connection Failed</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{serverError}</h1>
        <p className="text-gray-500 text-sm max-w-md mb-8">
          The app is trying to connect to the live PHP backend, but your current environment 
          is returning raw code instead of executing it. 
        </p>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <button 
            onClick={() => setForceMock(true)}
            className="px-6 py-4 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-colors"
          >
            Switch to Mock Mode
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-4 bg-white border border-gray-200 text-slate-900 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors"
          >
            Retry Connection
          </button>
        </div>
        <p className="mt-8 text-[9px] text-gray-300 uppercase tracking-widest">
          Note: Use Mock Mode for local testing. Use Live Mode for Hostinger.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      <Navigation 
        user={user} 
        billingLoading={billingLoading} 
        handleManageBilling={handleManageBilling} 
        handleLogout={handleLogout}
        formatDate={formatDate}
        setShowAuthModal={setShowAuthModal}
      />

      <main className="flex-grow">
          <Routes>
            <Route path="/" element={<PricingPage user={user} onAuthRequired={() => setShowAuthModal(true)} refreshUser={refreshUser} />} />
            <Route path="/apply-enterprise" element={<ApplyForEnterprise />} />
            {!user ? (
              <Route path="*" element={<AuthPage onLogin={(userData) => { setUser(userData); setShowAuthModal(false); }} />} />
            ) : (
              <>
                <Route path="/team" element={<TeamDashboard user={user} refreshUser={refreshUser} />} />
                {user.role === 'admin' && <Route path="/admin" element={<AdminGodMode />} />}
                <Route path="*" element={<Navigate to="/" />} />
              </>
            )}
          </Routes>
        </main>

        {showAuthModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="relative w-full max-w-md">
              <button 
                onClick={() => setShowAuthModal(false)}
                className="absolute -top-12 right-0 text-white/60 hover:text-white transition-colors flex items-center space-x-2 group"
              >
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Close</span>
                <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center group-hover:border-white/40">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
              </button>
              <div className="bg-white shadow-2xl rounded-sm overflow-hidden">
                <AuthPage onLogin={(userData) => {
                  setUser(userData);
                  setShowAuthModal(false);
                }} />
              </div>
            </div>
          </div>
        )}

        <footer className="py-12 border-t border-gray-100 bg-white">
          <div className="max-w-7xl mx-auto px-6 text-center text-gray-400 text-[10px] font-bold uppercase tracking-[0.4em]">
            &copy; {new Date().getFullYear()} DRLEVY AI RESEARCH DEPT.
          </div>
        </footer>

        <Modal 
          isOpen={modalConfig.isOpen}
          onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
          title={modalConfig.title}
          message={modalConfig.message}
          actionLabel={modalConfig.actionLabel}
          onAction={modalConfig.onAction}
          actionStyle={modalConfig.actionStyle}
          type={modalConfig.type}
        />
      </div>
  );
}