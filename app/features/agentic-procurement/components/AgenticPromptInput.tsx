import React from "react";
import { Sparkles, Zap, Loader2, Sliders } from "lucide-react";
import { PRESET_PROMPTS } from "../types";

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
  return (
    <div className="rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)] p-4 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shadow-sm">
            <Sparkles size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--ui-text-primary)] flex items-center gap-2">
              Huntr Procurement Agent
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                Versi Beta
              </span>
              <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-orange-500/10 text-orange-500 border border-orange-500/20">
                ChatGPT 4o
              </span>
            </h2>
            <p className="text-xs text-[var(--ui-text-muted)]">
              Deskripsikan barang atau jasa yang ingin diadakan, AI akan mencari katalog, membandingkan spesifikasi, dan membuat PR.
            </p>
          </div>
        </div>
      </div>

      {/* Prompt Textarea */}
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Contoh: Butuh 15 unit laptop Core i7 RAM 32GB untuk tim developer, 15 monitor 27 inch 4K, dan 15 mouse wireless. Cari produknya, bandingkan alternatifnya, dan langsung buatkan PR lengkap dengan estimasi harga."
          rows={2}
          disabled={isRunning}
          className="w-full p-3 pr-32 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] text-xs md:text-sm outline-none focus:border-orange-500/50 transition-all resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              onExecute();
            }
          }}
        />
        <button
          onClick={() => onExecute()}
          disabled={isRunning || !prompt.trim()}
          className="absolute right-2.5 bottom-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isRunning ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              <span>Memproses...</span>
            </>
          ) : (
            <>
              <Zap size={13} />
              <span>Jalankan AI</span>
            </>
          )}
        </button>
      </div>

      {/* Preset Prompts (Compact chips) */}
      <div className="flex items-center gap-2 flex-wrap pt-1">
        <span className="text-[11px] font-semibold text-[var(--ui-text-muted)] flex items-center gap-1">
          <Sliders size={11} /> Preset:
        </span>
        {PRESET_PROMPTS.map((item, idx) => (
          <button
            key={idx}
            onClick={() => {
              setPrompt(item.prompt);
              onExecute(item.prompt);
            }}
            disabled={isRunning}
            className="text-[11px] px-2.5 py-1 rounded-md bg-[var(--ui-bg-input)] hover:bg-orange-500/10 border border-[var(--ui-border)] hover:border-orange-500/30 text-[var(--ui-text-secondary)] hover:text-orange-500 transition-all text-left flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            <span>{item.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
