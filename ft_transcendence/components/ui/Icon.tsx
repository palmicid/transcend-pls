"use client";

import { LucideProps } from "lucide-react";

type Props = {
  icon: React.ComponentType<LucideProps>;
  size?: number;
};

export default function Icon({ icon: Icon, size = 18 }: Props) {
  return <Icon size={size} className="text-neutral-100" />;
}
