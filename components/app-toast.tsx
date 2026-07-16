"use client";

import { useEffect } from "react";

type ToastType = "success" | "error" | "info";

type AppToastProps = {
  message: string;
  type?: ToastType;
  onClose: () => void;
  durationMs?: number;
};

export function AppToast({
  message,
  type = "info",
  onClose,
  durationMs = 2600,
}: AppToastProps) {
  useEffect(() => {
    if (!message) {
      return;
    }

    const timer = window.setTimeout(() => {
      onClose();
    }, durationMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [durationMs, message, onClose]);

  if (!message) {
    return null;
  }

  return (
    <div className={`app-toast app-toast-${type}`} role="status" aria-live="polite">
      <span>{message}</span>
      <button type="button" className="app-toast-close" onClick={onClose} aria-label="Mesaji kapat">
        Kapat
      </button>
    </div>
  );
}
