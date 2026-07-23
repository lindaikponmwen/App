import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, User, ArrowLeft, Send, CheckCircle, AlertCircle, Lock } from 'lucide-react';
import { requestPasswordReset, type PasswordResetRequest } from '../data/authData';

interface ForgotPasswordPageProps {
  onBack: () => void;
}

export default function ForgotPasswordPage({ onBack }: ForgotPasswordPageProps) {
  const [formData, setFormData] = useState<PasswordResetRequest>({
    email: '',
    username: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await requestPasswordReset(formData);

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || 'Password reset request failed');
    }

    setIsLoading(false);
  };

  const handleInputChange = (field: keyof PasswordResetRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(''); // Clear error when user starts typing
  };

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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Check your email</h1>
              <p className="text-gray-600 leading-relaxed">
                We've sent password reset instructions to <strong>{formData.email}</strong>. 
                Please check your email and follow the link to reset your password.
              </p>
            </div>

            <button
              onClick={onBack}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </button>
          </div>
        </div>

        {/* Right Side - Illustration */}
        <div className="flex-1 bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-16 h-16 border-2 border-white rounded-lg"></div>
            <div className="absolute top-40 right-32 w-8 h-8 border border-white rounded-full"></div>
            <div className="absolute top-60 left-40 w-12 h-12 border border-white rounded-full"></div>
            <div className="absolute bottom-40 right-20 w-20 h-20 border-2 border-white rounded-lg"></div>
            <div className="absolute bottom-60 left-20 w-6 h-6 border border-white rounded-full"></div>
          </div>

          {/* Email Sent Illustration */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="w-80 h-80 relative">
                {/* Background Circle */}
                <div className="absolute inset-0 bg-white bg-opacity-20 rounded-full"></div>
                
                {/* Email Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <div className="w-32 h-24 bg-white bg-opacity-90 rounded-lg shadow-lg relative">
                      {/* Email Content Lines */}
                      <div className="absolute top-4 left-4 right-4 space-y-2">
                        <div className="h-2 bg-purple-300 rounded w-3/4"></div>
                        <div className="h-2 bg-purple-200 rounded w-1/2"></div>
                        <div className="h-2 bg-purple-200 rounded w-2/3"></div>
                      </div>
                      
                      {/* Email Flap */}
                      <div className="absolute -top-2 left-0 right-0 h-6 bg-white bg-opacity-90 rounded-t-lg border-b-2 border-purple-300"></div>
                    </div>
                    
                    {/* Flying Animation */}
                    <div className="absolute -top-8 -right-8 w-8 h-8 bg-emerald-400 rounded-full flex items-center justify-center animate-bounce">
                      <Send className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Wave */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg className="w-full h-24 text-purple-700" fill="currentColor" viewBox="0 0 1200 120" preserveAspectRatio="none">
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
          <div className="mb-8">
            <img src="https://drlevy.ai/logo.png" alt="DrLevy.Ai" className="h-10" />
          </div>

          {/* Welcome Text */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot password?</h1>
            <p className="text-gray-600">No worries, we'll send you reset instructions</p>
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

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder=""
                required
              />
            </div>

            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder=""
                required
              />
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-700 text-sm">
                We need both your email and username to verify your identity and send reset instructions.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send reset instructions</span>
                </>
              )}
            </button>
          </form>

          {/* Back Link */}
          <div className="mt-8">
            <button
              onClick={onBack}
              className="w-full flex items-center justify-center space-x-2 text-gray-600 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </button>
          </div>

          {/* Demo Info */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Demo Users:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div>sarah.chen@research.com / sarah</div>
              <div>william.hane@research.com / william</div>
              <div>curtis.lee@research.com / curtis</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div className="flex-1 bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 relative overflow-hidden">
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
                  {/* Lock */}
                  <div className="w-24 h-32 bg-white bg-opacity-90 rounded-lg shadow-lg relative mb-4">
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 border-4 border-purple-400 rounded-full"></div>
                    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-3 h-6 bg-purple-400 rounded-full"></div>
                  </div>
                  
                  {/* Key */}
                  <div className="absolute -right-8 top-8 transform rotate-45">
                    <div className="w-16 h-2 bg-yellow-400 rounded-full relative">
                      <div className="absolute right-0 top-0 w-6 h-6 bg-yellow-400 rounded-full -translate-y-2"></div>
                      <div className="absolute left-2 -top-1 w-2 h-1 bg-yellow-400"></div>
                      <div className="absolute left-4 -bottom-1 w-2 h-1 bg-yellow-400"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-8 -left-8 w-12 h-12 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
                <Lock className="w-6 h-6 text-white" />
              </div>
              
              <div className="absolute -bottom-4 -right-4 w-10 h-10 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-24 text-purple-700" fill="currentColor" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"></path>
            <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5"></path>
            <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
          </svg>
        </div>
      </div>
    </div>
  );
}