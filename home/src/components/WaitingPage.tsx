import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Clock, 
  LogOut, 
  Layout, 
  Database, 
  Activity,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { setCachedUser, logout } from '../data/authData';
import { authService } from '../services/authService';

export default function WaitingPage() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    // Immediate state clear for UI responsiveness
    setCachedUser(null);
    logout();
    
    // Navigate immediately to avoid feeling like it's stuck
    navigate('/login', { replace: true });

    // Perform server logout in background
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const premiumApps = [
    {
      id: 'project',
      title: 'Project App',
      description: 'Comprehensive tools for management of end-to-end pharmacometrics projects.',
      icon: Layout,
      color: 'bg-blue-600',
      lightColor: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      id: 'data',
      title: 'Data App',
      description: 'Advanced tools to enable robust exploratory data analysis and visualization.',
      icon: Database,
      color: 'bg-emerald-600',
      lightColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      id: 'model',
      title: 'Model App',
      description: 'Sophisticated tools for robust model exploration, diagnostic plots, and visual predictive checks.',
      icon: Activity,
      color: 'bg-purple-600',
      lightColor: 'bg-purple-50 text-purple-700 border-purple-200'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-['Inter',sans-serif]">
      {/* Header */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm">
        <img 
          src="https://drlevy.ai/logo.png" 
          alt="DrLevy.Ai" 
          className="h-8" 
        />
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors px-3 py-2 rounded-none hover:bg-red-50 text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
        <div className="max-w-5xl w-full">
          
          {/* Welcome Banner */}
          <motion.div 
            className="bg-white p-8 mb-8 text-center"
          >
            <div className="w-16 h-16 bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-6 rounded-none">
              <ShieldCheck className="w-8 h-8 text-blue-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Account Verified
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
              Welcome to DrLevy.Ai. Your account has been successfully verified. 
              An administrator will review your profile and grant access shortly.
            </p>
            
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium rounded-none">
              <Clock className="w-4 h-4" />
              <span>Status: Pending Access Approval</span>
            </div>
          </motion.div>

          {/* Apps Preview */}
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold text-gray-900 mb-2">You will be granted access to these premium applications shortly:</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {premiumApps.map((app, index) => (
              <motion.div
                key={app.id}
                className="bg-white border border-gray-200 p-6 flex flex-col h-full hover:shadow-md transition-shadow group"
              >
                <div className={`w-12 h-12 flex items-center justify-center mb-4 rounded-none ${app.lightColor}`}>
                  <app.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {app.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed flex-1">
                  {app.description}
                </p>
                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center text-gray-400 text-xs font-medium uppercase tracking-wide">
                  <span className="w-2 h-2 bg-gray-300 rounded-full mr-2"></span>
                  Premium Feature
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 py-4 text-center text-sm text-gray-500">
        <p>© 2026 DrLevy.Ai. All rights reserved.</p>
        <p className="mt-1">Need help? Contact <a href="mailto:support@drlevy.ai" className="text-blue-600 hover:underline">support@drlevy.ai</a></p>
      </div>
    </div>
  );
}