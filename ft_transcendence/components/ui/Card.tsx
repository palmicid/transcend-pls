import { colors } from "@/design-system/colors";

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className={`rounded-2xl border p-6 ${colors.surface} ${colors.border}`}>
      {children}
    </div>
  );
}
