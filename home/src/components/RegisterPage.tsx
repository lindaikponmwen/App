import React, { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, Building, Briefcase, AlertCircle, ArrowLeft, CheckCircle, Check, X, Layers, ArrowRight, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import { authService } from '../services/authService';

interface RegisterPageProps {
  onBack: () => void;
  onRegisterSuccess: () => void;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  { label: 'At least 8 characters', test: (pwd) => pwd.length >= 8 },
  { label: 'One uppercase letter', test: (pwd) => /[A-Z]/.test(pwd) },
  { label: 'One lowercase letter', test: (pwd) => /[a-z]/.test(pwd) },
  { label: 'One number', test: (pwd) => /[0-9]/.test(pwd) },
  { label: 'One special character', test: (pwd) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd) }
];

export default function RegisterPage({ onBack, onRegisterSuccess }: RegisterPageProps) {
  const navigate = useNavigate();
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    name: '',
    title: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const passwordValidation = useMemo(() => {
    return passwordRequirements.map(req => ({
      label: req.label,
      met: req.test(formData.password)
    }));
  }, [formData.password]);

  const isPasswordValid = useMemo(() => {
    return passwordValidation.every(req => req.met);
  }, [passwordValidation]);

  const fieldValidation = useMemo(() => {
    return {
      username: formData.username.length >= 6,
      name: formData.name.length >= 6,
      title: formData.title.length >= 6
    };
  }, [formData.username, formData.name, formData.title]);

  const handleRecaptchaChange = (token: string | null) => {
    setRecaptchaToken(token);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fieldValidation.name) {
      setError('Full name must be at least 6 characters');
      return;
    }

    if (!fieldValidation.username) {
      setError('Username must be at least 6 characters');
      return;
    }

    if (!fieldValidation.title) {
      setError('Job title must be at least 6 characters');
      return;
    }

    if (!isPasswordValid) {
      setError('Password does not meet all requirements');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!recaptchaToken) {
      setError('Please complete the reCAPTCHA verification');
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.register({
        ...formData,
        recaptchaToken
      });

      if (result.success) {
        navigate('/email-confirmation', {
          state: { email: formData.email },
          replace: true
        });
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleBlur = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
  };

  const getFieldError = (field: 'username' | 'name' | 'title'): string | null => {
    if (!touchedFields[field] || !formData[field]) return null;
    if (!fieldValidation[field]) {
      return 'Must be at least 6 characters';
    }
    return null;
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8">
            <img src="https://drlevy.ai/logo.png" alt="DrLevy.Ai" className="h-10" />
          </div>

          {/* Welcome Text */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create account</h1>
            <p className="text-gray-600">Please enter your details</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                className={`w-full px-4 py-2.5 border rounded-none focus:outline-none focus:ring-2 text-sm ${
                  getFieldError('name')
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-slate-500'
                } focus:border-transparent`}
                placeholder=""
                required
              />
              {getFieldError('name') && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {getFieldError('name')}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                placeholder=""
                required
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                onBlur={() => handleBlur('username')}
                className={`w-full px-4 py-2.5 border rounded-none focus:outline-none focus:ring-2 text-sm ${
                  getFieldError('username')
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-slate-500'
                } focus:border-transparent`}
                placeholder=""
                required
              />
              {getFieldError('username') && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {getFieldError('username')}
                </p>
              )}
            </div>

            {/* Job Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                onBlur={() => handleBlur('title')}
                className={`w-full px-4 py-2.5 border rounded-none focus:outline-none focus:ring-2 text-sm ${
                  getFieldError('title')
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-slate-500'
                } focus:border-transparent`}
                placeholder=""
                required
              />
              {getFieldError('title') && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {getFieldError('title')}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  className="w-full pl-4 pr-12 py-2.5 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                  placeholder=""
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Requirements */}
              {(passwordFocused || formData.password) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 space-y-2"
                >
                  {passwordValidation.map((req, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      {req.met ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <X className="w-4 h-4 text-gray-400" />
                      )}
                      <span className={req.met ? 'text-green-700' : 'text-gray-600'}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="w-full pl-4 pr-12 py-2.5 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                  placeholder=""
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* reCAPTCHA */}
            <div className="flex justify-center">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={import.meta.env?.VITE_RECAPTCHA_SITE_KEY || '6LcC_kcsAAAAAEONUvD3hVgryGgjjSd9xGMPhIFg'}
                onChange={handleRecaptchaChange}
                theme="light"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !recaptchaToken}
              className="w-full bg-slate-900 text-white py-3 rounded-none font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                'Create account'
              )}
            </button>
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

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <span className="text-gray-600">Already have an account? </span>
            <button
              onClick={onBack}
              className="text-slate-900 font-medium hover:underline"
            >
              Sign in
            </button>
          </div>
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