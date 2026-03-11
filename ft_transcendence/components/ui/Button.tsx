"use client";

import clsx from "clsx";
import { colors } from "@/design-system/colors";
import { typography } from "@/design-system/typography";

type Props = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "danger" | "ghost";
};

export default function Button({
  children,
  onClick,
  variant = "primary",
}: Props) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "px-4 py-2 rounded-lg transition",
        typography.body,
        variant === "primary" && `${colors.primary} ${colors.primaryHover} text-white`,
        variant === "secondary" && `${colors.secondary} ${colors.secondaryHover} text-white`,
        variant === "danger" && `${colors.error} ${colors.errorHover} text-white`,
        variant === "ghost" && `${colors.surface} ${colors.textPrimary} hover:bg-neutral-800`
      )}
    >
      {children}
    </button>
  );
}
