import { Mail, CheckCircle, ArrowLeft, RefreshCw, Shield, Lock, ExternalLink } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { authService } from '../services/authService';

export default function EmailConfirmationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    const state = location.state as { email?: string };
    if (state?.email) {
      setEmail(state.email);
    } else {
      navigate('/login');
    }
  }, [location.state, navigate]);

  const handleResendEmail = async () => {
    setResending(true);

    try {
      const result = await authService.resendConfirmationEmail(email);

      if (result.success) {
        setResent(true);
        setTimeout(() => setResent(false), 3000);
      } else {
        console.error('Failed to resend email:', result.error);
      }
    } catch (err) {
      console.error('Error resending email:', err);
    } finally {
      setResending(false);
    }
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
            
            {/* Icon */}
            <div className="flex justify-center mb-8">
              <div className="h-20 w-20 bg-blue-50 border border-blue-100 flex items-center justify-center rounded-none">
                <Mail className="h-10 w-10 text-blue-600" />
              </div>
            </div>

            {/* Content */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-3">Check your inbox</h1>
              <p className="text-gray-600">
                We've sent a verification link to
              </p>
              <p className="font-semibold text-gray-900 mt-1">{email || 'your email address'}</p>
            </div>

            {/* Instructions Box */}
            <div className="bg-gray-50 border border-gray-200 p-5 mb-8 rounded-none">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-gray-600 text-left">
                  <p className="font-bold text-gray-900 mb-2 uppercase tracking-wide text-xs">Next Steps</p>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-gray-400 mr-2 rounded-none"></span>
                      Click the link in the email to verify
                    </li>
                    <li className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-gray-400 mr-2 rounded-none"></span>
                      Sign in to your account
                    </li>
                    <li className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-gray-400 mr-2 rounded-none"></span>
                      Set up Two-Factor Authentication
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={() => window.open('https://mail.google.com', '_blank')}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors flex items-center justify-center group rounded-none"
              >
                <span>Open Email App</span>
                <ExternalLink className="w-4 h-4 ml-2 opacity-80 group-hover:opacity-100" />
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleResendEmail}
                  disabled={resending || resent}
                  className="py-3 px-4 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
                >
                  {resending ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  {resent ? 'Sent' : 'Resend'}
                </button>

                <button
                  onClick={() => navigate('/login')}
                  className="py-3 px-4 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium transition-colors flex items-center justify-center rounded-none"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Sign In
                </button>
              </div>
            </div>

            <p className="text-center text-xs text-gray-500 mt-6">
              Did not receive the email? Check your spam filter.
            </p>
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