import React from "react";
import { Sparkles, Loader2 } from "lucide-react";

interface AIAnalysisPanelProps {
  showAiPanel: boolean;
  aiRankLoading: boolean;
  aiRankError: string | null;
  aiRankings: any;
}

export function AIAnalysisPanel({ showAiPanel, aiRankLoading, aiRankError, aiRankings }: AIAnalysisPanelProps) {
  if (!showAiPanel) return null;

  return (
    <div className="rounded-lg border border-purple-500/25 bg-purple-500/5 p-3">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={14} className="text-purple-400" />
        <div>
          <div className="text-xs font-bold text-[var(--ui-text-primary)]">Huntr AI Assessment</div>
          <div className="text-[10px] text-[var(--ui-text-muted)]">Price 40% · delivery 30% · warranty 20% · completeness 10%</div>
        </div>
      </div>

      {aiRankLoading ? (
        <div className="flex items-center gap-2 py-3 text-xs text-[var(--ui-text-muted)]">
          <Loader2 size={14} className="animate-spin text-purple-400" />
          Evaluating proposals...
        </div>
      ) : aiRankError ? (
        <div className="text-xs text-red-400 px-2.5 py-2 rounded-lg border border-red-500/25 bg-red-500/10">
          {aiRankError}
        </div>
      ) : aiRankings ? (
        <div className="space-y-2">
          {aiRankings.overall_analysis && (
            <p className="text-xs text-[var(--ui-text-secondary)] leading-relaxed border-l-2 border-purple-400 pl-2">
              {aiRankings.overall_analysis}
            </p>
          )}
          {(aiRankings.rankings || []).map((rank: any, idx: number) => {
            const isAiWinner = rank.proposal_id === aiRankings.recommended_winner_id;
            return (
              <div
                key={rank.proposal_id || idx}
                className={`rounded-lg border px-2.5 py-2 ${
                  isAiWinner
                    ? "border-purple-500/30 bg-purple-500/10"
                    : "border-[var(--ui-border)] bg-[var(--ui-bg-card)]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-[var(--ui-text-muted)]">#{rank.rank}</span>
                    <span className="text-xs font-semibold text-[var(--ui-text-primary)] ml-2 truncate">
                      {rank.proposal?.company?.name || "Vendor"}
                    </span>
                    {isAiWinner && (
                      <span className="ml-1.5 text-[10px] font-bold text-purple-400">AI pick</span>
                    )}
                  </div>
                  {rank.total_score != null && (
                    <span className="text-xs font-bold text-purple-400 tabular-nums shrink-0">
                      {rank.total_score.toFixed(1)} pts
                    </span>
                  )}
                </div>
                {rank.recommendation && (
                  <p className="text-[11px] text-[var(--ui-text-muted)] mt-1 leading-relaxed">{rank.recommendation}</p>
                )}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
