"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginErrorModal } from "@/components/auth/LoginErrorModal";

export function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();

  const oauthError = sp.get("error");
  const oauthErrorMsg = useMemo(() => {
    if (!oauthError) return "";
    if (oauthError === "unknown_provider") return "Unknown OAuth provider.";
    if (oauthError === "user_not_seeded") return "Seed user for this provider not found.";
    return "OAuth failed.";
  }, [oauthError]);

  const [email, setEmail] = useState("mobile@example.com");
  const [password, setPassword] = useState("mobile123");
  const [submitting, setSubmitting] = useState(false);

  const [modalOpen, setModalOpen] = useState(!!oauthError);
  const [modalMsg, setModalMsg] = useState(oauthErrorMsg);

  async function onLogin() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setModalMsg(data?.message ?? "Please try again.");
        setModalOpen(true);
        return;
      }

      router.push("/main");
    } catch {
      setModalMsg("Network error. Please try again.");
      setModalOpen(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="space-y-3">
        <input
          className="w-full rounded-2xl bg-black/20 border border-white/10 px-4 py-3 outline-none focus:border-white/20 focus:bg-black/30 transition"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <input
          className="w-full rounded-2xl bg-black/20 border border-white/10 px-4 py-3 outline-none focus:border-white/20 focus:bg-black/30 transition"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        <button
          disabled={submitting}
          onClick={onLogin}
          className="w-full rounded-2xl bg-white text-zinc-950 font-semibold py-3 disabled:opacity-60 hover:opacity-90 transition"
        >
          {submitting ? "Logging in..." : "Login"}
        </button>
      </div>

      <LoginErrorModal
        open={modalOpen}
        message={modalMsg}
        onClose={() => {
          setModalOpen(false);
          if (oauthError) router.replace("/login");
        }}
      />
    </>
  );
}
