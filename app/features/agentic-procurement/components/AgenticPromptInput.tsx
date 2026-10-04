import React from "react";
import { Sparkles, Zap, Loader2, Sliders } from "lucide-react";
import { useLanguage } from "../../../context/LanguageContext";
import { useAgenticPresets } from "../hooks/useAgenticPresets";

interface AgenticPromptInputProps {
  prompt: string;
  setPrompt: (val: string) => void;
  isRunning: boolean;
  onExecute: (presetPrompt?: string) => void;
}

export default function AgenticPromptInput({
  prompt,
  setPrompt,
  isRunning,
  onExecute,
}: AgenticPromptInputProps) {
  const { t } = useLanguage();
  const presetPrompts = useAgenticPresets();

  return (
    <div className="rounded-xl bg-[var(--ui-bg-card)] border border-[var(--ui-border)] p-3.5 sm:p-4 shadow-sm flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shadow-sm flex-shrink-0 mt-0.5 sm:mt-0">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-sm font-bold text-[var(--ui-text-primary)]">
                {t("agentic.prompt.header")}
              </h2>
              <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                {t("agentic.prompt.badgeBeta")}
              </span>
              <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500 border border-orange-500/20">
                {t("agentic.prompt.modelBadge")}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-[var(--ui-text-muted)] mt-0.5 leading-relaxed">
              {t("agentic.prompt.subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Prompt Textarea */}
      <div className="flex flex-col sm:relative gap-2">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t("agentic.prompt.placeholder")}
          rows={3}
          disabled={isRunning}
          className="w-full p-3 sm:pr-32 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] text-xs sm:text-sm outline-none focus:border-orange-500/50 transition-all resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              onExecute();
            }
          }}
        />
        <button
          onClick={() => onExecute()}
          disabled={isRunning || !prompt.trim()}
          className="sm:absolute sm:right-2.5 sm:bottom-3 w-full sm:w-auto justify-center inline-flex items-center gap-1.5 px-4 py-2.5 sm:py-1.5 rounded-lg sm:rounded-md bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isRunning ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              <span>{t("agentic.prompt.processing")}</span>
            </>
          ) : (
            <>
              <Zap size={13} />
              <span>{t("agentic.prompt.execute")}</span>
            </>
          )}
        </button>
      </div>

      {/* Preset Prompts (Compact chips) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-hide">
        <span className="text-[11px] font-semibold text-[var(--ui-text-muted)] flex items-center gap-1 flex-shrink-0">
          <Sliders size={11} /> {t("agentic.prompt.preset")}
        </span>
        {presetPrompts.map((item, idx) => (
          <button
            key={idx}
            onClick={() => {
              setPrompt(item.prompt);
              onExecute(item.prompt);
            }}
            disabled={isRunning}
            className="text-[10px] sm:text-[11px] px-2.5 py-1 rounded-md bg-[var(--ui-bg-input)] hover:bg-orange-500/10 border border-[var(--ui-border)] hover:border-orange-500/30 text-[var(--ui-text-secondary)] hover:text-orange-500 transition-all text-left flex items-center gap-1.5 cursor-pointer disabled:opacity-50 flex-shrink-0 whitespace-nowrap"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            <span>{item.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
