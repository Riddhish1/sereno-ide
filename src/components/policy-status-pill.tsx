"use client";

import { useState } from "react";
import {
  ShieldCheckIcon,
  ShieldAlertIcon,
  ShieldXIcon,
  ShieldIcon,
  CheckCircle2Icon,
  XCircleIcon,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { usePolicyState, getComplianceStatus, ComplianceStatus } from "@/hooks/use-policy-state";

const STATUS_CONFIG: Record<ComplianceStatus, {
  label: string;
  icon: React.ElementType;
  pill: string;
  headerColor: string;
}> = {
  compliant: {
    label: "Compliant",
    icon: ShieldCheckIcon,
    pill: "bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20",
    headerColor: "text-green-400",
  },
  warning: {
    label: "Warning",
    icon: ShieldAlertIcon,
    pill: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20",
    headerColor: "text-yellow-400",
  },
  violation: {
    label: "Violation",
    icon: ShieldXIcon,
    pill: "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20",
    headerColor: "text-red-400",
  },
  none: {
    label: "No Policy",
    icon: ShieldIcon,
    pill: "bg-muted/40 text-muted-foreground border-border hover:bg-muted/60",
    headerColor: "text-muted-foreground",
  },
};

const ENFORCEMENT_COLORS: Record<string, string> = {
  IaC: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  Runtime: "bg-green-500/10 text-green-400 border-green-500/30",
  API: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  Policy: "bg-purple-500/10 text-purple-400 border-purple-500/30",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  low: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

export const PolicyStatusPill = () => {
  const [open, setOpen] = useState(false);
  const { state, addViolation, removeViolation } = usePolicyState();
  const status = getComplianceStatus(state);
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Policy compliance status — click for report"
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all select-none",
          cfg.pill
        )}
      >
        <Icon className="size-3 shrink-0" />
        <span>Policy: {cfg.label}</span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4">
            <div className="flex items-center gap-2">
              <Icon className={cn("size-5", cfg.headerColor)} />
              <SheetTitle className={cfg.headerColor}>
                Policy {cfg.label}
              </SheetTitle>
            </div>
            <SheetDescription>
              {state
                ? `${state.constraints.length} constraint${state.constraints.length !== 1 ? "s" : ""} from "${state.sourceDocument}" · uploaded ${formatDistanceToNow(state.uploadedAt, { addSuffix: true })}`
                : "No policy uploaded yet. Use the Policy Inbox on the home page to upload a PDF."}
            </SheetDescription>
          </SheetHeader>

          {state && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {state.summary}
              </p>

              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Compliance</span>
                <span className="font-medium">
                  {state.constraints.length - state.violations.length} / {state.constraints.length} enforced
                </span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    status === "compliant" ? "bg-green-500" :
                    status === "warning" ? "bg-yellow-500" : "bg-red-500"
                  )}
                  style={{
                    width: `${((state.constraints.length - state.violations.length) / state.constraints.length) * 100}%`,
                  }}
                />
              </div>

              <div className="flex flex-col gap-2 mt-2">
                {state.constraints.map((c) => {
                  const violated = state.violations.includes(c.id);
                  return (
                    <div key={c.id} className={cn(
                      "border p-3 flex flex-col gap-2 transition-colors",
                      violated ? "bg-red-500/5 border-red-500/20" : "bg-background"
                    )}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {violated
                            ? <XCircleIcon className="size-3.5 text-red-400 shrink-0" />
                            : <CheckCircle2Icon className="size-3.5 text-green-400 shrink-0" />
                          }
                          <span className="text-xs font-medium">{c.title}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">{c.confidence}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground pl-5 leading-relaxed">{c.description}</p>
                      <div className="flex items-center justify-between pl-5">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border font-medium", ENFORCEMENT_COLORS[c.enforcement])}>
                            {c.enforcement}
                          </span>
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border font-medium", SEVERITY_COLORS[c.severity])}>
                            {c.severity}
                          </span>
                        </div>
                        <button
                          onClick={() => violated ? removeViolation(c.id) : addViolation(c.id)}
                          className={cn(
                            "text-[10px] px-2 py-0.5 border rounded transition-colors",
                            violated
                              ? "border-green-500/30 text-green-400 hover:bg-green-500/10"
                              : "border-red-500/30 text-red-400 hover:bg-red-500/10"
                          )}
                        >
                          {violated ? "Mark Resolved" : "Mark Violation"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};
