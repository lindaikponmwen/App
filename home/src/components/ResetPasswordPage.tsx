import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, CheckCircle, Lock, KeyRound } from 'lucide-react';
import axios from 'axios';

interface ResetPasswordPageProps {
  onSuccess: () => void;
}

export default function ResetPasswordPage({ onSuccess }: ResetPasswordPageProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState('');
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');

    if (resetToken) {
      setToken(resetToken);
      verifyToken(resetToken);
    } else {
      setTokenValid(false);
      setError('No reset token provided');
    }
  }, []);

  const verifyToken = async (resetToken: string) => {
    try {
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL || ''}/auth/verify-reset-token.php`;

      const response = await axios.post(apiUrl, { token: resetToken }, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      });

      if (response.data.success) {
        setTokenValid(true);
      } else {
        setTokenValid(false);
        setError(response.data.error || 'Invalid reset token');
      }
    } catch (err: any) {
      setTokenValid(false);
      setError(err.response?.data?.error || 'Failed to verify reset token');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL || ''}/auth/update-password.php`;

      const response = await axios.post(apiUrl, {
        token,
        password,
        confirmPassword
      }, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 3000);
      } else {
        setError(response.data.error || 'Password reset failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password');
    }

    setIsLoading(false);
  };

  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex">
        {/* Left Side - Success Message */}
        <div className="flex-1 flex items-center justify-center bg-white px-8 py-12">
          <div className="w-full max-w-md text-center">
            {/* Logo */}
            <div className="mb-8 flex justify-center">
              <img src="https://drlevy.ai/logo.png" alt="DrLevy.Ai" className="h-10" />
            </div>

            {/* Success Icon */}
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>

            {/* Success Text */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Password Reset Successful</h1>
              <p className="text-gray-600 leading-relaxed">
                Your password has been successfully updated. You can now log in with your new password.
              </p>
            </div>

            <button
              onClick={onSuccess}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Continue to Sign In
            </button>
          </div>
        </div>

        {/* Right Side - Illustration */}
        <div className="flex-1 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-16 h-16 border-2 border-white rounded-lg"></div>
            <div className="absolute top-40 right-32 w-8 h-8 border border-white rounded-full"></div>
            <div className="absolute top-60 left-40 w-12 h-12 border border-white rounded-full"></div>
            <div className="absolute bottom-40 right-20 w-20 h-20 border-2 border-white rounded-lg"></div>
          </div>

          {/* Success Illustration */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="w-80 h-80 relative">
                <div className="absolute inset-0 bg-white bg-opacity-20 rounded-full"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <CheckCircle className="w-32 h-32 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Wave */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg className="w-full h-24 text-blue-700" fill="currentColor" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"></path>
              <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5"></path>
              <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
            </svg>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex">
        {/* Left Side - Error Message */}
        <div className="flex-1 flex items-center justify-center bg-white px-8 py-12">
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="mb-8">
              <img src="https://drlevy.ai/logo.png" alt="DrLevy.Ai" className="h-10" />
            </div>

            {/* Error Icon */}
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>

            {/* Error Text */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Invalid Reset Link</h1>
              <p className="text-gray-600">
                This password reset link is invalid or has expired.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3 mb-6">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            <button
              onClick={onSuccess}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        </div>

        {/* Right Side - Illustration */}
        <div className="flex-1 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-16 h-16 border-2 border-white rounded-lg"></div>
            <div className="absolute top-40 right-32 w-8 h-8 border border-white rounded-full"></div>
            <div className="absolute bottom-40 right-20 w-20 h-20 border-2 border-white rounded-lg"></div>
          </div>

          {/* Bottom Wave */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg className="w-full h-24 text-blue-700" fill="currentColor" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"></path>
              <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5"></path>
              <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-12">
            <img src="https://drlevy.ai/logo.png" alt="DrLevy.Ai" className="h-10" />
          </div>

          {/* Welcome Text */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset your password</h1>
            <p className="text-gray-600">Enter your new password below</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3"
              >
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <span className="text-red-700 text-sm">{error}</span>
              </motion.div>
            )}

            {/* New Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder=""
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Must be at least 8 characters long
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder=""
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Reset Password Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                'Reset Password'
              )}
            </button>
          </form>

          {/* Back Link */}
          <div className="mt-8 text-center">
            <button
              onClick={onSuccess}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div className="flex-1 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-16 h-16 border-2 border-white rounded-lg"></div>
          <div className="absolute top-40 right-32 w-8 h-8 border border-white rounded-full"></div>
          <div className="absolute top-60 left-40 w-12 h-12 border border-white rounded-full"></div>
          <div className="absolute bottom-40 right-20 w-20 h-20 border-2 border-white rounded-lg"></div>
          <div className="absolute bottom-60 left-20 w-6 h-6 border border-white rounded-full"></div>
          <div className="absolute top-32 right-16 w-4 h-4 bg-white rounded-full"></div>
          <div className="absolute bottom-32 left-32 w-3 h-3 bg-white rounded-full"></div>
        </div>

        {/* Password Reset Illustration */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="w-80 h-80 relative">
              {/* Background Circle */}
              <div className="absolute inset-0 bg-white bg-opacity-20 rounded-full"></div>

              {/* Lock and Key Illustration */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Lock Icon */}
                  <div className="w-24 h-32 bg-white bg-opacity-90 rounded-lg shadow-lg flex items-center justify-center">
                    <Lock className="w-12 h-12 text-blue-600" />
                  </div>

                  {/* Key Icon */}
                  <div className="absolute -right-12 top-12">
                    <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg transform rotate-45">
                      <KeyRound className="w-8 h-8 text-gray-800 transform -rotate-45" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-8 -left-8 w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
                <Lock className="w-6 h-6 text-white" />
              </div>

              <div className="absolute -bottom-4 -right-4 w-10 h-10 bg-white bg-opacity-30 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-24 text-blue-700" fill="currentColor" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"></path>
            <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5"></path>
            <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
          </svg>
        </div>
      </div>
    </div>
  );
}
