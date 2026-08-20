import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Eye,
  EyeOff,
  FileText,
  Lock,
  Mail,
} from 'lucide-react'
import { login } from '../services/authApi.ts'
import IdeasBrandPanel from '../components/IdeasBrandPanel.tsx'
import { useAuth } from '../contexts/AuthContext'
import { ROUTES } from '../types/routes'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { login: completeLogin } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username || !password) {
      setError('Please enter your email and password.')
      return
    }

    setLoading(true)

    try {
      const result = await login(username, password)
      completeLogin(result.user.role)
      navigate(ROUTES.home, { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex bg-[#eef1f4]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-8 lg:px-10 min-w-0">
        <div className="w-full max-w-[460px] bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgba(15,23,42,0.06)] px-6 py-8 sm:px-9 sm:py-10">
          <div className="flex items-center gap-3 mb-8">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: '#1b803f' }}
            >
              <FileText size={20} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-lg leading-tight">
                DocFlow
              </div>
              <div
                className="text-sm font-medium leading-tight"
                style={{ color: '#1b803f' }}
              >
                Ideas
              </div>
            </div>
          </div>

          {!forgotMode ? (
            <>
              <h1 className="text-[1.75rem] font-bold text-slate-900 mb-1">
                Welcome back
              </h1>
              <p className="text-slate-500 text-sm mb-7">
                Sign in to your Document Approval Workflow System
              </p>

              {error && (
                <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    Email
                  </label>
                  <div className="flex items-stretch border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:border-[#1b803f] focus-within:ring-2 focus-within:ring-[#1b803f]/15 transition-all">
                    <div className="flex items-center justify-center w-12 bg-emerald-50 text-[#1b803f] flex-shrink-0">
                      <Mail size={18} strokeWidth={1.75} />
                    </div>
                    <input
                      type="email"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="you@company.com"
                      className="flex-1 min-w-0 px-3 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    Password
                  </label>
                  <div className="flex items-stretch border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:border-[#1b803f] focus-within:ring-2 focus-within:ring-[#1b803f]/15 transition-all">
                    <div className="flex items-center justify-center w-12 bg-emerald-50 text-[#1b803f] flex-shrink-0">
                      <Lock size={18} strokeWidth={1.75} />
                    </div>
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="flex-1 min-w-0 px-3 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="flex items-center justify-center w-11 text-slate-400 hover:text-slate-600 flex-shrink-0"
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                    >
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white transition-all mt-2 disabled:opacity-70"
                  style={{ background: loading ? '#4caf7d' : '#1b803f' }}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-[1.75rem] font-bold text-slate-900 mb-1">
                Reset password
              </h1>
              <p className="text-slate-500 text-sm mb-7">
                Enter your email to receive a password reset link.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    Email address
                  </label>
                  <div className="flex items-stretch border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:border-[#1b803f] focus-within:ring-2 focus-within:ring-[#1b803f]/15 transition-all">
                    <div className="flex items-center justify-center w-12 bg-emerald-50 text-[#1b803f] flex-shrink-0">
                      <Mail size={18} strokeWidth={1.75} />
                    </div>
                    <input
                      type="email"
                      placeholder="you@company.com"
                      className="flex-1 min-w-0 px-3 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white"
                  style={{ background: '#1b803f' }}
                >
                  Send Reset Link
                </button>

                <button
                  type="button"
                  onClick={() => setForgotMode(false)}
                  className="w-full py-3 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
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
  )
}
