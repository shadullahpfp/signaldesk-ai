import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px]" />
      </div>

      {/* Navigation Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center space-x-2">
          <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500">
            SignalDesk AI
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href="/login"
            className="text-sm font-medium text-gray-300 hover:text-white transition-colors px-4 py-2"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/25"
          >
            Sign Up
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-20 flex-grow flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6">
          <span>Enterprise Triage Redefined</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-tight max-w-4xl">
          Automate Customer Operations with{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500">
            AI Triage
          </span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-gray-400 max-w-2xl leading-relaxed">
          SignalDesk AI autonomously classifies urgency, summarizes threads, and generates drafts to empower customer service agents instantly.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <Link
            href="/register"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-8 py-4 rounded-xl shadow-lg shadow-indigo-600/30 transition-all duration-200"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200"
          >
            Agent Portal
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 w-full">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left hover:border-indigo-500/30 transition-colors">
            <h3 className="text-lg font-bold text-white mb-2">Autonomous Classification</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              LLM triage automatically categorizes support requests by critical urgency tiers within seconds of submission.
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left hover:border-indigo-500/30 transition-colors">
            <h3 className="text-lg font-bold text-white mb-2">Contextual Summarization</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Understands complex issues instantly, compiling a brief summary so agents never have to read through endless essays.
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left hover:border-indigo-500/30 transition-colors">
            <h3 className="text-lg font-bold text-white mb-2">Transactional Audit Trail</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Every status update, assignee shift, and AI generation registers a secure event in a robust audit trail.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-xs text-gray-500 border-t border-white/5 max-w-7xl mx-auto w-full">
        <p>&copy; {new Date().getFullYear()} SignalDesk AI. All rights reserved.</p>
      </footer>
    </div>
  )
}
