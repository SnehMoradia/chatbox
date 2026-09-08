import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Lock, Mail, Loader2, ArrowRight, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email: email.trim(), password });
      navigate('/');
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setError(errorObj.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setError('');
    setIsLoading(true);
    try {
      await login({ email: demoEmail, password: 'Password123!' });
      navigate('/');
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setError(errorObj.response?.data?.message || 'Demo login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-teamsDark-rail p-4 select-none">
      <div className="w-full max-w-md bg-white dark:bg-teamsDark-sidebar rounded-2xl shadow-xl border border-gray-200 dark:border-teamsDark-border overflow-hidden">
        {/* Top Header */}
        <div className="p-8 pb-6 text-center border-b border-gray-100 dark:border-teamsDark-border">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teams-700 via-teams-500 to-indigo-400 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-md">
            <span>TC</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Welcome to Teams Chat
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Real-time chat platform built for modern team collaboration
          </p>
        </div>

        <div className="p-8 pt-6 space-y-6">
          {/* Quick Demo Logins Banner */}
          <div className="p-3 rounded-xl bg-teams-50/80 dark:bg-teams-900/30 border border-teams-100 dark:border-teams-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-teams-700 dark:text-teams-300 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>1-Click Instant Demo Logins:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('alex@teamschat.dev')}
                className="py-1.5 px-2 text-xs font-semibold rounded-lg bg-white dark:bg-teamsDark-card text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-teamsDark-border hover:border-teams-500 transition-colors truncate"
              >
                👤 Alex (Designer)
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('jordan@teamschat.dev')}
                className="py-1.5 px-2 text-xs font-semibold rounded-lg bg-white dark:bg-teamsDark-card text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-teamsDark-border hover:border-teams-500 transition-colors truncate"
              >
                👤 Jordan (Frontend)
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-200 dark:border-rose-900">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@teamschat.dev"
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-teamsDark-input text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-teamsDark-border focus:border-teams-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-teamsDark-input text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-teamsDark-border focus:border-teams-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full py-2.5 px-4 rounded-xl bg-teams-500 hover:bg-teams-600 disabled:opacity-50 text-white font-semibold text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Bottom link */}
          <div className="text-center pt-2 border-t border-gray-100 dark:border-teamsDark-border">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Don&apos;t have an account yet?{' '}
              <Link
                to="/register"
                className="text-teams-600 dark:text-teams-400 font-semibold hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
