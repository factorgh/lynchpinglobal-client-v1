"use client";

import React from "react";
import { getPasswordChecks } from "@/lib/passwordPolicy";

const PasswordRequirements: React.FC<{ password: string; className?: string }> = ({
  password,
  className = "",
}) => {
  const checks = getPasswordChecks(password);
  return (
    <div className={`rounded-lg border border-slate-200 bg-slate-50 p-2.5 ${className}`}>
      <p className="text-[11px] font-semibold text-slate-700 mb-1">Password must contain:</p>
      <ul className="space-y-0.5">
        {checks.map((c) => (
          <li
            key={c.id}
            className={`text-[11px] flex items-center gap-1.5 ${
              c.met ? "text-emerald-700" : "text-slate-500"
            }`}
          >
            <span aria-hidden="true">{c.met ? "✓" : "•"}</span>
            <span>{c.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PasswordRequirements;
