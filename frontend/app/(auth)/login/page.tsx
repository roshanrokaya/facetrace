'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { API_URL } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        document.cookie = `access_token=${data.access_token}; path=/; max-age=${60 * 60 * 24}`
        document.cookie = `refresh_token=${data.refresh_token}; path=/; max-age=${60 * 60 * 24 * 30}`
        router.push('/dashboard')
      } else {
        setError('Invalid email or password')
      }
    } catch (err) {
      setError('Connection failed. Is the server running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-purple-950 items-center justify-center p-16">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl" />

        <div className="relative text-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl shadow-blue-500/30">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="w-10 h-10">
              <path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
              <path d="M5 10a7 7 0 0 0 14 0" />
              <path d="M12 17v5" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-4">FaceTrace</h1>
          <p className="text-blue-200 text-lg max-w-sm mx-auto leading-relaxed">
            AI-powered face recognition and analytics
          </p>

          <div className="mt-12 grid grid-cols-3 gap-6 max-w-md mx-auto">
            {[
              { val: '99.7%', label: 'Accuracy' },
              { val: '<200ms', label: 'Speed' },
              { val: '24/7', label: 'Monitoring' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-bold text-white">{s.val}</div>
                <div className="text-xs text-blue-300 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-blue-600 to-purple-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-7 h-7">
                <path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
                <path d="M5 10a7 7 0 0 0 14 0" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">FaceTrace</h1>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
              <p className="text-slate-500 mt-1 text-sm">Sign in to your dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-red-500 shrink-0">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@facetrace.io"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none transition-all"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 text-center">
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
              &larr; Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
