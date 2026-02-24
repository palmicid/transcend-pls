import { Pencil } from "lucide-react";
import type { ProfileUser } from "./ProfileCard";

interface Props {
  user: ProfileUser;
  onEdit: () => void;
}

export function ProfileHeader({ user, onEdit }: Props) {
  const online = user.online;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
      {/* Avatar */}
      <div className="relative">
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
      </div>

      {/* Name */}
      <div className="flex-1 space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold">
          {user.displayName || "Unnamed User"}
        </h1>

        <div className="text-sm text-white/50">
          {online ? "Online now" : "Offline"}
        </div>
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
