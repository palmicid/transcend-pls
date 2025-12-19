"use client";

import { useState } from "react";
import { loginUser } from "../actions";

export default function LoginPage() {
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await loginUser(userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#1e1e2e" }}>
      <div className="w-full max-w-md p-8 rounded-lg shadow-lg" style={{ backgroundColor: "#313244" }}>
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#cdd6f4" }}>
            Game Lobby
          </h1>
          <p className="text-sm" style={{ color: "#a6adc8" }}>
            Enter your username to get started
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="mb-4 p-3 rounded text-sm"
            style={{
              backgroundColor: "#f38ba8",
              color: "#1e1e2e",
            }}
          >
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="userId"
              className="block text-sm font-medium mb-2"
              style={{ color: "#cdd6f4" }}
            >
              Username
            </label>
            <input
              id="userId"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter your username"
              disabled={loading}
              className="w-full px-4 py-2 rounded border transition-colors focus:outline-none focus:ring-2"
              style={{
                backgroundColor: "#45475a",
                borderColor: "#585b70",
                color: "#cdd6f4",
                "--tw-ring-color": "#89b4fa",
              } as React.CSSProperties}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !userId.trim()}
            className="w-full px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: loading || !userId.trim() ? "#6c7086" : "#89b4fa",
              color: "#1e1e2e",
            }}
            onMouseEnter={(e) => {
              if (!loading && userId.trim()) {
                e.currentTarget.style.backgroundColor = "#7aa2f7";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && userId.trim()) {
                e.currentTarget.style.backgroundColor = "#89b4fa";
              }
            }}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-xs" style={{ color: "#a6adc8" }}>
          <p>This is a mock authentication.</p>
          <p>Enter any username to proceed.</p>
        </div>
      </div>
    </div>
  );
}
