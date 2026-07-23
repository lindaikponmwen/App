import React, { useState } from 'react';
import { Lock, AlertCircle, Clock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { getCurrentUser } from '../data/authData';
import { authService } from '../services/authService';

interface LockedScreenProps {
  onUnlock: () => void;
}

export default function LockedScreen({ onUnlock }: LockedScreenProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const currentUser = getCurrentUser();
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Call PHP backend to verify password
      const result = await authService.unlockSession(password);

      if (result.success) {
        onUnlock();
      } else {
        setError(result.error || 'Incorrect password. Please try again.');
        setPassword('');
      }
    } catch (error) {
      console.error('Unlock error:', error);
      setError('An error occurred. Please try again.');
      setPassword('');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left Side - Unlock Form */}
      <div className="flex-1 flex items-center justify-center bg-white px-12 py-12 relative">
        {/* Decorative top bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>

        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-16">
            <img src="https://drlevy.ai/logo.png" alt="DrLevy.Ai" className="h-8" />
          </div>

          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-50 border border-blue-100 rounded-none">
                <Lock className="w-6 h-6 text-blue-700" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Session Locked
              </h1>
            </div>
            <p className="text-gray-500">
              For your security, your session has been locked due to inactivity.
            </p>
          </div>

          {/* User Info Card */}
          {currentUser && (
            <div className="mb-8 p-5 bg-gray-50 border border-gray-200 flex items-center space-x-4 rounded-none">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-12 h-12 object-cover rounded-none shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 bg-slate-800 flex items-center justify-center text-white font-bold text-lg rounded-none shadow-sm">
                  {currentUser.initials}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">{currentUser.name}</p>
                <p className="text-sm text-gray-500 truncate">{currentUser.email}</p>
              </div>
              <div className="h-2 w-2 bg-emerald-500 rounded-full"></div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border-l-4 border-red-500 p-4 flex items-start space-x-3 rounded-none"
              >
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="text-red-700 text-sm font-medium">{error}</span>
              </motion.div>
            )}

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-12 py-3.5 bg-white border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all rounded-none text-gray-900 placeholder-gray-400"
                  placeholder="Enter your password"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-full px-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Unlock Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 text-white py-3.5 font-semibold hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed transition-all rounded-none shadow-sm flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Unlock Session</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Info */}
          <div className="mt-12 flex items-center justify-between text-sm text-gray-500 pt-6 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{currentTime}</span>
            </div>
            <span className="text-gray-300">|</span>
            <span>{currentDate}</span>
          </div>
        </div>
      </div>

      {/* Right Side - Professional Background */}
      <div className="hidden lg:flex flex-1 bg-slate-900 relative overflow-hidden items-center justify-center">
        {/* Geometric Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]"></div>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px]"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-lg text-center px-8">
          <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 bg-white/5 border border-white/10 backdrop-blur-sm flex items-center justify-center rounded-none rotate-45 group hover:rotate-0 transition-transform duration-700 ease-in-out">
              <div className="w-20 h-20 bg-white/10 border border-white/20 flex items-center justify-center rounded-none -rotate-45 group-hover:rotate-0 transition-transform duration-700 ease-in-out">
                <ShieldCheck className="w-10 h-10 text-blue-400" />
              </div>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-6 tracking-tight">
            Secure Workspace
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed mb-8">
            DrLevy.Ai employs enterprise-grade encryption and strict access controls to ensure your research data remains confidential and secure at all times.
          </p>
          
          <div className="flex items-center justify-center space-x-8 text-xs font-medium text-slate-500 uppercase tracking-widest">
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-none"></div>
              <span>Encrypted</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-none"></div>
              <span>Logged</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-none"></div>
              <span>Monitored</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
