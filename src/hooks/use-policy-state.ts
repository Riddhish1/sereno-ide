"use client";

import { useState, useEffect, useCallback } from "react";

export type Enforcement = "IaC" | "Runtime" | "API" | "Policy";
export type Severity = "critical" | "high" | "medium" | "low";

export interface PolicyConstraint {
  id: string;
  title: string;
  description: string;
  confidence: number;
  enforcement: Enforcement;
  severity: Severity;
}

export interface PolicyState {
  constraints: PolicyConstraint[];
  sourceDocument: string;
  summary: string;
  uploadedAt: number;
  violations: string[]; // constraint IDs that are violated
}

const STORAGE_KEY = "sereno-policy-state";

export type ComplianceStatus = "compliant" | "warning" | "violation" | "none";

export function getComplianceStatus(state: PolicyState | null): ComplianceStatus {
  if (!state || state.constraints.length === 0) return "none";
  if (state.violations.length === 0) return "compliant";
  const hasHighSeverity = state.violations.some((vid) => {
    const c = state.constraints.find((c) => c.id === vid);
    return c?.severity === "critical" || c?.severity === "high";
  });
  return hasHighSeverity ? "violation" : "warning";
}

export function usePolicyState() {
  const [state, setState] = useState<PolicyState | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {}
  }, []);

  const savePolicy = useCallback((data: Omit<PolicyState, "uploadedAt" | "violations">) => {
    const next: PolicyState = { ...data, uploadedAt: Date.now(), violations: [] };
    setState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const clearPolicy = useCallback(() => {
    setState(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const addViolation = useCallback((constraintId: string) => {
    setState((prev) => {
      if (!prev) return prev;
      if (prev.violations.includes(constraintId)) return prev;
      const next = { ...prev, violations: [...prev.violations, constraintId] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeViolation = useCallback((constraintId: string) => {
    setState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, violations: prev.violations.filter((v) => v !== constraintId) };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { state, savePolicy, clearPolicy, addViolation, removeViolation };
}
