"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileInfoGrid } from "@/components/profile/ProfileInfoGrid";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import type { ProfileUser } from "@/types/profile";

export function ProfileCard({ user }: { user: ProfileUser }) {

  const [modalOpen, setModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);

  return (
    <>
      <Card>
        <div className="space-y-8">
          <ProfileHeader
            user={currentUser}
            onEdit={() => setModalOpen(true)}
            onAvatarChange={(newUrl) =>
              setCurrentUser((prev) => ({ ...prev, avatarUrl: newUrl }))
            }
          />
          <ProfileInfoGrid user={currentUser} />
        </div>
      </Card>

      <EditProfileModal
        user={currentUser}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(updated) => setCurrentUser(updated)}
      />
    </>
  );
}
