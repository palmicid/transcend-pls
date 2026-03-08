"use client";

import { colors } from "@/design-system/colors";
import { typography } from "@/design-system/typography";

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export default function SearchInput({ value, onChange }: Props) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search..."
      className={`w-full px-4 py-2 rounded-lg border outline-none ${colors.border} ${colors.surface} ${colors.textPrimary} ${typography.body}`}
    />
  );
}
