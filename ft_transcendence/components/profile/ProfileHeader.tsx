import { Pencil, Save, X } from "lucide-react";

export function ProfileHeader({
  user,
  editing,
  onEdit,
  onCancel,
  onSave,
  onChange,
}: {
  user: Record<string, unknown>;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onChange: (k: string, v: unknown) => void;
}) {
  const online = Boolean(user.online);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
      {/* Avatar */}
      <div className="relative">
        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-indigo-400/60 to-cyan-300/40 ring-2 ring-white/10" />
        <span
          className={[
            "absolute bottom-1 right-1 h-4 w-4 rounded-full ring-2 ring-zinc-950",
            online ? "bg-emerald-400" : "bg-zinc-400",
          ].join(" ")}
        />
      </div>

      {/* Name & actions */}
      <div className="flex-1 space-y-1">
        {editing ? (
          <input
            value={String(user.displayName ?? "")}
            onChange={(e) => onChange("displayName", e.target.value)}
            placeholder="Display name"
            className="text-2xl font-semibold bg-transparent border-b border-white/20 outline-none focus:border-white/50"
          />
        ) : (
          <h1 className="text-2xl sm:text-3xl font-bold">
            {user.displayName || "Unnamed User"}
          </h1>
        )}

        <div className="text-white/60">
          @{user.username || "username"}
        </div>

        <div className="text-sm text-white/50">
          {online ? "Online now" : "Offline"}
        </div>
      </div>

      {/* Actions */}
      {!editing ? (
        <button
          onClick={onEdit}
          className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
        >
          <Pencil className="h-4 w-4" />
          Edit Profile
        </button>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={onSave}
            className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950"
          >
            <Save className="h-4 w-4" />
            Save
          </button>
          <button
            onClick={onCancel}
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
