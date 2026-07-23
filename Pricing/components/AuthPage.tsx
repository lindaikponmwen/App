
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { USE_PHP_BACKEND } from '../constants';

interface AuthPageProps {
  onLogin: (user: any) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const joinToken = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!USE_PHP_BACKEND) {
      setTimeout(() => {
        setLoading(false);
        if (isLogin) {
          const isAdmin = email.toLowerCase().includes('admin');
          onLogin({
            id: 12345,
            name: name || "Demo User",
            email: email || "demo@example.com",
            role: isAdmin ? 'admin' : 'user',
            plan: 'free',
            subscription_status: 'inactive'
          });
          if (!joinToken) navigate('/');
        } else {
          setSuccess('Account created! Sign in to continue.');
          setIsLogin(true);
        }
      }, 800);
      return;
    }

    try {
      const endpoint = isLogin ? 'php/login.php' : 'php/register.php';
      const payload = isLogin ? { email, password } : { name, email, password };
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      
      if (text.trim().startsWith('<?php')) {
        throw new Error("Server misconfigured: PHP not executing.");
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error("Server returned invalid response format.");
      }

      if (!response.ok) throw new Error(data.error || 'Request failed');

      if (isLogin) {
        onLogin(data.user);
        if (!joinToken) navigate('/');
      } else {
        setSuccess('Account created! Please sign in.');
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full bg-white border border-gray-100 p-8 shadow-sm">
        <div className="text-center mb-8">
          <div className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
            <span>drlevy</span>
            <span className="text-blue-600 ml-1">AI</span>
          </div>
          <p className="text-gray-500 text-sm">
            {isLogin ? 'Sign in to access research tools' : 'Create your research account'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold uppercase tracking-wider text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-3 bg-green-50 border border-green-100 text-green-600 text-xs font-bold uppercase tracking-wider text-center">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-600 text-sm"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {!isLogin && (
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-600 text-sm"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-600 text-sm"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-slate-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Register')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
          >
            {isLogin ? "New to drlevy AI? Create account" : "Already a member? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
