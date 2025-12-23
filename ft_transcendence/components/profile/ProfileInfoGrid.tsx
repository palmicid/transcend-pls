function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs text-white/55">{label}</div>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}

export function ProfileInfoGrid({ user }: { user: Record<string, unknown> }) {
  return (
    <section>
      <div className="mb-3 text-sm font-semibold text-white/80">
        Profile Info
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoItem label="Username" value={String(user.username ?? "-")} />
        <InfoItem label="Email" value={String(user.email ?? "-")} />
        <InfoItem
          label="Account Status"
          value={user.online ? "Online" : "Offline"}
        />
        <InfoItem
          label="Joined"
          value={
            user.createdAt
              ? new Date(String(user.createdAt)).toLocaleDateString()
              : "-"
          }
        />
      </div>
    </section>
  );
}
