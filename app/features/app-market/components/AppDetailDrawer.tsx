import { useEffect, useRef, useCallback, type ReactNode } from "react";
import { X, Check, Download } from "lucide-react";
import type { MarketApp } from "../hooks/useAppMarket";

interface AppDetailDrawerProps {
  app: MarketApp | null;
  installed: boolean;
  busy: boolean;
  error: string;
  onClose: () => void;
  onInstall: () => void;
  onUninstall: () => void;
  onOpen: () => void;
}

const MODAL_KEYFRAMES = `
  @keyframes app-modal-fade {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes app-modal-pop {
    from { opacity: 0; transform: translateY(10px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
`;

let keyframesInjected = false;
const injectModalKeyframes = () => {
  if (keyframesInjected || typeof document === "undefined") return;
  try {
    const id = "app-modal-keyframes";
    if (document.getElementById(id)) {
      keyframesInjected = true;
      return;
    }
    const style = document.createElement("style");
    style.id = id;
    style.textContent = MODAL_KEYFRAMES;
    document.head.appendChild(style);
    keyframesInjected = true;
  } catch {
    // ignore
  }
};

function ModalBackdrop({
  onClose,
  children,
}: {
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-5"
      style={{
        background: "var(--ui-bg-overlay)",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
        animation: "app-modal-fade 180ms ease-out forwards",
      }}
    >
      {children}
    </div>
  );
}

export default function AppDetailDrawer({
  app,
  installed,
  busy,
  error,
  onClose,
  onInstall,
  onUninstall,
  onOpen,
}: AppDetailDrawerProps) {
  const open = !!app;
  const Icon = app?.icon;
  const mountedRef = useRef(false);
  const modalElRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    injectModalKeyframes();
  }, []);

  useEffect(() => {
    if (!open) {
      mountedRef.current = false;
      return;
    }
    // Apply mount animation only the very first time this modal becomes visible.
    // Use class instead of inline style animation so React re-renders never
    // re-trigger CSS animations (prevents flicker/blinking when busy/error changes).
    if (!mountedRef.current) {
      if (modalElRef.current) {
        modalElRef.current.classList.add("app-modal-mounted");
      }
      mountedRef.current = true;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || !app) return null;

  return (
    <ModalBackdrop onClose={onClose}>
      <style>{`
        .app-modal-mounted {
          animation: app-modal-pop 240ms cubic-bezier(0.22,1,0.36,1) forwards !important;
        }
      `}</style>
      <div
        ref={modalElRef}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-xl flex-col overflow-hidden rounded-2xl ring-1 ring-[var(--ui-border)]"
        style={{
          background: "var(--ui-bg-elevated)",
          maxHeight: "88vh",
        }}
      >
        <header
          className="relative overflow-hidden px-5 pb-5 pt-5 text-white"
          style={{ background: app.iconBgGradient }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(700px 120px at 10% -20%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 60%)",
            }}
          />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/30">
                {Icon && (
                  <Icon
                    size={26}
                    strokeWidth={1.9}
                    color={app.iconColor === "#ffffff" ? "#ffffff" : app.iconColor}
                  />
                )}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/70">
                  {app.category} · {app.shortName}
                </p>
                <h2 className="mt-0.5 text-xl font-bold leading-tight">
                  {app.name}
                </h2>
                <span className="mt-1.5 inline-flex items-center rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white ring-1 ring-white/20">
                  {app.badge}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white/85 ring-1 ring-white/25 transition hover:bg-white/25 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <section className="space-y-2">
            <h3
              className="text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{ color: "var(--ui-text-muted)" }}
            >
              Tentang aplikasi
            </h3>
            <p
              className="text-[13px] leading-5"
              style={{ color: "var(--ui-text-secondary)" }}
            >
              {app.longDescription}
            </p>
          </section>

          <section className="space-y-2">
            <h3
              className="text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{ color: "var(--ui-text-muted)" }}
            >
              Fitur utama
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {app.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border px-2.5 py-1 text-[11px] font-medium"
                  style={{
                    borderColor: "var(--ui-border)",
                    background: "var(--ui-bg-card)",
                    color: "var(--ui-text-secondary)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <h3
              className="text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{ color: "var(--ui-text-muted)" }}
            >
              Informasi lisensi
            </h3>
            <div
              className="rounded-xl border p-3"
              style={{
                borderColor: "var(--ui-border)",
                background: "var(--ui-bg-card)",
              }}
            >
              <div className="flex items-center justify-between text-[13px]">
                <span style={{ color: "var(--ui-text-secondary)" }}>
                  Harga
                </span>
                <span
                  className="font-bold"
                  style={{ color: "var(--ui-text-primary)" }}
                >
                  {app.free ? "Gratis" : "Hubungi sales"}
                </span>
              </div>
              <div
                className="mt-2.5 flex items-center justify-between border-t pt-2.5 text-[13px]"
                style={{ borderColor: "var(--ui-border)" }}
              >
                <span style={{ color: "var(--ui-text-secondary)" }}>
                  Instalasi per perusahaan
                </span>
                <span
                  className="font-semibold"
                  style={{ color: "var(--ui-text-brand)" }}
                >
                  {installed ? "Terpasang" : "Belum terpasang"}
                </span>
              </div>
            </div>
          </section>

          {error && (
            <div
              className="rounded-xl border p-3 text-[13px]"
              style={{
                background: "var(--ui-bg-error)",
                borderColor: "var(--ui-border-error)",
                color: "var(--ui-text-error)",
              }}
            >
              {error}
            </div>
          )}
        </div>

        <footer
          className="space-y-2.5 border-t px-5 py-4"
          style={{
            borderColor: "var(--ui-border)",
            background: "var(--ui-bg-card)",
          }}
        >
          <div className="flex items-stretch gap-2.5">
            {installed ? (
              <button
                type="button"
                onClick={onOpen}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[image:var(--huntr-gradient)] px-4 py-2.5 text-[13px] font-bold text-white shadow-md shadow-orange-500/20 transition hover:brightness-110"
              >
                <Check size={15} strokeWidth={2.4} />
                Buka aplikasi
              </button>
            ) : (
              <button
                type="button"
                disabled={busy || app.badge === "Coming soon"}
                onClick={onInstall}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[image:var(--huntr-gradient)] px-4 py-2.5 text-[13px] font-bold text-white shadow-md shadow-orange-500/20 transition hover:brightness-110 disabled:opacity-60"
              >
                <Download size={15} strokeWidth={2.2} />
                {busy
                  ? "Memasang…"
                  : app.badge === "Coming soon"
                    ? "Segera hadir"
                    : "Install sekarang"}
              </button>
            )}
          </div>
          {installed && (
            <button
              type="button"
              disabled={busy}
              onClick={onUninstall}
              className="w-full rounded-lg border bg-transparent px-4 py-2 text-[11px] font-semibold underline-offset-2 transition disabled:opacity-50"
              style={{
                borderColor: "var(--ui-border)",
                color: "var(--ui-text-muted)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--ui-text-error)";
                e.currentTarget.style.textDecoration = "underline";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--ui-text-muted)";
                e.currentTarget.style.textDecoration = "none";
              }}
            >
              {busy ? "Menghapus instalasi…" : "Uninstall aplikasi"}
            </button>
          )}
        </footer>
      </div>
    </ModalBackdrop>
  );
}
