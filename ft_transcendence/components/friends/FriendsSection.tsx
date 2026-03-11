"use client";

import React from "react";
import { Users } from "lucide-react";
import Icon from "@/components/ui/Icon";
import { Card } from "@/components/ui/Card";
import { colors } from "@/design-system/colors";
import { typography } from "@/design-system/typography";

type Props = {
  title: string;
  children: React.ReactNode;
};

export default function FriendsSection({ title, children }: Props) {
  return (
    <Card>
      
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon icon={Users} />
          <h2 className={`${typography.h2} ${colors.textPrimary} capitalize`}>
            {title}
          </h2>
        </div>
      </div>

      <div className="space-y-3">
        {children}
      </div>

    </Card>
  );
}
