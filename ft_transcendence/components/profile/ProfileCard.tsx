"use client";

import { useState } from "react";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileInfoGrid } from "@/components/profile/ProfileInfoGrid";

export function ProfileCard({ user }: { user: Record<string, unknown> }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, unknown>>(user);

  function onCancel() {
    setDraft(user);
    setEditing(false);
  }

  function onSave() {
    console.log("SAVE PROFILE (mock)", draft);
    setEditing(false);
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl">
      {/* glow */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative p-6 sm:p-8 space-y-8">
        {/* HERO SECTION */}
        <ProfileHeader
          user={draft}
          editing={editing}
          onEdit={() => setEditing(true)}
          onCancel={onCancel}
          onSave={onSave}
          onChange={(k, v) =>
            setDraft((prev) => ({ ...prev, [k]: v }))
          }
        />

        {/* INFO GRID */}
        <ProfileInfoGrid user={draft} />
      </div>
    </section>
  );
}
