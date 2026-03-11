"use client";

import { AlertType, alertStyles } from "@/design-system/alertStyles";

type Props = {
  type?: AlertType;
  message: string;
};

export function ToastAlert({ type = "info", message }: Props) {
  return (
    <div className={`fixed top-6 right-6 px-4 py-2 rounded-xl border text-sm shadow-lg ${alertStyles[type]}`}>
      {message}
    </div>
  );
}
