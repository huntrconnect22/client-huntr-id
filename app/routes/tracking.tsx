import React, { useState, useEffect } from "react";
import { useLocation } from "react-router";
import {
  Search, Package, Truck, CheckCircle2, Clock, FileText,
  CreditCard, MapPin, Building, Calendar, Loader2,
  AlertCircle, RefreshCw, ExternalLink
} from "lucide-react";
import { publicTrackShipment } from "../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface TrackingStep {
  status: string;
  label: string;
  timestamp: string | null;
  completed: boolean;
  actor_name?: string;
  note?: string;
  tracking_numbers?: string[];
}

interface TrackingResult {
  po_number: string;
  current_status: string;
  current_label: string;
  vendor_name: string;
  buyer_name: string;
  order_date: string;
  tracking_numbers: string[];
  timeline: TrackingStep[];
}

// ─── Step Config ──────────────────────────────────────────────────────────────
const STEP_CONFIG: Record<string, { icon: React.FC<any>; color: string; bg: string }> = {
  issued:     { icon: FileText,     color: "#f59e0b", bg: "rgba(245,158,11,0.15)"  },
  confirmed:  { icon: CheckCircle2, color: "#f97316", bg: "rgba(249,115,22,0.15)"  },
  paid:       { icon: CreditCard,   color: "#3b82f6", bg: "rgba(59,130,246,0.15)"  },
  packing:    { icon: Package,      color: "#8b5cf6", bg: "rgba(139,92,246,0.15)"  },
  in_transit: { icon: Truck,        color: "#06b6d4", bg: "rgba(6,182,212,0.15)"   },
  delivered:  { icon: CheckCircle2, color: "#22c55e", bg: "rgba(34,197,94,0.15)"   },
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status, label }: { status: string; label: string }) => {
  const cfg = STEP_CONFIG[status] ?? STEP_CONFIG.issued;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40`,
    }}>
      <cfg.icon size={11} /> {label}
    </span>
  );
};

// ─── Timeline Step (compact) ──────────────────────────────────────────────────
const TimelineStep = ({ step, isLast }: { step: TrackingStep; isLast: boolean }) => {
  const cfg = STEP_CONFIG[step.status] ?? STEP_CONFIG.issued;
  const Icon = cfg.icon;

  return (
    <div style={{ display: "flex", gap: 12, position: "relative" }}>
      {/* Vertical connector */}
      {!isLast && (
        <div style={{
          position: "absolute", left: 15, top: 32, width: 2, bottom: -8,
          background: step.completed ? `${cfg.color}35` : "rgba(255,255,255,0.05)",
        }} />
      )}

      {/* Circle */}
      <div style={{
        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
        background: step.completed ? cfg.color : "rgba(255,255,255,0.04)",
        border: `2px solid ${step.completed ? cfg.color : "rgba(255,255,255,0.08)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: step.completed ? `0 0 0 3px ${cfg.color}18` : "none",
        position: "relative", zIndex: 1,
        transition: "all 0.3s ease",
      }}>
        <Icon size={13} color={step.completed ? "#fff" : "rgba(255,255,255,0.18)"} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : 18, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 5 }}>
          <span style={{
            fontSize: 13, fontWeight: 700,
            color: step.completed ? "#f1f5f9" : "rgba(255,255,255,0.22)",
          }}>
            {step.label}
          </span>
          {step.completed && (
            <span style={{
              fontSize: 9, fontWeight: 800, padding: "1px 6px", borderRadius: 4,
              background: cfg.bg, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.06em",
            }}>Done</span>
          )}
        </div>

        {step.timestamp && (
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1, fontWeight: 500 }}>
            {new Date(step.timestamp).toLocaleString("en-US", {
              year: "numeric", month: "short", day: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
            {step.actor_name && (
              <span style={{ color: cfg.color, marginLeft: 5, fontWeight: 600 }}>
                · {step.actor_name}
              </span>
            )}
          </div>
        )}

        {step.note && (
          <div style={{
            marginTop: 4, fontSize: 11, color: "rgba(255,255,255,0.4)",
            padding: "3px 8px", background: "rgba(255,255,255,0.03)", borderRadius: 6,
            borderLeft: `2px solid ${cfg.color}80`, display: "inline-block",
          }}>
            {step.note}
          </div>
        )}

        {step.tracking_numbers && step.tracking_numbers.length > 0 && (
          <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
            {step.tracking_numbers.map((resi, i) => (
              <span key={i} style={{
                fontSize: 10, fontWeight: 700, fontFamily: "monospace",
                padding: "2px 8px", borderRadius: 6,
                background: "rgba(6,182,212,0.1)", color: "#06b6d4",
                border: "1px solid rgba(6,182,212,0.2)",
              }}>
                <Truck size={11} style={{ display: "inline", marginRight: 3, verticalAlign: "middle" }} />{resi}
              </span>
            ))}
          </div>
        )}

        {!step.completed && (
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.18)", marginTop: 2, fontStyle: "italic" }}>
            Pending…
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TrackingPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const [poInput, setPoInput]     = useState(params.get("po_number") ?? "");
  const [resiInput, setResiInput] = useState(params.get("tracking_number") ?? "");
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState<TrackingResult | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [searched, setSearched]   = useState(false);

  useEffect(() => {
    const pn = params.get("po_number");
    const tn = params.get("tracking_number");
    if (pn || tn) handleSearch(pn ?? undefined, tn ?? undefined);
  }, []);

  const handleSearch = async (pn?: string, tn?: string) => {
    const p = pn ?? poInput.trim();
    const t = tn ?? resiInput.trim();
    if (!p && !t) { setError("Please enter a PO Number or Tracking Number."); return; }
    setLoading(true); setError(null); setResult(null); setSearched(true);
    try {
      const data = await publicTrackShipment({ po_number: p || undefined, tracking_number: t || undefined });
      setResult(data as TrackingResult);
    } catch (err: any) {
      setError(err.message || "Shipment not found. Please check your PO number or tracking number.");
    } finally {
      setLoading(false);
    }
  };

  const completedSteps = result?.timeline.filter(s => s.completed).length ?? 0;
  const totalSteps     = result?.timeline.length ?? 6;
  const progressPct    = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* ── Header ── */}
      <header style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(15,23,42,0.8)", backdropFilter: "blur(20px)",
        position: "sticky", top: 0, zIndex: 100, padding: "12px 24px",
      }}>
        <div style={{ maxWidth: 820, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: "linear-gradient(135deg,#f97316,#f59e0b)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 3px 10px rgba(249,115,22,0.3)",
            }}>
              <Truck size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#f1f5f9", lineHeight: 1.1 }}>huntr.id</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Order Tracking</div>
            </div>
          </div>
          <a href="/login" style={{
            fontSize: 11, fontWeight: 700, color: "#fb923c",
            textDecoration: "none", display: "flex", alignItems: "center", gap: 4,
            padding: "5px 12px", borderRadius: 8,
            background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)",
          }}>
            Login <ExternalLink size={11} />
          </a>
        </div>
      </header>

      {/* ── Search Section ── */}
      <section style={{ padding: "32px 24px 24px", background: "linear-gradient(180deg, rgba(249,115,22,0.03) 0%, transparent 100%)" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          {/* Pill badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px",
            borderRadius: 20, background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.18)",
            fontSize: 10, fontWeight: 800, color: "#f97316", textTransform: "uppercase",
            letterSpacing: "0.08em", marginBottom: 14,
          }}>
            <MapPin size={10} /> Real-Time Tracking
          </div>

          <h1 style={{
            fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 900, color: "#f1f5f9",
            margin: "0 0 6px", lineHeight: 1.2,
            background: "linear-gradient(135deg,#f1f5f9,#94a3b8)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Track Your Order
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 20px", fontWeight: 500 }}>
            Enter your PO Number or Tracking Number (Resi) to see live delivery status.
          </p>

          {/* Search form */}
          <div style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 18, padding: 16, backdropFilter: "blur(20px)",
          }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {/* PO input */}
              <div style={{ flex: 1, minWidth: 160, position: "relative" }}>
                <FileText size={14} color="rgba(255,255,255,0.25)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  type="text" placeholder="PO Number"
                  value={poInput} onChange={e => setPoInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                  style={{
                    width: "100%", padding: "10px 12px 10px 36px",
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)",
                    borderRadius: 12, color: "#f1f5f9", fontSize: 13, outline: "none",
                    fontFamily: "inherit", boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", color: "rgba(255,255,255,0.2)", fontSize: 11, fontWeight: 700 }}>OR</div>

              {/* Resi input */}
              <div style={{ flex: 1, minWidth: 160, position: "relative" }}>
                <Truck size={14} color="rgba(255,255,255,0.25)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <input
                  type="text" placeholder="Tracking No. / Resi"
                  value={resiInput} onChange={e => setResiInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                  style={{
                    width: "100%", padding: "10px 12px 10px 36px",
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)",
                    borderRadius: 12, color: "#f1f5f9", fontSize: 13, outline: "none",
                    fontFamily: "inherit", boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Button */}
              <button
                onClick={() => handleSearch()} disabled={loading}
                style={{
                  padding: "10px 20px", borderRadius: 12, border: "none",
                  background: "linear-gradient(135deg,#f97316,#f59e0b)",
                  color: "#fff", fontWeight: 800, fontSize: 13, cursor: loading ? "wait" : "pointer",
                  display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
                  boxShadow: "0 3px 14px rgba(249,115,22,0.3)",
                }}
              >
                {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Search size={14} />}
                {loading ? "…" : "Track"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Results ── */}
      <section style={{ maxWidth: 820, margin: "0 auto", padding: "0 24px 48px" }}>
        {/* Error */}
        {error && (
          <div style={{
            padding: "12px 16px", borderRadius: 12,
            background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)",
            color: "#f87171", display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
          }}>
            <AlertCircle size={15} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>{error}</span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 18, padding: 24, display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
          }}>
            <Loader2 size={20} color="#f97316" style={{ animation: "spin 1s linear infinite" }} />
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: 600 }}>Looking up shipment…</span>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Summary card */}
            <div style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 20, padding: 20, backdropFilter: "blur(20px)",
            }}>
              {/* PO + status */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>Purchase Order</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#f59e0b", letterSpacing: "-0.5px" }}>{result.po_number}</div>
                </div>
                <StatusBadge status={result.current_status} label={result.current_label} />
              </div>

              {/* Meta grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginBottom: 16 }}>
                {[
                  { icon: Building, label: "Vendor",     value: result.vendor_name, color: "#f97316" },
                  { icon: Building, label: "Buyer",      value: result.buyer_name,  color: "#3b82f6" },
                  { icon: Calendar, label: "Order Date", value: result.order_date,  color: "#8b5cf6" },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} style={{
                    padding: "10px 12px", borderRadius: 12,
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>{label}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <Icon size={11} color={color} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9" }}>{value}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tracking numbers */}
              {result.tracking_numbers.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Tracking No. / Resi</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {result.tracking_numbers.map((resi, i) => (
                      <span key={i} style={{
                        fontSize: 12, fontWeight: 700, fontFamily: "monospace",
                        padding: "4px 12px", borderRadius: 8,
                        background: "rgba(6,182,212,0.09)", color: "#06b6d4",
                        border: "1px solid rgba(6,182,212,0.22)",
                      }}>
                        <Truck size={12} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />{resi}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress bar */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Progress</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#f59e0b" }}>{progressPct}% · {completedSteps}/{totalSteps} steps</span>
                </div>
                <div style={{ height: 5, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 4, width: `${progressPct}%`,
                    background: "linear-gradient(90deg,#f97316,#22c55e)", transition: "width 0.6s ease",
                  }} />
                </div>
              </div>
            </div>

            {/* Timeline card */}
            <div style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 20, padding: 20, backdropFilter: "blur(20px)",
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#f1f5f9", marginBottom: 18, display: "flex", alignItems: "center", gap: 7 }}>
                <Clock size={14} color="#f59e0b" /> Delivery Timeline
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {result.timeline.map((step, i) => (
                  <TimelineStep key={step.status} step={step} isLast={i === result.timeline.length - 1} />
                ))}
              </div>
            </div>

            {/* Search again */}
            <div style={{ textAlign: "center" }}>
              <button
                onClick={() => { setResult(null); setPoInput(""); setResiInput(""); setSearched(false); setError(null); }}
                style={{
                  background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10,
                  padding: "8px 18px", color: "rgba(255,255,255,0.35)", fontSize: 12, fontWeight: 700,
                  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
                }}
              >
                <RefreshCw size={12} /> Search Another Shipment
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !result && !error && !searched && (
          <div style={{ textAlign: "center", padding: "36px 0" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "rgba(249,115,22,0.07)", border: "1px solid rgba(249,115,22,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px",
            }}>
              <Truck size={24} color="rgba(249,115,22,0.4)" />
            </div>
            <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 13, margin: 0, fontWeight: 500 }}>
              Enter a PO Number or Tracking Number above to start tracking
            </p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "16px 24px", textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.15)", fontWeight: 500 }}>
          © {new Date().getFullYear()} huntr.id — Procurement & Supply Chain Platform
        </p>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        input::placeholder { color: rgba(255,255,255,0.2); }
        input:focus { border-color: rgba(249,115,22,0.45) !important; box-shadow: 0 0 0 3px rgba(249,115,22,0.08); }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
