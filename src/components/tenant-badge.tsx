"use client";

import { useState, useEffect } from "react";
import { ShieldCheckIcon, ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type TenantMode = "sereno" | "customer";

const STORAGE_KEY = "sereno-tenant-mode";

export const TenantBadge = () => {
  const [mode, setMode] = useState<TenantMode>("sereno");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as TenantMode | null;
    if (stored === "sereno" || stored === "customer") setMode(stored);
  }, []);

  const toggle = () => {
    const next: TenantMode = mode === "sereno" ? "customer" : "sereno";
    setMode(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  return (
    <button
      onClick={toggle}
      title="Click to switch tenant mode"
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all select-none",
        mode === "sereno"
          ? "bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20"
          : "bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20"
      )}
    >
      <ShieldCheckIcon className="size-3 shrink-0" />
      <span>
        {mode === "sereno" ? "Sereno Private Tenant" : "Customer Private Tenant"}
      </span>
      <ChevronDownIcon className="size-3 shrink-0 opacity-60" />
    </button>
  );
};
