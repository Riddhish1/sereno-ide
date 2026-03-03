"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheckIcon,
  ShieldAlertIcon,
  ShieldXIcon,
  GavelIcon,
  CheckCircleIcon,
  XCircleIcon,
  TimerIcon,
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

const APPROVAL_KEY = "sereno-approval-state";
const APPROVER_ROLES = [
  { id: "security", label: "Security", description: "Security team review" },
  { id: "infra", label: "Infra", description: "Infrastructure owner sign-off" },
  { id: "data", label: "Data Owner", description: "Data classification review" },
];
const SLA_HOURS = 24;

interface ApprovalState {
  requestedAt: number;
  approved: string[];
  status: "idle" | "pending" | "approved" | "rejected";
}

export const ApprovalGate = () => {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ApprovalState>({
    requestedAt: 0,
    approved: [],
    status: "idle",
  });
  const [elapsed, setElapsed] = useState(0); // seconds elapsed

  useEffect(() => {
    try {
      const raw = localStorage.getItem(APPROVAL_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {}
  }, []);

  // Countdown tick
  useEffect(() => {
    if (state.status !== "pending") return;
    const id = setInterval(() => {
      const secs = Math.floor((Date.now() - state.requestedAt) / 1000);
      setElapsed(secs);
    }, 1000);
    return () => clearInterval(id);
  }, [state.status, state.requestedAt]);

  const save = (next: ApprovalState) => {
    setState(next);
    localStorage.setItem(APPROVAL_KEY, JSON.stringify(next));
  };

  const requestApproval = () => {
    save({ requestedAt: Date.now(), approved: [], status: "pending" });
  };

  const toggleApprover = (id: string) => {
    const approved = state.approved.includes(id)
      ? state.approved.filter((a) => a !== id)
      : [...state.approved, id];
    const allApproved = approved.length === APPROVER_ROLES.length;
    save({ ...state, approved, status: allApproved ? "approved" : "pending" });
  };

  const reset = () => {
    save({ requestedAt: 0, approved: [], status: "idle" });
  };

  const slaSeconds = SLA_HOURS * 3600;
  const remaining = Math.max(0, slaSeconds - elapsed);
  const remainingH = Math.floor(remaining / 3600);
  const remainingM = Math.floor((remaining % 3600) / 60);
  const remainingS = remaining % 60;
  const slaExpired = state.status === "pending" && remaining === 0;
  const slaPercent = Math.min(100, (elapsed / slaSeconds) * 100);

  const pillConfig = {
    idle: { label: "Approval Gate", icon: GavelIcon, pill: "bg-muted/40 text-muted-foreground border-border hover:bg-muted/60" },
    pending: { label: "Awaiting Approval", icon: TimerIcon, pill: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20" },
    approved: { label: "Approved", icon: ShieldCheckIcon, pill: "bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20" },
    rejected: { label: "Rejected", icon: ShieldXIcon, pill: "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20" },
  }[state.status];

  const PillIcon = pillConfig.icon;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Approval gate — click to manage"
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all select-none",
          pillConfig.pill
        )}
      >
        <PillIcon className="size-3 shrink-0" />
        <span>{pillConfig.label}</span>
        {state.status === "pending" && (
          <span className="font-mono">
            {String(remainingH).padStart(2, "0")}:{String(remainingM).padStart(2, "0")}:{String(remainingS).padStart(2, "0")}
          </span>
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-4">
            <div className="flex items-center gap-2">
              <GavelIcon className="size-5 text-muted-foreground" />
              <SheetTitle>Approval Gate</SheetTitle>
            </div>
            <SheetDescription>
              Required sign-offs before infrastructure or PR changes are deployed.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-4">
            {/* SLA Timer */}
            {state.status === "pending" && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <TimerIcon className="size-3" /> SLA
                  </span>
                  <span className={cn("font-mono font-medium", slaExpired ? "text-red-400" : "text-foreground")}>
                    {slaExpired
                      ? "EXPIRED"
                      : `${String(remainingH).padStart(2, "0")}:${String(remainingM).padStart(2, "0")}:${String(remainingS).padStart(2, "0")} remaining`}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      slaExpired ? "bg-red-500" : slaPercent > 75 ? "bg-yellow-500" : "bg-blue-500"
                    )}
                    style={{ width: `${slaPercent}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Requested {formatDistanceToNow(state.requestedAt, { addSuffix: true })}
                </p>
              </div>
            )}

            {/* Approvers */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Required Approvers</p>
              {APPROVER_ROLES.map((role) => {
                const isApproved = state.approved.includes(role.id);
                const canToggle = state.status === "pending";
                return (
                  <div
                    key={role.id}
                    className={cn(
                      "flex items-center justify-between border p-3 transition-colors",
                      isApproved ? "bg-green-500/5 border-green-500/20" : "bg-background"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {isApproved
                        ? <CheckCircleIcon className="size-4 text-green-400 shrink-0" />
                        : <XCircleIcon className="size-4 text-muted-foreground shrink-0" />
                      }
                      <div>
                        <p className="text-sm font-medium">{role.label}</p>
                        <p className="text-xs text-muted-foreground">{role.description}</p>
                      </div>
                    </div>
                    {canToggle && (
                      <button
                        onClick={() => toggleApprover(role.id)}
                        className={cn(
                          "text-[10px] px-2 py-0.5 border rounded transition-colors",
                          isApproved
                            ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                            : "border-green-500/30 text-green-400 hover:bg-green-500/10"
                        )}
                      >
                        {isApproved ? "Revoke" : "Approve"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Status badge */}
            {state.status === "approved" && (
              <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-2">
                <ShieldCheckIcon className="size-4 shrink-0" />
                All approvers have signed off. Safe to deploy.
              </div>
            )}
            {slaExpired && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2">
                <ShieldAlertIcon className="size-4 shrink-0" />
                SLA expired. Escalate to engineering lead.
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-1">
              {state.status === "idle" && (
                <button
                  onClick={requestApproval}
                  className="flex-1 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Request Approval
                </button>
              )}
              {state.status !== "idle" && (
                <button
                  onClick={reset}
                  className="flex-1 py-2 text-sm font-medium border border-border hover:bg-muted transition-colors text-muted-foreground"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
