"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoginErrorModal } from "@/components/auth/LoginErrorModal";

export function RegisterForm() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMsg, setModalMsg] = useState("");

    async function onRegister() {
        if (!email || !username || !password) {
            setModalMsg("Please fill in all fields.");
            setModalOpen(true);
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ email, username, password }),
            });

            const data = await res.json().catch(() => null);
            if (!res.ok || !data?.ok) {
                setModalMsg(data?.message ?? "Registration failed. Please try again.");
                setModalOpen(true);
                return;
            }

            // Automatically redirect to login or main.
            // Since register sets the cookie (in my implementation above), we might skip to main?
            // Wait, let's check `register/route.ts` again.
            // Yes, I did `await setUserId(...)`. So we can go to main.
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
                    className="w-full rounded-2xl bg-black/20 border border-white/10 px-4 py-3 outline-none focus:border-white/20 focus:bg-black/30 transition text-white"
                    placeholder="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    className="w-full rounded-2xl bg-black/20 border border-white/10 px-4 py-3 outline-none focus:border-white/20 focus:bg-black/30 transition text-white"
                    placeholder="Username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    className="w-full rounded-2xl bg-black/20 border border-white/10 px-4 py-3 outline-none focus:border-white/20 focus:bg-black/30 transition text-white"
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button
                    disabled={submitting}
                    onClick={onRegister}
                    className="w-full rounded-2xl bg-white text-zinc-950 font-semibold py-3 disabled:opacity-60 hover:opacity-90 transition mt-2"
                >
                    {submitting ? "Creating Account..." : "Register"}
                </button>
            </div>

            <LoginErrorModal
                open={modalOpen}
                message={modalMsg}
                onClose={() => setModalOpen(false)}
            />
        </>
    );
}
