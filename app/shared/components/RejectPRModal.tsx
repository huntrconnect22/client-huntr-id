import { Surface as HuntrSurface } from "~/shared/ui/Surface";
import { Button as HuntrButton } from "~/shared/ui/Button";
import { Textarea as HuntrTextarea } from "~/shared/ui/Fields";
import React, { useEffect, useRef, useState } from "react";
import { AlertTriangle, X, XCircle, Loader2 } from "lucide-react";

interface RejectPRModalProps {
  prTitle?: string;
  prId?: string;
  onConfirm: (reason: string) => Promise<void> | void;
  onClose: () => void;
  minLength?: number;
}

export function RejectPRModal({
  prTitle,
  prId,
  onConfirm,
  onClose,
  minLength = 10,
}: RejectPRModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const MAX = 500;

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < minLength) {
      setError(`Alasan minimal ${minLength} karakter.`);
      textareaRef.current?.focus();
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onConfirm(reason.trim());
      onClose();
    } catch (err: any) {
      setError(err?.message || "Gagal melakukan reject. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const isOver = reason.length > MAX;
  const isTooShort = reason.trim().length < minLength && reason.length > 0;
  const isValid = reason.trim().length >= minLength && !isOver;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
      }}
    >
      <style>{`
        @keyframes rprSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .rpr-textarea {
          width: 100%; box-sizing: border-box; resize: vertical; min-height: 110px;
          padding: 12px 14px; border-radius: 12px; font-size: 13px; line-height: 1.6;
          font-family: inherit; background: var(--ui-bg-input); color: var(--ui-text-primary);
          border: 1.5px solid var(--ui-border-input); outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .rpr-textarea:focus {
          border-color: rgba(239,68,68,0.5);
          box-shadow: 0 0 0 4px rgba(239,68,68,0.08);
        }
        .rpr-textarea.rpr-err { border-color: rgba(239,68,68,0.6); }
        .rpr-textarea::placeholder { color: var(--ui-text-muted); opacity: 0.6; }
        .rpr-btn-cancel {
          flex: 1; padding: 11px 0; border-radius: 12px; font-size: 13px; font-weight: 700;
          background: var(--ui-bg-input); border: 1.5px solid var(--ui-border);
          color: var(--ui-text-secondary); cursor: pointer; transition: all 0.15s;
        }
        .rpr-btn-cancel:hover { color: var(--ui-text-primary); }
        .rpr-btn-reject {
          flex: 2; padding: 11px 0; border-radius: 12px; font-size: 13px; font-weight: 800;
          background: linear-gradient(135deg, #ef4444, #dc2626); border: none; color: #fff;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 7px;
          box-shadow: 0 4px 14px rgba(239,68,68,0.3); transition: all 0.2s;
        }
        .rpr-btn-reject:hover:not(:disabled) {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          box-shadow: 0 6px 20px rgba(239,68,68,0.4);
          transform: translateY(-1px);
        }
        .rpr-btn-reject:disabled {
          background: var(--ui-bg-input); box-shadow: none;
          color: var(--ui-text-muted); cursor: not-allowed; transform: none;
        }
      `}</style>

      <HuntrSurface style={{
        background: "var(--ui-bg-card)", border: "1px solid var(--ui-border)",
        borderRadius: 20, boxShadow: "0 28px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(239,68,68,0.08)",
        width: "100%", maxWidth: 460,
        animation: "rprSlideUp 0.22s ease", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px 18px", borderBottom: "1px solid var(--ui-border)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12, flexShrink: 0,
              background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <AlertTriangle size={20} color="#ef4444" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "var(--ui-text-primary)", lineHeight: 1.2 }}>
                Tolak Purchase Request
              </div>
              {(prId || prTitle) && (
                <div style={{ fontSize: 12, color: "var(--ui-text-muted)", marginTop: 3, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  {prId && (
                    <span style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", padding: "1px 7px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                      #{prId}
                    </span>
                  )}
                  {prTitle && (
                    <span style={{ maxWidth: 230, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {prTitle}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <HuntrButton onClick={onClose} style={{
            background: "var(--ui-bg-input)", border: "1px solid var(--ui-border)",
            borderRadius: 8, width: 30, height: 30, cursor: "pointer", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--ui-text-muted)",
          }}>
            <X size={14} />
          </HuntrButton>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Warning */}
          <div style={{
            padding: "10px 14px", borderRadius: 10,
            background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
            display: "flex", alignItems: "flex-start", gap: 9,
          }}>
            <XCircle size={14} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 12, color: "#ef4444", lineHeight: 1.5 }}>
              PR akan ditolak dan pemohon akan mendapat notifikasi alasan penolakan.
            </span>
          </div>

          {/* Textarea */}
          <div>
            <label htmlFor="rpr-reason" style={{
              display: "block", fontSize: 11, fontWeight: 700,
              color: "var(--ui-text-muted)", textTransform: "uppercase",
              letterSpacing: "0.07em", marginBottom: 8,
            }}>
              Alasan Penolakan <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <HuntrTextarea
              id="rpr-reason"
              ref={textareaRef}
              className={`rpr-textarea${(error || isTooShort || isOver) ? " rpr-err" : ""}`}
              value={reason}
              onChange={(e) => { setReason(e.target.value); if (error) setError(null); }}
              placeholder="Jelaskan alasan penolakan PR ini secara singkat dan jelas..."
              maxLength={MAX + 10}
              disabled={loading}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
              {error ? (
                <span style={{ fontSize: 11, fontWeight: 600, color: "#ef4444" }}>⚠ {error}</span>
              ) : isTooShort ? (
                <span style={{ fontSize: 11, color: "var(--ui-text-muted)" }}>Minimal {minLength} karakter ({reason.trim().length}/{minLength})</span>
              ) : isValid ? (
                <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 600 }}>✓ Alasan valid</span>
              ) : (
                <span style={{ fontSize: 11, color: "var(--ui-text-muted)" }}>Minimal {minLength} karakter</span>
              )}
              <span style={{ fontSize: 11, fontWeight: 600, color: isOver ? "#ef4444" : reason.length > MAX - 50 ? "#f97316" : "var(--ui-text-muted)" }}>
                {reason.length}/{MAX}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            <HuntrButton type="button" className="rpr-btn-cancel" onClick={onClose} disabled={loading}>
              Batal
            </HuntrButton>
            <HuntrButton type="submit" className="rpr-btn-reject" disabled={loading || !isValid}>
              {loading
                ? <><Loader2 size={14} className="animate-spin" /> Menolak...</>
                : <><XCircle size={14} /> Tolak PR</>
              }
            </HuntrButton>
          </div>
        </form>
      </HuntrSurface>
    </div>
  );
}
