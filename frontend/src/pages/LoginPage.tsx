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

export default function LoginPage() {
  const navigate = useNavigate()
  const { login: completeLogin } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
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
      className="min-h-screen flex bg-white"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <IdeasBrandPanel />

      <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-10 lg:px-16 min-w-0">
        <div className="w-full max-w-[420px]">
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: '#1b803f' }}
            >
              <FileText size={20} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-lg leading-tight">
                Ideas Flow
              </div>
              <div
                className="text-sm font-medium leading-tight"
                style={{ color: '#1b803f' }}
              >
                Ideas
              </div>
            </div>
          </div>

          <h1 className="text-[2rem] font-bold text-slate-900 tracking-tight mb-1.5">
            Welcome back
          </h1>
          <p className="text-slate-500 text-[15px] mb-8">
            Sign in to your Document Approval Workflow System
          </p>

          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  strokeWidth={1.75}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1b803f] pointer-events-none"
                />
                <input
                  type="email"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full pl-11 pr-3 py-3 text-sm text-slate-800 placeholder:text-slate-400 bg-white border border-slate-200 rounded-lg outline-none focus:border-[#1b803f] focus:ring-2 focus:ring-[#1b803f]/15 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  strokeWidth={1.75}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1b803f] pointer-events-none"
                />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-11 py-3 text-sm text-slate-800 placeholder:text-slate-400 bg-white border border-slate-200 rounded-lg outline-none focus:border-[#1b803f] focus:ring-2 focus:ring-[#1b803f]/15 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold text-white transition-all mt-1 disabled:opacity-70"
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

          <p className="mt-8 text-center text-sm font-semibold tracking-wide" style={{ color: '#2e8a4a' }}>
            Secure. Efficient. Collaborative.
          </p>
        </div>
      </div>
    </div>
  )
}
