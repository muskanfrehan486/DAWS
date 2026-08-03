import { useState } from 'react';
import { FileText, Eye, EyeOff, ArrowRight, Shield, Zap, CheckCircle } from 'lucide-react';

type UserRole = 'administrator' | 'user';

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
      setError('Please enter your username and password.');
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setLoading(false);
    const role: UserRole = username.toLowerCase().includes('admin') ? 'administrator' : 'user';
    onLogin(role);
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Left panel — form */}
      <div className="flex-1 flex flex-col justify-center items-center px-8 py-12 bg-white min-w-0">
        <div className="w-full max-w-[400px]">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #0f6cbd 100%)' }}>
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
                    className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors bg-white"
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
                      className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors bg-white pr-10"
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
                  style={{ background: loading ? '#64a7e0' : 'linear-gradient(135deg, #3b82f6 0%, #0f6cbd 100%)' }}
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
                    className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <button
                  type="button"
                  className="w-full py-2.5 rounded-lg text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #0f6cbd 100%)' }}
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

      {/* Right panel — illustration */}
      <div
        className="hidden lg:flex flex-1 flex-col justify-center items-center p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f6cbd 100%)' }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #60a5fa 0%, transparent 70%)' }} />
          <div className="absolute -bottom-16 -left-16 w-96 h-96 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }} />
          {/* Grid lines */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
        </div>

        <div className="relative z-10 w-full max-w-sm">
          {/* Central illustration */}
          <div className="mb-10">
            <ApprovalIllustration />
          </div>

          <h2 className="text-white text-2xl font-bold mb-3 text-center">
            Streamline Your Approvals
          </h2>
          <p className="text-blue-200 text-sm text-center mb-8 leading-relaxed">
            Route documents through customizable approval chains and track every decision with full audit transparency.
          </p>

          <div className="space-y-3">
            {[
              { icon: Shield, text: 'End-to-end audit trail for every document' },
              { icon: Zap, text: 'Custom approval chains per document' },
              { icon: CheckCircle, text: 'Real-time status tracking and notifications' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={14} className="text-blue-300" />
                </div>
                <span className="text-blue-100 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ApprovalIllustration() {
  const steps = [
    { label: 'Document Uploaded', sublabel: 'Budget_FY2025.xlsx', color: '#3b82f6', done: true },
    { label: 'Jennifer Park', sublabel: 'Reviewer · HR Dept', color: '#10b981', done: true },
    { label: 'Sarah Mitchell', sublabel: 'Approver · IT Dept', color: '#10b981', done: true },
    { label: 'Ali Hassan', sublabel: 'Approver · Finance', color: '#3b82f6', current: true },
    { label: 'Michael Torres', sublabel: 'Approver · CEO', color: '#475569', done: false },
  ];

  return (
    <div className="relative">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-5 space-y-0">
        <div className="text-xs font-semibold text-blue-300 uppercase tracking-widest mb-4 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          Live Approval Chain
        </div>
        {steps.map((step, i) => (
          <div key={i}>
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center mt-0.5">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: step.current ? 'rgba(59,130,246,0.3)' : step.done ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.1)',
                    border: step.current ? '2px solid #3b82f6' : step.done ? '2px solid #10b981' : '1.5px solid rgba(255,255,255,0.2)',
                  }}
                >
                  {step.done && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                  {step.current && <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
                  {!step.done && !step.current && <div className="w-2 h-2 rounded-full bg-slate-500" />}
                </div>
                {i < steps.length - 1 && (
                  <div className="w-px flex-1 my-1" style={{
                    height: 16,
                    background: step.done ? '#10b981' : 'rgba(255,255,255,0.15)',
                  }} />
                )}
              </div>
              <div className="pb-1">
                <div className={`text-xs font-semibold ${step.current ? 'text-blue-300' : step.done ? 'text-emerald-300' : 'text-slate-400'}`}>
                  {step.label}
                  {step.current && <span className="ml-2 text-[9px] bg-blue-500/30 text-blue-300 px-1.5 py-0.5 rounded">Active</span>}
                </div>
                <div className="text-[10px] text-white/40 mt-0.5">{step.sublabel}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
