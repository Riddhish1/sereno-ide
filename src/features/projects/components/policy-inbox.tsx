"use client";

import { useState, useRef, useCallback } from "react";
import {
  UploadCloudIcon,
  FileTextIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  XIcon,
  ShieldAlertIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type Enforcement = "IaC" | "Runtime" | "API" | "Policy";
type Severity = "critical" | "high" | "medium" | "low";

interface Constraint {
  id: string;
  title: string;
  description: string;
  confidence: number;
  enforcement: Enforcement;
  severity: Severity;
}

interface ParsedPolicy {
  constraints: Constraint[];
  sourceDocument: string;
  summary: string;
}

const ENFORCEMENT_STYLES: Record<Enforcement, string> = {
  IaC: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  Runtime: "bg-green-500/10 text-green-400 border-green-500/30",
  API: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  Policy: "bg-purple-500/10 text-purple-400 border-purple-500/30",
};

const SEVERITY_STYLES: Record<Severity, string> = {
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  low: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

export const PolicyInbox = () => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ParsedPolicy | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are supported.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/policy/parse", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to parse policy document");
      }

      const data: ParsedPolicy = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <ShieldAlertIcon className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Policy Inbox
        </span>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !isLoading && inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed p-5 flex flex-col items-center gap-2 transition-colors",
          isLoading
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer",
          isDragOver
            ? "border-blue-500 bg-blue-500/5"
            : "border-muted-foreground/20 hover:border-muted-foreground/40 bg-background"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        {isLoading ? (
          <>
            <div className="size-5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
            <p className="text-xs text-muted-foreground text-center">
              Analyzing policy document…
            </p>
          </>
        ) : (
          <>
            <UploadCloudIcon className="size-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              Drop Networking / Security PDFs.
              <br />
              <span className="text-muted-foreground/60">
                Constraints auto-applied.
              </span>
            </p>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2">
          <AlertCircleIcon className="size-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Parsed results */}
      {result && (
        <div className="flex flex-col gap-2">
          {/* Source + dismiss */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
              <FileTextIcon className="size-3.5 shrink-0" />
              <span className="truncate">{result.sourceDocument}</span>
            </div>
            <button
              onClick={() => setResult(null)}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <XIcon className="size-3.5" />
            </button>
          </div>

          {/* Summary */}
          <p className="text-xs text-muted-foreground leading-relaxed">
            {result.summary}
          </p>

          {/* Constraints list */}
          <div className="flex flex-col gap-1.5">
            {result.constraints.map((c) => (
              <div
                key={c.id}
                className="bg-background border p-3 flex flex-col gap-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-1.5 min-w-0">
                    <CheckCircle2Icon className="size-3 text-green-400 shrink-0 mt-0.5" />
                    <span className="text-xs font-medium leading-snug">
                      {c.title}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                    {c.confidence}% confidence
                  </span>
                </div>

                <p className="text-xs text-muted-foreground pl-[18px] leading-relaxed">
                  {c.description}
                </p>

                <div className="flex items-center gap-1.5 pl-[18px]">
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full border font-medium",
                      ENFORCEMENT_STYLES[c.enforcement]
                    )}
                  >
                    {c.enforcement}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full border font-medium",
                      SEVERITY_STYLES[c.severity]
                    )}
                  >
                    {c.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
