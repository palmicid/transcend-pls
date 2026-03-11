"use client";

import {
  CheckCircle,
  AlertTriangle,
  Info,
} from "lucide-react";

import { AlertType, alertStyles } from "@/design-system/alertStyles";
import { typography } from "@/design-system/typography";
import Icon from "@/components/ui/Icon";

type Props = {
  open: boolean;
  type?: AlertType;
  title?: string;
  message: string;
  onClose: () => void;
};

const alertIcons: Record<AlertType, any> = {
  success: CheckCircle,
  error: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
};

export function AlertModal({
  open,
  type = "error",
  title,
  message,
  onClose,
}: Props) {
  if (!open) return null;

  const IconComponent = alertIcons[type];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">

      <div
        className={`
          w-full max-w-md
          rounded-2xl
          border
          p-6
          shadow-xl
          backdrop-blur-xl
          ${alertStyles[type]}
        `}
      >

        <div className="flex items-start gap-3">

          {/* Icon */}
          <div className="mt-1">
            <Icon icon={IconComponent} size={26} />
          </div>

          <div className="flex-1">

            {title && (
              <h3 className={typography.h2}>
                {title}
              </h3>
            )}

            <p className={`${typography.body} mt-1`}>
              {message}
            </p>

          </div>

        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-white py-2 text-black font-medium hover:opacity-90 transition"
        >
          OK
        </button>

      </div>
    </div>
  );
}
