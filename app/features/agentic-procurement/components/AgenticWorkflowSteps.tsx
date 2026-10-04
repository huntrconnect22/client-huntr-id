import React, { useState } from "react";
import { Bot, Loader2, CheckCircle2, AlertCircle, Globe, ChevronDown, ChevronUp, ExternalLink, Tag } from "lucide-react";
import { type StepStatus } from "../types";

interface BraveSource {
  title: string;
  link: string;
  price?: number;
  snippet?: string;
  thumbnail?: string | null;
}


interface BrandRec {
  brand: string;
  avg_price?: number | null;
  thumbnail?: string | null;
}

interface AgenticWorkflowStepsProps {
  workflowSteps: StepStatus[];
  isRunning: boolean;
  webSearchSources?: BraveSource[];
  brandRecommendations?: BrandRec[];
}

function formatRp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

export default function AgenticWorkflowSteps({
  workflowSteps,
  isRunning,
  webSearchSources = [],
  brandRecommendations = [],
}: AgenticWorkflowStepsProps) {
  const [showSources, setShowSources] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      {/* ── Workflow step cards ── */}
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
            const isWebSearch = step.step === "web_search";

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
                  <p className="text-[10px] text-[var(--ui-text-muted)] line-clamp-2 leading-relaxed">
                    {step.summary}
                  </p>
                )}

                {/* Tombol expand sumber — hanya di step web_search */}
                {isWebSearch && isDone && webSearchSources.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowSources((v) => !v)}
                    className="mt-0.5 text-[9px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-0.5 transition-colors"
                  >
                    <Globe size={9} />
                    {webSearchSources.length} URL dikunjungi
                    {showSources ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Panel Sumber Referensi Brave ── */}
      {showSources && webSearchSources.length > 0 && (
        <div className="rounded-xl bg-[var(--ui-bg-card)] border border-blue-500/25 p-3 flex flex-col gap-2 shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <Globe size={11} />
              Sumber Referensi Brave Search
              <span className="px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300">
                {webSearchSources.length} URL
              </span>
            </span>
            <button
              type="button"
              onClick={() => setShowSources(false)}
              className="text-[9px] text-[var(--ui-text-muted)] hover:text-[var(--ui-text-primary)] transition-colors"
            >
              Tutup
            </button>
          </div>

          {/* Brand recommendations */}
          {brandRecommendations.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] flex items-center gap-1">
                <Tag size={9} />
                Merek yang Ditemukan Brave
              </span>
              <div className="flex flex-wrap gap-1.5">
                {brandRecommendations.map((br, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[10px]"
                  >
                    {br.thumbnail && (
                      <img
                        src={br.thumbnail}
                        alt={br.brand}
                        className="w-4 h-4 object-contain rounded"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    )}
                    <span className="font-semibold text-[var(--ui-text-primary)]">{br.brand}</span>
                    {br.avg_price != null && br.avg_price > 0 && (
                      <span className="text-emerald-400 font-mono text-[9px]">
                        ~{formatRp(Math.round(br.avg_price))}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Source URLs list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-64 overflow-y-auto pr-0.5">
            {webSearchSources.map((src, i) => {
              let domain = "";
              try { domain = new URL(src.link).hostname.replace("www.", ""); } catch {}
              return (
                <a
                  key={i}
                  href={src.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 p-2 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] hover:border-blue-500/40 transition-colors group"
                >
                  {/* Thumbnail atau fallback globe icon */}
                  {src.thumbnail ? (
                    <img
                      src={src.thumbnail}
                      alt={domain}
                      className="w-8 h-8 object-cover rounded shrink-0 mt-0.5 border border-[var(--ui-border)]"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Globe size={12} className="text-blue-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold text-[var(--ui-text-primary)] line-clamp-1 group-hover:text-blue-400 transition-colors flex items-center gap-0.5">
                      {src.title || domain}
                      <ExternalLink size={8} className="flex-shrink-0 ml-0.5 opacity-60" />
                    </div>
                    <div className="text-[9px] text-blue-400/70 truncate mb-0.5">{domain}</div>
                    {src.snippet && (
                      <div className="text-[9px] text-[var(--ui-text-muted)] line-clamp-2 leading-relaxed">
                        {src.snippet}
                      </div>
                    )}
                    {src.price != null && src.price > 0 && (
                      <div className="text-[9px] font-bold text-emerald-400 mt-0.5">
                        {formatRp(src.price)}
                      </div>
                    )}
                  </div>
                </a>
              );
            })}

          </div>

          <p className="text-[9px] text-[var(--ui-text-muted)] text-center">
            Data di atas adalah hasil nyata dari Brave Search API — bukan halusinasi AI
          </p>
        </div>
      )}
    </div>
  );
}


