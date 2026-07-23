import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Shield, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { authService } from '../services/authService';

export default function EmailVerificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. No token provided.');
        return;
      }

      try {
        const result = await authService.confirmEmail(token);

        if (result.success) {
          setStatus('success');
          setMessage('Your email has been verified successfully! You can now log in to your account.');
        } else {
          setStatus('error');
          // Provide more helpful error message for backend configuration issues
          if (result.error?.includes('non-JSON response') || result.error?.includes('backend endpoint')) {
            setMessage('Email verification is currently unavailable. Please contact support at selena@pharmacometric.com for assistance.');
          } else {
            setMessage(result.error || 'Failed to verify email. The link may be invalid or expired.');
          }
        }
      } catch (err) {
        setStatus('error');
        setMessage('An unexpected error occurred. Please contact support if the issue persists.');
      }
    };

    verifyEmail();
  }, [searchParams]);

  const handleContinue = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Header */}
      <div className="p-6">
        <img src="https://drlevy.ai/logo.png" alt="DrLevy.Ai" className="h-8" />
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Main Container - Sharp Edges */}
          <div className="bg-white border border-gray-200 p-8 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]">
            
            <div className="flex flex-col items-center text-center">
              {status === 'verifying' && (
                <>
                  <div className="h-20 w-20 bg-blue-50 border border-blue-100 flex items-center justify-center rounded-none mb-6">
                    <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-3">
                    Verifying Your Email
                  </h1>
                  <p className="text-gray-600">
                    Please wait while we verify your email address...
                  </p>
                </>
              )}

              {status === 'success' && (
                <>
                  <div className="h-20 w-20 bg-emerald-50 border border-emerald-100 flex items-center justify-center rounded-none mb-6">
                    <CheckCircle className="h-10 w-10 text-emerald-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-3">
                    Email Verified
                  </h1>
                  <div className="bg-emerald-50 border border-emerald-100 p-4 w-full mb-6 text-left rounded-none">
                    <p className="text-sm text-emerald-800 leading-relaxed">
                      {message}
                    </p>
                  </div>
                  <button
                    onClick={handleContinue}
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors flex items-center justify-center rounded-none group"
                  >
                    <span>Continue to Login</span>
                    <ArrowRight className="w-4 h-4 ml-2 opacity-80 group-hover:opacity-100" />
                  </button>
                </>
              )}

              {status === 'error' && (
                <>
                  <div className="h-20 w-20 bg-red-50 border border-red-100 flex items-center justify-center rounded-none mb-6">
                    <XCircle className="h-10 w-10 text-red-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-3">
                    Verification Failed
                  </h1>
                  <div className="bg-red-50 border border-red-100 p-4 w-full mb-6 text-left flex items-start space-x-3 rounded-none">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800 leading-relaxed">
                      {message}
                    </p>
                  </div>
                  <div className="space-y-3 w-full">
                    <button
                      onClick={handleContinue}
                      className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 text-white font-medium transition-colors rounded-none"
                    >
                      Go to Login
                    </button>
                    <button
                      onClick={() => navigate('/email-confirmation')}
                      className="w-full py-3 px-4 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium transition-colors rounded-none"
                    >
                      Resend Verification Email
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Support Link */}
            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-500">
                Need help?{' '}
                <a
                  href="mailto:selena@pharmacometric.com"
                  className="text-blue-600 font-medium hover:underline"
                >
                  Contact Support
                </a>
              </p>
            </div>
          </div>

          {/* Security Footer */}
          <div className="mt-8 flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Shield className="w-4 h-4" />
              <span className="font-medium">Protected by enterprise-grade security</span>
            </div>
            <div className="flex items-center space-x-2 bg-white border border-gray-200 px-4 py-2 rounded-none">
              <Lock className="w-3 h-3 text-emerald-600" />
              <span className="text-xs text-gray-600 font-medium uppercase tracking-wide">2FA Enabled by Default</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}