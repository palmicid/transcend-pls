import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            ft_transcendence
          </h1>
          <p className="text-slate-400 text-lg">
            Game lobby and AI assistant platform
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Game Lobby Card */}
          <Link
            href="/lobby"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 p-6 transition-all duration-300 hover:scale-[1.02] hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/20"
          >
            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="text-4xl mb-4">🎮</div>
              <h2 className="text-2xl font-bold text-white mb-2">Game Lobby</h2>
              <p className="text-slate-400">
                Play Tic-Tac-Toe and other games with friends in real-time
              </p>
            </div>
          </Link>

          {/* AI Chat Card */}
          <Link
            href="/llm"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 p-6 transition-all duration-300 hover:scale-[1.02] hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/20"
          >
            <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="text-4xl mb-4">🤖</div>
              <h2 className="text-2xl font-bold text-white mb-2">AI Assistant</h2>
              <p className="text-slate-400">
                Chat with an AI assistant powered by Ollama LLM
              </p>
            </div>
          </Link>
        </div>

        {/* Login Link */}
        <div className="mt-8 text-center">
          <Link
            href="/auth/login"
            className="text-slate-400 hover:text-white transition-colors"
          >
            Sign in to your account →
          </Link>
        </div>
      </div>
    </main>
  );
}
