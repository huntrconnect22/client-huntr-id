import { Check } from "lucide-react";
import type { MarketApp } from "../hooks/useAppMarket";

interface AppIconTileProps {
  app: MarketApp;
  installed: boolean;
  busy: boolean;
  onClick: () => void;
}

export default function AppIconTile({
  app,
  installed,
  busy,
  onClick,
}: AppIconTileProps) {
  const Icon = app.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="group relative flex h-full w-full flex-col items-stretch gap-4 overflow-hidden rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-5 text-left text-[var(--ui-text-primary)] shadow-[0_1px_0_rgba(15,23,42,0.02)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[color:var(--ui-text-brand)]/25 hover:shadow-[0_24px_50px_-28px_rgba(99,102,241,0.55),0_10px_20px_-15px_rgba(15,23,42,0.25)] focus:outline-none focus:ring-2 focus:ring-[var(--ui-text-brand)]/40 disabled:opacity-60"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in srgb, var(--ui-text-brand) 18%, transparent) 0%, transparent 70%)",
        }}
      />

      <div className="relative flex items-center gap-4">
        <div
          className="relative flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl shadow-[0_14px_28px_-16px_rgba(15,23,42,0.55),0_0_0_1px_rgba(255,255,255,0.08)_inset] transition-transform duration-300 group-hover:scale-[1.06] group-hover:-rotate-[2deg]"
          style={{ background: app.iconBgGradient }}
        >
          <Icon size={36} strokeWidth={1.9} color={app.iconColor} />
          <span
            className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 60%)",
            }}
          />
          {installed && (
            <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--ui-bg-card)] bg-emerald-500 text-white shadow-[0_8px_20px_-10px_rgba(16,185,129,0.9)] ring-0">
              <Check size={14} strokeWidth={3} />
            </span>
          )}
          {!installed && app.badge !== "Core platform" && (
            <span
              className={`absolute -right-2 -top-2 flex h-7 items-center rounded-full border-2 border-[var(--ui-bg-card)] px-2 text-[10px] font-bold uppercase tracking-wider shadow-[0_8px_20px_-10px_rgba(0,0,0,0.5)] ${
                app.badge === "Coming soon"
                  ? "bg-amber-400 text-amber-950"
                  : "bg-fuchsia-500 text-white"
              }`}
            >
              {app.badge === "Coming soon" ? "Soon" : "New"}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ui-text-muted)]">
            {app.category}
          </p>
          <h3 className="mt-1 line-clamp-1 text-[15px] font-bold leading-tight text-[var(--ui-text-primary)]">
            {app.name}
          </h3>
          <p className="mt-1 line-clamp-1 text-xs text-[var(--ui-text-secondary)]">
            {app.shortName} · {app.free ? "Gratis" : "Berbayar"}
          </p>
        </div>
      </div>

      <p className="line-clamp-3 text-[13px] leading-5 text-[var(--ui-text-secondary)]">
        {app.description}
      </p>

      <div className="mt-auto flex items-center justify-between pt-1">
        <div className="flex flex-wrap gap-1.5">
          {app.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-2 py-1 text-[10px] font-medium text-[var(--ui-text-muted)]"
            >
              {tag}
            </span>
          ))}
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-transparent px-3 py-1.5 text-[11px] font-bold text-[var(--ui-text-muted)] transition-all duration-300 group-hover:border-[var(--ui-text-brand)]/25 group-hover:bg-[var(--ui-text-brand)]/10 group-hover:text-[var(--ui-text-brand)]">
          {installed ? "Buka" : "Lihat"}
          <span className="transition-transform duration-300 group-hover:translate-x-0.5">
            →
          </span>
        </span>
      </div>
    </button>
  );
}
