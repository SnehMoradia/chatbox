import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Mail, Loader2, ArrowRight, AtSign } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        username: username.toLowerCase().trim(),
        displayName: displayName.trim(),
        email: email.toLowerCase().trim(),
        password,
      });
      navigate('/');
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setError(errorObj.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-teamsDark-rail p-4 select-none">
      <div className="w-full max-w-md bg-white dark:bg-teamsDark-sidebar rounded-2xl shadow-xl border border-gray-200 dark:border-teamsDark-border overflow-hidden">
        {/* Header */}
        <div className="p-8 pb-6 text-center border-b border-gray-100 dark:border-teamsDark-border">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teams-700 via-teams-500 to-indigo-400 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-md">
            <span>TC</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Create Your Account
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Join your team on Microsoft Teams-inspired real-time chat
          </p>
        </div>

        <div className="p-8 pt-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-200 dark:border-rose-900">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Full Display Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Morgan Chen"
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-teamsDark-input text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-teamsDark-border focus:border-teams-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Username (@handle)
              </label>
              <div className="relative">
                <AtSign className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. morgan_c"
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-teamsDark-input text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-teamsDark-border focus:border-teams-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Work / Personal Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="morgan@teamschat.dev"
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
                  placeholder="Minimum 6 characters"
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-teamsDark-input text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-teamsDark-border focus:border-teams-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !username || !displayName || !email || !password}
              className="w-full py-2.5 px-4 rounded-xl bg-teams-500 hover:bg-teams-600 disabled:opacity-50 text-white font-semibold text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Login link */}
          <div className="text-center pt-2 border-t border-gray-100 dark:border-teamsDark-border">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-teams-600 dark:text-teams-400 font-semibold hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
