import React, { useRef, useState, useEffect } from "react";
import { Languages } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { LOCALE_LABELS, type Locale } from "../locales";

/**
 * Compact language switcher dropdown.
 * Can be placed in the header, user-menu, or settings page.
 */
export function LanguageSwitcher({
  buttonStyle,
  className,
}: {
  buttonStyle?: React.CSSProperties;
  className?: string;
} = {}) {
  const { locale, setLocale } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        id="language-switcher-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${LOCALE_LABELS[locale]}`}
        onClick={() => setOpen((v) => !v)}
        title={`Language: ${LOCALE_LABELS[locale]}`}
        className={className}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "5px 9px",
          borderRadius: 6,
          background: "var(--ui-bg-input)",
          border: "1px solid var(--ui-border)",
          color: "var(--ui-text-secondary)",
          fontSize: 11,
          fontWeight: 700,
          cursor: "pointer",
          transition: "all 0.15s",
          letterSpacing: "0.03em",
          height: 34,
          ...buttonStyle,
        }}
      >
        <Languages size={14} />
        <span style={{ textTransform: "uppercase" }}>{locale}</span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select language"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            minWidth: 140,
            background: "var(--ui-bg-card)",
            border: "1px solid var(--ui-border)",
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            padding: "5px",
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {(Object.entries(LOCALE_LABELS) as [Locale, string][]).map(
            ([code, label]) => (
              <button
                key={code}
                role="option"
                aria-selected={locale === code}
                onClick={() => {
                  setLocale(code);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 7,
                  border: "none",
                  background:
                    locale === code
                      ? "rgba(249,115,22,0.1)"
                      : "transparent",
                  color:
                    locale === code
                      ? "#f97316"
                      : "var(--ui-text-primary)",
                  fontSize: 12,
                  fontWeight: locale === code ? 700 : 500,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.12s",
                }}
              >
                {/* Flag emoji */}
                <span style={{ fontSize: 16, lineHeight: 1 }}>
                  {code === "en" ? "🇬🇧" : "🇮🇩"}
                </span>
                <span style={{ flex: 1 }}>{label}</span>
                {locale === code && (
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#f97316",
                      flexShrink: 0,
                    }}
                  />
                )}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
