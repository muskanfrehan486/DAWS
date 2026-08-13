import { useState } from 'react';
import { FileText, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { login } from '../services/authApi.ts';
import type { UserRole } from '../types/user.ts';
import IdeasBrandPanel from '../components/IdeasBrandPanel.tsx';

interface LoginPageProps {
  onLogin: (role: UserRole) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);

    try {
      const result = await login(username, password);
      onLogin(result.user.role);
    } catch (err: any) {
      setError(err?.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Left panel — form */}
      <div className="flex-1 flex flex-col justify-center items-center px-8 py-12 bg-white min-w-0">
        <div className="w-full max-w-[400px]">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)' }}>
              <FileText size={20} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-base leading-tight">DocFlow</div>
              <div className="text-slate-400 text-xs leading-tight">Ideas</div>
            </div>
          </div>

          {!forgotMode ? (
            <>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h1>
              <p className="text-slate-500 text-sm mb-8">Sign in to Document Approval Workflow System</p>

              {error && (
                <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors bg-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white transition-all mt-2"
                  style={{ background: loading ? '#86efac' : 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)' }}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>Sign In <ArrowRight size={15} /></>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Reset password</h1>
              <p className="text-slate-500 text-sm mb-8">Enter your email to receive a password reset link.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                  <input
                    type="email"
                    placeholder="you@company.com"
                    className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <button
                  type="button"
                  className="w-full py-2.5 rounded-lg text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)' }}
                >
                  Send Reset Link
                </button>
                <button
                  onClick={() => setForgotMode(false)}
                  className="w-full py-2.5 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  ← Back to Sign In
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <IdeasBrandPanel />
    </div>
  );
}
