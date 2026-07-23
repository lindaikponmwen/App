import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, ShieldCheck, Crown, Shield, User, UserX, Sparkles, ArrowRight, Layers, Check, Lock } from 'lucide-react';
import { type LoginCredentials, setCachedUser, verifyCredentials, verifyTwoFactorCode } from '../data/authData';
import { authService } from '../services/authService';

interface LoginPageProps {
  onLogin: () => void;
  onShowRegister: () => void;
  onShowForgotPassword: () => void;
}

export default function LoginPage({ onLogin, onShowRegister, onShowForgotPassword }: LoginPageProps) {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Use mock authentication (PHP backend commented out)
      const result = await authService.verifyCredentials(credentials);
      //const result = await verifyCredentials(credentials);

      if (result.success && result.requiresTwoFactor) {
        setUserEmail(result.email || '');
        setShowTwoFactor(true);
        setError('');
      } else if (result.success) {
        // For mock auth, session is already established
        const sessionCheck = await authService.verifySession();
         if (sessionCheck.authenticated && sessionCheck.user) {
           setCachedUser(sessionCheck.user);
           onLogin();
         } else {
           setError('Failed to establish session');
         }
        onLogin();
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login');
    }

    setIsLoading(false);
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Use mock authentication (PHP backend commented out)
      const result = await authService.verifyTwoFactorCode(credentials.username, verificationCode);
      // const result = await verifyTwoFactorCode(credentials.username, verificationCode);

      if (result.success && result.user) {
        setCachedUser(result.user);
        onLogin();
      } else {
        setError(result.error || 'Invalid verification code');
        setVerificationCode('');
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      setError('An error occurred during verification');
      setVerificationCode('');
    }

    setIsLoading(false);
  };

  const handleResendCode = async () => {
    setError('');
    setIsLoading(true);

    try {
      // Use mock authentication (PHP backend commented out)
      const result = await authService.verifyCredentials(credentials);
      // const result = await verifyCredentials(credentials);
      if (result.success && result.requiresTwoFactor) {
        setError('');
        alert('A new verification code has been sent to your email.');
      }
    } catch (error) {
      console.error('Resend code error:', error);
    }

    setIsLoading(false);
  };

  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center bg-white px-8 py-12 overflow-y-auto">
        <div className="w-full max-w-md my-auto">
          {/* Logo */}
          <div className="mb-8">
            <img src="https://drlevy.ai/logo.png" alt="DrLevy.Ai" className="h-10" />
          </div>

          {/* Welcome Text */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {showTwoFactor ? 'Verify Your Identity' : 'Welcome back'}
            </h1>
            <p className="text-gray-600">
              {showTwoFactor ? 'Enter the verification code sent to your email' : 'Please enter your details'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={showTwoFactor ? handleTwoFactorSubmit : handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 border border-red-200 rounded-none p-4 flex items-center space-x-3"
              >
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <span className="text-red-700 text-sm">{error}</span>
              </motion.div>
            )}

            {!showTwoFactor ? (
              <>
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username 
                  </label>
                  <input
                    type="text"
                    value={credentials.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
                    placeholder=""
                    required
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={credentials.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
                      placeholder=""
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded-none focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Remember for 30 days</span>
                  </label>
                  <button
                    type="button"
                    onClick={onShowForgotPassword}
                    className="text-sm text-blue-600 font-medium hover:text-blue-700"
                  >
                    Forgot password
                  </button>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-3 rounded-none font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                  ) : (
                    'Sign in'
                  )}
                </button>
              </>
            ) : (
              <>
                {/* Two-Factor Authentication Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-none flex items-center justify-center">
                      <ShieldCheck className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Two-Factor Authentication
                    </h3>
                    <p className="text-sm text-gray-600">
                      We've sent a 10-digit verification code to
                    </p>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {userEmail}
                    </p>
                  </div>

                  {/* Verification Code Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setVerificationCode(value);
                        if (error) setError('');
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-widest"
                      placeholder="0000000000"
                      maxLength={10}
                      required
                      autoFocus
                    />
                    <p className="mt-2 text-xs text-gray-500 text-center">
                      Enter the 10-digit code sent to your email
                    </p>
                  </div>

                  {/* Verify Button */}
                  <button
                    type="submit"
                    disabled={isLoading || verificationCode.length !== 10}
                    className="w-full bg-blue-600 text-white py-3 rounded-none font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                    ) : (
                      'Verify & Sign In'
                    )}
                  </button>

                  {/* Resend Code */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={isLoading}
                      className="text-sm text-blue-600 font-medium hover:text-blue-700 disabled:opacity-50"
                    >
                      Resend Code
                    </button>
                  </div>

                  {/* Back to Login */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setShowTwoFactor(false);
                        setVerificationCode('');
                        setError('');
                      }}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      Back to Login
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </form>

          {/* Security & 2FA Indication */}
          <div className="mt-8 flex flex-col items-center space-y-3 pt-6 border-t border-gray-100">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Shield className="w-4 h-4" />
              <span className="font-medium">Protected by enterprise-grade security</span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-gray-400 bg-gray-50 px-3 py-1 border border-gray-100 rounded-none">
              <Lock className="w-3 h-3" />
              <span>2FA enabled by default</span>
            </div>
          </div>

          {/* Sign Up Link */}
          {!showTwoFactor && (
            <div className="mt-6 text-center">
              <span className="text-gray-600">Don't have an account? </span>
              <button
                onClick={onShowRegister}
                className="text-blue-600 font-medium hover:text-blue-700"
              >
                Sign up
              </button>
            </div>
          )}

          
        </div>
      </div>

      {/* Right Side - Platform Features */}
      <div className="relative hidden w-0 flex-1 lg:block bg-zinc-950 overflow-hidden">
        {/* Background Pattern & Glows */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex h-full flex-col justify-center px-16 py-12 relative z-10">
          <div className="max-w-2xl mx-auto space-y-8">
            
            <h2 className="text-3xl font-bold text-white tracking-tight leading-tight">
              A complete end-to-end pharmacometrics platform
            </h2>

            <p className="text-lg text-gray-400 leading-relaxed">
              DrLevy.Ai transforms how your team works. From initial analysis planning to model development to regulatory submission, DrLevy.AI streamlines every phase of your workflow with intelligent automation, integrated project management, and unified tools for data preparation through advanced modeling.
            </p>

            <div className="space-y-4 pt-4">
              {[
                "Cut analysis cycles significantly",
                "Enhance team collaboration",
                "Handle analyses in one powerful environment"
              ].map((item, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-none bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <span className="text-gray-300 font-medium">{item}</span>
                </div>
              ))}
            </div>

            <div className="pt-8">
              <a 
                href="https://drlevy.ai/#request-demo" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all rounded-none shadow-lg hover:shadow-blue-500/25 border border-transparent hover:border-blue-400"
              >
                Book a Demo <ArrowRight className="ml-2 w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}