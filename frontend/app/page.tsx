import Link from 'next/link'

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function BrainIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <circle cx="9" cy="6" r="0.5" fill="currentColor" />
      <circle cx="15" cy="6" r="0.5" fill="currentColor" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path d="M23 7l-7 5 7 5V7z" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  )
}

function ArrowRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

const features = [
  {
    icon: <BrainIcon />,
    title: 'AI Face Recognition',
    desc: 'InsightFace-powered detection with real-time matching against enrolled persons. 99.7% accuracy with liveness detection.',
    color: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-50',
  },
  {
    icon: <CameraIcon />,
    title: 'Multi-Camera Feeds',
    desc: 'Connect unlimited RTSP/HTTP cameras. Monitor all entry points simultaneously with live annotated streams.',
    color: 'from-purple-500 to-pink-600',
    bg: 'bg-purple-50',
  },
  {
    icon: <ChartIcon />,
    title: 'Deep Analytics',
    desc: 'Footfall trends, heatmaps, dwell-time analysis, attendance tracking, and anomaly detection with z-score alerts.',
    color: 'from-cyan-500 to-teal-600',
    bg: 'bg-cyan-50',
  },
  {
    icon: <BellIcon />,
    title: 'Smart Alerts',
    desc: 'Instant notifications for unknown faces, unusual entry times, low attendance, and camera health issues.',
    color: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-50',
  },
  {
    icon: <ShieldIcon />,
    title: 'Privacy First',
    desc: 'GDPR-ready with consent management, data retention policies, configurable anonymization, and full audit trails.',
    color: 'from-emerald-500 to-green-600',
    bg: 'bg-emerald-50',
  },
  {
    icon: <ClockIcon />,
    title: 'Session Tracking',
    desc: 'Automatic entry/exit pairing, dwell-time calculation, and person movement timeline across camera zones.',
    color: 'from-rose-500 to-red-600',
    bg: 'bg-rose-50',
  },
]

const stats = [
  { value: '<200ms', label: 'Detection Speed' },
  { value: '99.7%', label: 'Recognition Accuracy' },
  { value: '24/7', label: 'Real-time Monitoring' },
  { value: '512-D', label: 'Embedding Vectors' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ─── Navbar ─── */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-white/80 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5">
                <path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
                <path d="M5 10a7 7 0 0 0 14 0" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">FaceTrace</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#stats" className="hover:text-slate-900 transition-colors">Performance</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How It Works</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link href="/login" className="text-sm font-semibold text-white px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 transition-all">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Powered by InsightFace AI
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 mb-6 leading-[1.1]">
            Intelligent Face
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent">
              Recognition System
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Real-time face detection, recognition, and analytics for security and monitoring.
            Track entries, monitor cameras, and gain deep insights — all from one dashboard.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="group inline-flex items-center px-8 py-4 rounded-2xl text-white font-semibold text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5 transition-all"
            >
              Open Dashboard
              <ArrowRight />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center px-8 py-4 rounded-2xl text-slate-700 font-semibold text-base bg-slate-100 hover:bg-slate-200 transition-all"
            >
              Explore Features
            </a>
          </div>

          {/* Hero visual */}
          <div className="mt-16 relative max-w-5xl mx-auto">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 rounded-3xl blur-2xl" />
            <div className="relative rounded-2xl border border-slate-200 bg-slate-900 shadow-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 border-b border-slate-700">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-3 text-xs text-slate-400 font-mono">facetrace.local/dashboard</span>
              </div>
              <div className="p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {['142 Entries', '98 People', '12 Unknown', '3 Alerts'].map((text, i) => (
                    <div key={i} className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/50">
                      <div className="text-2xl font-bold text-white mb-1">{text.split(' ')[0]}</div>
                      <div className="text-xs text-slate-400">{text.split(' ')[1]}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                  <div className="flex items-end justify-between h-32">
                    {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                      <div key={i} className="flex flex-col items-center gap-2 flex-1">
                        <div
                          className="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-blue-600 to-purple-500"
                          style={{ height: `${h}%` }}
                        />
                        <span className="text-[10px] text-slate-500">
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section id="stats" className="py-16 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-black text-white mb-2">{stat.value}</div>
                <div className="text-sm text-blue-300 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-blue-600 tracking-wide uppercase">Features</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3 tracking-tight">
              Everything you need for
              <br />
              <span className="text-blue-600">FaceTrace</span>
            </h2>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
              From real-time face detection to deep analytics, FaceTrace provides a complete solution for monitoring and securing your campus.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="group bg-white rounded-2xl p-7 border border-slate-100 hover:border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-5`}>
                  <div className={`bg-gradient-to-br ${f.color} bg-clip-text text-transparent`}>
                    {f.icon}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-purple-600 tracking-wide uppercase">How It Works</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3 tracking-tight">
              Three steps to secure your campus
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                step: '01',
                title: 'Enroll Persons',
                desc: 'Upload face photos for students, staff, and visitors. AI generates 512-dimensional embeddings for each face.',
                gradient: 'from-blue-600 to-blue-400',
              },
              {
                step: '02',
                title: 'Connect Cameras',
                desc: 'Add RTSP or HTTP camera streams for each entry point. Cameras detect and recognize faces in real time.',
                gradient: 'from-purple-600 to-purple-400',
              },
              {
                step: '03',
                title: 'Monitor & Analyze',
                desc: 'View live feeds, track events, generate reports, and receive alerts — all from a unified dashboard.',
                gradient: 'from-cyan-600 to-cyan-400',
              },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className={`inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br ${item.gradient} items-center justify-center mb-6 shadow-lg`}>
                  <span className="text-white font-black text-xl">{item.step}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-purple-950 p-12 sm:p-16 text-center">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">
                Ready to secure your campus?
              </h2>
              <p className="text-blue-200 max-w-xl mx-auto mb-8">
                Start monitoring in minutes. Deploy cameras, enroll faces, and let AI handle the rest.
              </p>
              <Link
                href="/login"
                className="group inline-flex items-center px-8 py-4 rounded-2xl text-base font-semibold text-slate-900 bg-white hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                Get Started Now
                <ArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-slate-100 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
                <path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
                <path d="M5 10a7 7 0 0 0 14 0" />
              </svg>
            </div>
            <span className="text-sm font-bold text-slate-900">FaceTrace</span>
          </div>
          <p className="text-sm text-slate-500">Built with Next.js, FastAPI &amp; InsightFace</p>
        </div>
      </footer>
    </div>
  )
}
