"use client";

import { useMemo, useState } from "react";

type PolicyKind = "terms" | "privacy";

function PolicyModal({
  open,
  kind,
  onClose,
}: {
  open: boolean;
  kind: PolicyKind;
  onClose: () => void;
}) {
  const title = kind === "terms" ? "Terms & Conditions" : "Privacy Policy";

  const content = useMemo(() => {
    if (kind === "terms") {
      return [
        { h: "1) Acceptance of Terms", p: "By using 42 TranscenDEAD ☠️ (the “Service”), you agree to these Terms & Conditions. If you don’t agree, please stop using the Service." },
        { h: "2) What this Service is", p: "This project provides a simple platform for users to log in, view a profile, chat, manage friends, and play mini games (e.g., Tic-Tac-Toe, Rock-Paper-Scissors). Some features may be mock/demo features for development and testing." },
        { h: "3) Accounts & Access", p: "You are responsible for keeping your account credentials safe. If you believe your account is compromised, stop using the Service and contact the maintainer/admin." },
        { h: "4) Acceptable Use", p: "Do not abuse the Service. This includes: spamming, harassment, hate speech, cheating/exploiting bugs, reverse engineering in harmful ways, or attempting unauthorized access to other users’ data." },
        { h: "5) Content in Chat", p: "You are responsible for any messages you send. Please be respectful. The Service may remove content or restrict access if it violates these Terms." },
        { h: "6) Game & Feature Availability", p: "The Service is provided “as is” and may change at any time. Features can be added, removed, or temporarily unavailable without notice." },
        { h: "7) Data Accuracy & Demo Mode", p: "Some data may be seeded/mock data for testing. Do not rely on the Service for real-world decisions or permanent storage unless explicitly stated." },
        { h: "8) Limitation of Liability", p: "To the maximum extent permitted by law, the Service is not liable for any indirect or consequential damages, including loss of data, lost profits, or service interruption." },
        { h: "9) Termination", p: "Access may be suspended or terminated if you violate these Terms or if the Service is shut down." },
        { h: "10) Changes to Terms", p: "These Terms may be updated. Continued use after updates means you accept the revised Terms." },
        { h: "Contact", p: "For questions about these Terms, please contact the project maintainer/admin." },
      ] as const;
    }

    return [
      { h: "1) What we collect", p: "We may collect basic account information (e.g., email/username, display name) and usage data needed to run features like chat, friends, and games. In demo mode, seeded accounts may also exist." },
      { h: "2) Chat & Activity Data", p: "Messages you send and actions you take (like creating/joining rooms or game results) may be stored to make the Service work properly." },
      { h: "3) Cookies / Sessions", p: "We may use cookies or session tokens for authentication and to keep you logged in. These are used for core functionality, not for advertising." },
      { h: "4) How we use data", p: "We use data to: authenticate users, show your profile, enable chat/friends/games, debug issues, and improve reliability and security." },
      { h: "5) Sharing", p: "We do not sell your personal information. Data may be shared only if required to operate the Service (e.g., hosting/database) or if legally required." },
      { h: "6) Data retention", p: "We keep data as long as needed for the Service. In development/testing environments, data may be reset (e.g., reseeding database)." },
      { h: "7) Security", p: "We apply reasonable security practices, but no system is 100% secure. Please avoid sharing sensitive personal data in chat." },
      { h: "8) Your choices", p: "You can choose not to use the Service. If account deletion is supported, you can request it from the maintainer/admin (depending on the environment)." },
      { h: "9) Changes to this policy", p: "We may update this Privacy Policy from time to time. Continued use means you accept the updated policy." },
      { h: "Contact", p: "For privacy questions, please contact the project maintainer/admin." },
    ] as const;
  }, [kind]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="w-full max-w-2xl rounded-3xl border border-white/10 bg-zinc-950/70 backdrop-blur-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
          <div>
            <div className="text-lg font-semibold">{title}</div>
            <div className="text-xs text-white/60 mt-0.5">
              Last updated: {new Date().toLocaleDateString()}
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition"
          >
            Close
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          <div className="space-y-5">
            {content.map((sec) => (
              <section key={sec.h} className="space-y-2">
                <h3 className="font-semibold">{sec.h}</h3>
                <p className="text-sm text-white/70 leading-relaxed">{sec.p}</p>
              </section>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 px-6 py-4 flex items-center justify-end">
          <button
            onClick={onClose}
            className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-zinc-950 hover:opacity-90 transition"
          >
            OK, got it
          </button>
        </div>
      </div>
    </div>
  );
}

export function MainFooter() {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<PolicyKind>("terms");

  return (
    <footer className="border-t border-white/10">
      {/* ↓ ลด py-8 -> py-4 และใช้ flex-row ตลอด ลดความสูง */}
      <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-white/60">
            © {new Date().getFullYear()} 42 TranscenDEAD ☠️
          </p>

          <div className="flex items-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => {
                setKind("terms");
                setOpen(true);
              }}
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white transition"
            >
              Terms
            </button>

            <button
              type="button"
              onClick={() => {
                setKind("privacy");
                setOpen(true);
              }}
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white transition"
            >
              Privacy
            </button>
          </div>
        </div>
      </div>

      <PolicyModal open={open} kind={kind} onClose={() => setOpen(false)} />
    </footer>
  );
}
