import { Github, Chrome } from "lucide-react";

function OAuthButton({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="flex items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.03] py-2.5 text-sm hover:bg-white/[0.07] transition"
    >
      {icon}
      {label}
    </a>
  );
}

export function OAuthButtons() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-white/60">Or login with</p>
      <div className="grid grid-cols-3 gap-2">
        <OAuthButton
          href="/api/auth/oauth/google"
          label="Google"
          icon={<Chrome className="h-4 w-4" />}
        />
        <OAuthButton
          href="/api/auth/oauth/github"
          label="GitHub"
          icon={<Github className="h-4 w-4" />}
        />
        <OAuthButton
          href="/api/auth/oauth/42"
          label="42"
          icon={<span className="font-bold">42</span>}
        />
      </div>
    </div>
  );
}
