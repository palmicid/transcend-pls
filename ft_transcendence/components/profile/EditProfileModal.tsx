"use client";

import { useEffect, useState, useMemo } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { ProfileUser } from "@/types/profile";

interface Props {
  user: ProfileUser;
  open: boolean;
  onClose: () => void;
  onSuccess: (updated: ProfileUser) => void;
}

export function EditProfileModal({
  user,
  open,
  onClose,
  onSuccess,
}: Props) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [changePassword, setChangePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  // reset form when modal opens
  useEffect(() => {
    if (open) {
      setDisplayName(user.displayName);
      setEmail(user.email);
      setPassword("");
      setConfirmPassword("");
      setChangePassword(false);
    }
  }, [open, user]);

  // Realtime password match check
  const passwordsMatch = useMemo(() => {
    if (!password || !confirmPassword) return true;
    return password === confirmPassword;
  }, [password, confirmPassword]);

  const isSaveDisabled =
  loading ||
  (changePassword &&
    (!password || !confirmPassword || !passwordsMatch));

  if (!open) return null;

  async function handleSave() {
    try {
      setLoading(true);

      const res = await fetch(`/api/user/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          email,
          ...(changePassword ? { password } : {}),
        }),
      });

      if (!res.ok) {
        alert("Update failed");
        return;
      }

      const updated = await res.json();

      onSuccess({
        ...user,
        displayName: updated.display_name,
        email: updated.email,
      });

      setSuccessOpen(true);
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="w-full max-w-md bg-zinc-900 rounded-2xl p-6 space-y-4 border border-white/10">

          <h2 className="text-xl font-semibold">Edit Profile</h2>

          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Display Name"
            className="w-full p-2 rounded bg-zinc-800"
          />

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-2 rounded bg-zinc-800"
          />

          <button
            onClick={() => setChangePassword(!changePassword)}
            className="text-emerald-400 text-sm"
          >
            {changePassword ? "Cancel password change" : "Change password"}
          </button>

          {changePassword && (
            <>
              {/* New Password */}
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New Password"
                  className="w-full p-2 rounded bg-zinc-800 pr-10"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowNewPassword(!showNewPassword)
                  }
                  className="absolute right-3 top-2.5 text-zinc-400"
                >
                  {showNewPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  placeholder="Confirm Password"
                  className={`w-full p-2 rounded bg-zinc-800 pr-10 ${
                    !passwordsMatch
                      ? "border border-red-500"
                      : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-3 top-2.5 text-zinc-400"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              {/* Error message */}
              {!passwordsMatch && (
                <p className="text-red-500 text-sm">
                  Passwords do not match
                </p>
              )}
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-zinc-700"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={isSaveDisabled}
              className={`px-4 py-2 rounded font-semibold ${
                isSaveDisabled
                  ? "bg-zinc-600 text-zinc-400 cursor-not-allowed"
                  : "bg-emerald-500 text-black"
              }`}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {successOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-white/10 space-y-4 text-center">
            <h3 className="text-lg font-semibold text-emerald-400">
              Profile Updated Successfully 🎉
            </h3>

            <div className="flex justify-center pt-2">
              <button
              onClick={() => {
                setSuccessOpen(false);
                onClose();
              }}
              className="px-6 py-2 bg-emerald-500 rounded text-black font-semibold hover:opacity-90 transition"
              >
              OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
