"use client";

import { UserLite } from "@/types/friends";
import { StatusPill } from "@/components/friends/StatusPill";
import { colors } from "@/design-system/colors";
import { typography } from "@/design-system/typography";

type Props = {
  user: UserLite;
  action: React.ReactNode;
};

export default function UserRow({ user, action }: Props) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border ${colors.border} ${colors.surface}`}>
      <div>

        <div className={`${typography.body} ${colors.textPrimary} font-medium`}>
          {user.displayName}
        </div>

        <div className={`${typography.caption} ${colors.textSecondary} my-1`}>
          {user.email}
        </div>
        
        <StatusPill online={user.online} />

      </div>
      {action}
    </div>
  );
}
