import React from "react";
import { Bot, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { type StepStatus } from "../types";

interface AgenticWorkflowStepsProps {
  workflowSteps: StepStatus[];
  isRunning: boolean;
}

export default function AgenticWorkflowSteps({
  workflowSteps,
  isRunning,
}: AgenticWorkflowStepsProps) {
  return (
    <div className="p-3 sm:p-3.5 rounded-xl bg-[var(--ui-bg-card)] border border-[var(--ui-border)] flex flex-col gap-2 shadow-sm">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-[var(--ui-text-primary)] uppercase tracking-wider flex items-center gap-1.5 text-[11px] sm:text-xs">
          <Bot size={13} className="text-orange-400" />
          Tahapan Autonomous AI Agent
        </span>
        {isRunning && (
          <span className="text-orange-400 font-medium flex items-center gap-1.5 animate-pulse text-[10px] sm:text-[11px]">
            <Loader2 size={11} className="animate-spin" /> Menganalisis...
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
        {workflowSteps.map((step, i) => {
          const isDone = step.status === "completed";
          const isCurr = step.status === "running";
          const isFail = step.status === "failed";

          return (
            <div
              key={i}
              className={`p-2.5 rounded-lg border text-xs transition-all flex flex-col gap-1 ${
                isDone
                  ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-400"
                  : isCurr
                  ? "bg-orange-500/10 border-orange-500/40 text-orange-400"
                  : isFail
                  ? "bg-red-500/10 border-red-500/30 text-red-400"
                  : "bg-[var(--ui-bg-input)] border-[var(--ui-border)] text-[var(--ui-text-muted)] opacity-60"
              }`}
            >
              <div className="flex items-center justify-between font-semibold">
                <span className="truncate">{step.title}</span>
                {isDone ? (
                  <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
                ) : isCurr ? (
                  <Loader2 size={13} className="animate-spin text-orange-400 flex-shrink-0" />
                ) : isFail ? (
                  <AlertCircle size={13} className="text-red-400 flex-shrink-0" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                )}
              </div>
              {step.summary && (
                <p className="text-[10px] text-[var(--ui-text-muted)] line-clamp-1">
                  {step.summary}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
