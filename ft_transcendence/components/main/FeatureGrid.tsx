import {
  MessageSquareHeart,
  Gamepad2,
} from "lucide-react";
import { FeatureCard } from "@/components/main/FeatureCard";

function IconWrap({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <div
      className={`
        h-12 w-12 rounded-2xl
        grid place-items-center
        border border-white/10
        bg-white/5
        transition-all duration-200
        group-hover:scale-110
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function FeatureGrid() {
  return (
    <section className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
      {/* Chat */}
      <FeatureCard
        title="42 AI–Chat"
        desc="Ask, brainstorm, and get help instantly — like a mini AI companion."
        href="/chat"
        badge="Chat"
		color="fuchsia"
        icon={
          <IconWrap className="group-hover:bg-fuchsia-500/20 group-hover:border-fuchsia-400/40 group-hover:shadow-[0_0_30px_rgba(217,70,239,0.45)]">
            <MessageSquareHeart className="h-6 w-6 text-fuchsia-300 group-hover:text-fuchsia-200 transition" />
          </IconWrap>
        }
      />

      {/* Games */}
      <FeatureCard
        title="Games"
        desc="Play Tic-Tac-Toe and more — with friends or against bots."
        href="/play"
        badge="Play"
		color="cyan"
        icon={
          <IconWrap className="group-hover:bg-cyan-500/20 group-hover:border-cyan-400/40 group-hover:shadow-[0_0_30px_rgba(34,211,238,0.45)]">
            <Gamepad2 className="h-6 w-6 text-cyan-300 group-hover:text-cyan-200 transition" />
          </IconWrap>
        }
      />
    </section>
  );
}
