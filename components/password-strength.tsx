"use client";

import { useMemo } from "react";

type PasswordStrengthProps = {
  password: string;
};

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const score = useMemo(() => {
    let value = 0;
    if (password.length >= 8) value += 1;
    if (/[A-Z]/.test(password)) value += 1;
    if (/[a-z]/.test(password)) value += 1;
    if (/\d/.test(password)) value += 1;
    return value;
  }, [password]);

  const label =
    score <= 1 ? "Zayıf" : score === 2 ? "Orta" : score === 3 ? "Güçlü" : "Çok Güçlü";

  const width = `${(score / 4) * 100}%`;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>Şifre gücü</span>
        <span>{label}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-all ${
            score <= 1 ? "bg-red-500" : score === 2 ? "bg-amber-500" : score === 3 ? "bg-sky-500" : "bg-emerald-500"
          }`}
          style={{ width }}
        />
      </div>
    </div>
  );
}
