"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { ProfileUser } from "@/types/profile";
import Icon from "@/components/ui/Icon";
import { Card } from "@/components/ui/Card";
import { AlertModal } from "@/components/ui/AlertModal";

interface Props {
  user: ProfileUser;
  open: boolean;
  onClose: () => void;
  onSuccess: (updated: ProfileUser) => void;
}

type AlertKind = "success" | "error";

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

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertType, setAlertType] = useState<AlertKind>("success");
  const [alertMsg, setAlertMsg] = useState("");

  useEffect(() => {
    if (!open) return;

    setDisplayName(user.displayName);
    setEmail(user.email);
    setPassword("");
    setConfirmPassword("");
    setChangePassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  }, [open, user]);

  const passwordsMatch = useMemo(() => {
    if (!password || !confirmPassword) return true;
    return password === confirmPassword;
  }, [password, confirmPassword]);

  const isSaveDisabled =
    loading ||
    (changePassword && (!password || !confirmPassword || !passwordsMatch));

  function showAlert(type: AlertKind, message: string) {
    setAlertType(type);
    setAlertMsg(message);
    setAlertOpen(true);
  }

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
        const data = await res.json().catch(() => null);
        showAlert("error", data?.error ?? "Update failed");
        return;
      }

      const updated = await res.json();

      const updatedUser: ProfileUser = {
        ...user,
        displayName: updated.display_name,
        email: updated.email,
      };

      onSuccess(updatedUser);
      showAlert("success", "Profile updated successfully 🎉");
    } catch (error) {
      console.error(error);
      showAlert("error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <Card>
            <div className="w-[360px] space-y-4">
              <h2 className="text-xl font-semibold">Edit Profile</h2>

              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display Name"
                className="w-full rounded bg-zinc-800 p-2"
              />

              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded bg-zinc-800 p-2"
              />

              <button
                type="button"
                onClick={() => setChangePassword((prev) => !prev)}
                className="text-sm text-emerald-400"
              >
                {changePassword
                  ? "Cancel password change"
                  : "Change password"}
              </button>

              {changePassword && (
                <>
                  <PasswordField
                    value={password}
                    onChange={setPassword}
                    placeholder="New Password"
                    show={showNewPassword}
                    toggle={() => setShowNewPassword((prev) => !prev)}
                  />

                  <PasswordField
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="Confirm Password"
                    show={showConfirmPassword}
                    toggle={() => setShowConfirmPassword((prev) => !prev)}
                    error={!passwordsMatch}
                  />

                  {!passwordsMatch && (
                    <p className="text-sm text-red-500">
                      Passwords do not match
                    </p>
                  )}
                </>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg bg-zinc-700 px-4 py-2 text-white transition hover:bg-zinc-600"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaveDisabled}
                  className={[
                    "rounded-lg px-4 py-2 font-semibold transition",
                    isSaveDisabled
                      ? "cursor-not-allowed bg-zinc-600 text-zinc-400"
                      : "bg-emerald-500 text-black hover:opacity-90",
                  ].join(" ")}
                >
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="relative z-[60]">
        <AlertModal
          open={alertOpen}
          type={alertType}
          title={alertType === "success" ? "Success" : "Error"}
          message={alertMsg}
          onClose={() => {
            setAlertOpen(false);

            if (alertType === "success") {
              onClose();
            }
          }}
        />
      </div>
    </>
  );
}

function PasswordField({
  value,
  onChange,
  placeholder,
  show,
  toggle,
  error = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  show: boolean;
  toggle: () => void;
  error?: boolean;
}) {
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={[
          "w-full rounded bg-zinc-800 p-2 pr-10",
          error ? "border border-red-500" : "",
        ].join(" ")}
      />

      <button
        type="button"
        onClick={toggle}
        className="absolute right-3 top-2.5 text-zinc-400"
      >
        <Icon icon={show ? EyeOff : Eye} size={18} />
      </button>
    </div>
  );
}
