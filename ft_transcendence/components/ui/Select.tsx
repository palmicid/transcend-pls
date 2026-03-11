"use client";

import { colors } from "@/design-system/colors";
import { typography } from "@/design-system/typography";

type Option = {
  label: string;
  value: string;
};

type Props = {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
};

export default function Select({
  value,
  onChange,
  options,
}: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`px-3 py-2 rounded-lg border outline-none ${colors.border} ${colors.surface} ${colors.textPrimary} ${typography.body}`}
	>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
