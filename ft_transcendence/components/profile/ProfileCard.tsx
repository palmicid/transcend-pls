"use client";

import { useState } from "react";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileInfoGrid } from "@/components/profile/ProfileInfoGrid";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import type { ProfileUser } from "@/types/profile";

export function ProfileCard({ user }: { user: ProfileUser }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);

  return (
    <>
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl">
        <div className="relative p-6 sm:p-8 space-y-8">
          <ProfileHeader
            user={currentUser}
            onEdit={() => setModalOpen(true)}
          />

          <ProfileInfoGrid user={currentUser} />
        </div>
      </section>

      <EditProfileModal
        user={currentUser}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(updated) => setCurrentUser(updated)}
      />
    </>
  );
}
