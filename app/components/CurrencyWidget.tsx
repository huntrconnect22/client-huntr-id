import React, { useEffect, useMemo, useState } from "react";
import { Banknote, RefreshCw, TrendingUp } from "lucide-react";
import { fetchLatestCurrencyRates } from "../lib/api/currency";

const STORAGE_KEY = "huntr_currency_base";
const BASE_OPTIONS = ["IDR", "USD", "EUR", "SGD", "MYR"];
const TARGETS = ["IDR", "USD", "EUR", "SGD", "MYR", "JPY"];

export default function CurrencyWidget({ embedded = false }: { embedded?: boolean }) {
  const [baseCurrency, setBaseCurrency] = useState("IDR");
  const [rates, setRates] = useState<Record<string, { code: string; value: number }>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && BASE_OPTIONS.includes(stored)) {
      setBaseCurrency(stored);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchLatestCurrencyRates(baseCurrency, TARGETS.filter((item) => item !== baseCurrency));
        if (cancelled) return;
        setRates(result.rates);
        setUpdatedAt(result.meta?.last_updated_at || null);
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || "Failed to load currency data.");
        setRates({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    localStorage.setItem(STORAGE_KEY, baseCurrency);

    return () => {
      cancelled = true;
    };
  }, [baseCurrency, refreshTick]);

  useEffect(() => {
    if (!loading && !error && Object.keys(rates).length > 0) {
      window.dispatchEvent(
        new CustomEvent("currency-update", {
          detail: { baseCurrency, rates },
        })
      );
    }
  }, [baseCurrency, rates, loading, error]);

  const displayRates = useMemo(() => {
    return TARGETS
      .filter((code) => code !== baseCurrency)
      .map((code) => rates[code])
      .filter(Boolean)
      .slice(0, 4);
  }, [rates, baseCurrency]);

  return (
    <div
      style={{
        margin: embedded ? 0 : "0 10px 14px",
        padding: 16,
        borderRadius: 4,
        border: "1px solid var(--ui-border)",
        background: "var(--ui-bg-card)",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: 4, background: "rgba(59,130,246,0.16)", display: "flex", alignItems: "center", justifyContent: "center", color: "#60a5fa", flexShrink: 0 }}>
            <Banknote size={16} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--ui-text-primary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Currency</div>
            <div style={{ fontSize: 10, color: "var(--ui-text-muted)" }}>Latest FX from currencyapi.com</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setRefreshTick((value) => value + 1)}
          style={{
            width: 30,
            height: 30,
            borderRadius: 4,
            border: "1px solid var(--ui-border)",
            background: "var(--ui-bg-card)",
            color: "var(--ui-text-primary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="Refresh currency rates"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={{ display: "block", fontSize: 10, fontWeight: 800, color: "var(--ui-text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Base currency
        </label>
        <select
          value={baseCurrency}
          onChange={(e) => setBaseCurrency(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 4,
            border: "1px solid var(--ui-border)",
            background: "var(--ui-bg-card)",
            color: "var(--ui-text-primary)",
            fontWeight: 600,
            outline: "none",
          }}
        >
          {BASE_OPTIONS.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>

      {loading && (
        <div style={{ fontSize: 12, color: "var(--ui-text-muted)", padding: "8px 0" }}>
          Loading currency rates...
        </div>
      )}

      {!loading && error && (
        <div style={{ fontSize: 12, color: "#f87171", lineHeight: 1.4, padding: "8px 0" }}>
          {error}
        </div>
      )}

      {!loading && !error && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
            {displayRates.length === 0 ? (
              <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "var(--ui-text-muted)" }}>No rates available.</div>
            ) : (
              displayRates.map((rate) => (
                <RateItem
                  key={rate.code}
                  code={rate.code}
                  value={rate.value}
                  baseCurrency={baseCurrency}
                />
              ))
            )}
          </div>

          <div style={{ fontSize: 10, color: "var(--ui-text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
            <TrendingUp size={12} /> Updated {updatedAt ? new Date(updatedAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "just now"}
          </div>
        </div>
      )}
    </div>
  );
}

function RateItem({ code, value, baseCurrency }: { code: string; value: number; baseCurrency: string }) {
  return (
    <div
      style={{
        padding: 10,
        borderRadius: 12,
        background: "var(--ui-bg-card)",
        border: "1px solid var(--ui-border)",
      }}
    >
      <div style={{ fontSize: 10, color: "var(--ui-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
        {baseCurrency} / {code}
      </div>
      <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ui-text-primary)", marginTop: 4 }}>
        {value.toFixed(4)}
      </div>
    </div>
  );
}
