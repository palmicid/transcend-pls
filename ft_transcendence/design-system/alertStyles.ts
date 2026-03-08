export type AlertType = "success" | "error" | "warning" | "info";

export const alertStyles: Record<AlertType, string> = {
  success:"bg-emerald-500/40 border-emerald-400/30 text-emerald-200",
  error:"bg-red-500/40 border-red-400/30 text-red-200",
  warning:"bg-amber-500/40 border-amber-400/30 text-amber-200",
  info:"bg-sky-500/40 border-sky-400/30 text-sky-200",
};
