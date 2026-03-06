"use client";

import { Camera, Pencil } from "lucide-react";
import { useRef, useState } from "react";
import type { ProfileUser } from "@/types/profile";

interface Props {
  user: ProfileUser;
  onEdit: () => void;
  onAvatarChange: (newAvatarUrl: string) => void;
}

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB
const   ALLOWED_TYPES = ["image/jpeg", "image/png"];

export function ProfileHeader({ user, onEdit, onAvatarChange }: Props) {
  const online = user.online;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset state
    setError(null);

    // Client-side validation: type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only JPG and PNG files are accepted.");
      return;
    }

    // Client-side validation: size
    if (file.size > MAX_FILE_SIZE) {
      setError("File size must not exceed 1 MB");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/user/${user.id}/avatar`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Upload failed");
        return;
      }

      const data = await res.json();
      onAvatarChange(data.avatar_url);
    } catch {
      setError("Something went wrong during upload.");
    } finally {
      setUploading(false);
      // Reset input so the same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
      {/* Avatar with edit overlay */}
      <div className="relative group">
        <img
          src={user.avatarUrl || "/avatar-placeholder.png"}
          alt="Avatar"
          className="h-24 w-24 rounded-full object-cover border-2 border-white"
        />

        <span
          className={[
            "absolute bottom-1 right-1 h-4 w-4 rounded-full ring-2 ring-zinc-950",
            online ? "bg-emerald-400" : "bg-zinc-400",
          ].join(" ")}
        />

        {/* Camera overlay button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          title="Chage profile picture"
          >
          {uploading ? (
            <span className="h-6 w-6 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Camera className="h-6 w-6 text-white/80" />
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Name + erorr*/}
      <div className="flex-1 space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold">
          {user.displayName || "Unnamed User"}
        </h1>

        <div className="text-sm text-white/50">
          {online ? "Online now" : "Offline"}
        </div>

        {error && (
          <div className="text-sm text-red-400 mt-1">{error}</div>
        )}
      </div>

      {/* Edit Button */}
      <button
        onClick={onEdit}
        className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition"
      >
        <Pencil className="h-4 w-4" />
        Edit Profile
      </button>
    </div>
  );
}
