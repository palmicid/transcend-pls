import Link from "next/link";
import { MainLayout } from "@/components/layout/MainLayout";

export default function WelcomePage() {
  return (
    <MainLayout showNav={false}>
      {/* 🔥 center content */}
      <div className="flex h-full items-center justify-center pt-24">
        <section className="w-full max-w-xl">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-7 sm:p-9 backdrop-blur-xl">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
                Ready to play
              </div>

              <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">
                ft_transcendence
              </h1>

              <p className="mt-3 text-white/70 leading-relaxed">
                Login to view your profile, chat with friends, and play games in one place.
              </p>

              <div className="mt-8">
                <Link
                  href="/login"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-3 font-semibold text-zinc-950 hover:opacity-90 transition"
                >
                  Go to Login →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}

// import Link from "next/link";

// export default function Home() {
//   return (
//     <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
//       <div className="max-w-2xl w-full">
//         <div className="text-center mb-12">
//           <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
//             ft_transcendence
//           </h1>
//           <p className="text-slate-400 text-lg">
//             Game lobby and AI assistant platform
//           </p>
//         </div>

//         <div className="grid gap-6 md:grid-cols-2">
//           {/* Game Lobby Card */}
//           <Link
//             href="/lobby"
//             className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 p-6 transition-all duration-300 hover:scale-[1.02] hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/20"
//           >
//             <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
//             <div className="relative z-10">
//               <div className="text-4xl mb-4">🎮</div>
//               <h2 className="text-2xl font-bold text-white mb-2">Game Lobby</h2>
//               <p className="text-slate-400">
//                 Play Tic-Tac-Toe and other games with friends in real-time
//               </p>
//             </div>
//           </Link>

//           {/* AI Chat Card */}
//           <Link
//             href="/llm"
//             className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 p-6 transition-all duration-300 hover:scale-[1.02] hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/20"
//           >
//             <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
//             <div className="relative z-10">
//               <div className="text-4xl mb-4">🤖</div>
//               <h2 className="text-2xl font-bold text-white mb-2">AI Assistant</h2>
//               <p className="text-slate-400">
//                 Chat with an AI assistant powered by Ollama LLM
//               </p>
//             </div>
//           </Link>
//         </div>

//         {/* Login Link */}
//         <div className="mt-8 text-center">
//           <Link
//             href="/auth/login"
//             className="text-slate-400 hover:text-white transition-colors"
//           >
//             Sign in to your account →
//           </Link>
//         </div>
//       </div>
//     </main>
//   );
// }
