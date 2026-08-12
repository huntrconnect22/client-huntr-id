import React, { useState, useEffect, useRef } from "react";
import {
  X,
  CreditCard,
  Building2,
  Loader2,
  CheckCircle2,
  Copy,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  Wallet,
} from "lucide-react";
import { initiatePayment, getPaymentStatus } from "../lib/api";

interface PaymentModalProps {
  invoice: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({ invoice, onClose, onSuccess }: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const isSuccess =
    paymentData &&
    (paymentData.status === "settlement" ||
      paymentData.status === "capture" ||
      paymentData.status === "paid");

  useEffect(() => {
    if (paymentData && paymentData.status === "pending") {
      if (!pollingRef.current) {
        pollingRef.current = setInterval(() => {
          checkStatus();
        }, 7000);
      }
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [paymentData]);

  const checkStatus = async () => {
    if (!paymentData || !paymentData.id || checking) return;
    setChecking(true);
    try {
      const res = await getPaymentStatus(paymentData.id);
      if (res && res.payment) {
        const status = res.payment.status;
        const isCurrentlySuccess =
          status === "settlement" || status === "capture" || status === "paid";
        setPaymentData(res.payment);
        if (isCurrentlySuccess) {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          setTimeout(() => {
            onSuccess();
          }, 2000);
        }
      }
    } catch (err: any) {
      console.error("Failed to check payment status", err);
      if (err.status === 404) {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        setError("Payment session expired or not found.");
      }
    } finally {
      setChecking(false);
    }
  };

  const handleSelectMethod = async (method: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await initiatePayment(invoice.id, method);
      setPaymentData(res.payment);
    } catch (err: any) {
      setError(err.message || "Failed to initiate payment");
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    { id: "bca_va", label: "BCA Virtual Account", sub: "m-BCA / ATM BCA" },
    { id: "bni_va", label: "BNI Virtual Account", sub: "BNI Mobile / ATM" },
    { id: "bri_va", label: "BRI Virtual Account", sub: "BRImo / ATM BRI" },
    { id: "mandiri_va", label: "Mandiri Bill", sub: "Livin' by Mandiri / ATM" },
    { id: "cimb_va", label: "CIMB Niaga Virtual Account", sub: "Octo Mobile / ATM" },
    { id: "permata_va", label: "Permata Virtual Account", sub: "Permata Mobile / ATM" },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
        padding: "16px",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          backgroundColor: "var(--ui-bg-card)",
          border: "1px solid var(--ui-border)",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "420px",
          maxHeight: "90vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px -12px rgba(0,0,0,0.35)",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 18px",
            borderBottom: "1px solid var(--ui-border)",
            position: "sticky",
            top: 0,
            backgroundColor: "var(--ui-bg-card)",
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                backgroundColor: "var(--huntr-orange)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Wallet size={16} color="#fff" />
            </div>
            <div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "var(--ui-text-primary)",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.2,
                }}
              >
                Huntr Pay
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--ui-text-muted)",
                  fontWeight: 500,
                  marginTop: "1px",
                }}
              >
                INV-{invoice.id.substring(0, 8).toUpperCase()}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "6px",
              border: "1px solid var(--ui-border)",
              backgroundColor: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--ui-text-muted)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--ui-bg-input)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--ui-text-primary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--ui-text-muted)";
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {!paymentData ? (
            <>
              {/* Fee Breakdown */}
              <div
                style={{
                  border: "1px solid var(--ui-border)",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                {/* Header row */}
                <div
                  style={{
                    padding: "9px 14px",
                    borderBottom: "1px solid var(--ui-border)",
                    backgroundColor: "var(--ui-bg-input)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "var(--ui-text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    Rincian Biaya
                  </span>
                </div>

                {/* Rows */}
                <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: "9px" }}>
                  <FeeRow
                    label="Total Pembelian Barang"
                    value={`IDR ${Number(invoice.base_amount || invoice.amount).toLocaleString("id-ID")}`}
                  />

                  {(Number(invoice.platform_fee) > 0 || Number(invoice.ppn_platform) > 0) && (
                    <FeeRow
                      label="Platform Fee + PPN"
                      value={`+ IDR ${(Number(invoice.platform_fee) + Number(invoice.ppn_platform)).toLocaleString("id-ID")}`}
                      valueColor="#f97316"
                      dot="#f97316"
                    />
                  )}

                  {Number(invoice.midtrans_fee) > 0 && (
                    <FeeRow
                      label="Admin Bank"
                      value={`+ IDR ${Number(invoice.midtrans_fee).toLocaleString("id-ID")}`}
                      valueColor="#3b82f6"
                      dot="#3b82f6"
                    />
                  )}

                  {Number(invoice.pph23) > 0 && (
                    <FeeRow
                      label="PPH 23 (2%)"
                      value={`- IDR ${Number(invoice.pph23).toLocaleString("id-ID")}`}
                      valueColor="#ef4444"
                      dot="#ef4444"
                    />
                  )}

                  {Number(invoice.ppn_fee) > 0 && (
                    <FeeRow
                      label="PPN 11%"
                      value={`+ IDR ${Number(invoice.ppn_fee).toLocaleString("id-ID")}`}
                      valueColor="#8b5cf6"
                      dot="#8b5cf6"
                    />
                  )}

                  {/* Divider */}
                  <div style={{ borderTop: "1px dashed var(--ui-border)", margin: "2px 0" }} />

                  {/* Total */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "var(--ui-text-secondary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Total Pembayaran
                    </span>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: "17px",
                          fontWeight: 800,
                          color: "var(--ui-text-primary)",
                          letterSpacing: "-0.02em",
                          lineHeight: 1.1,
                        }}
                      >
                        IDR {Number(invoice.total_amount || invoice.amount).toLocaleString("id-ID")}
                      </div>
                      <div
                        style={{
                          fontSize: "9px",
                          color: "var(--ui-text-muted)",
                          marginTop: "2px",
                          fontWeight: 500,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        Sudah termasuk semua biaya
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "var(--ui-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    padding: "0 2px",
                  }}
                >
                  Pilih Metode Pembayaran
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  {paymentMethods.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => !loading && handleSelectMethod(m.id)}
                      disabled={loading}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--ui-border-input)",
                        backgroundColor: "var(--ui-bg-input)",
                        cursor: loading ? "not-allowed" : "pointer",
                        opacity: loading ? 0.6 : 1,
                        transition: "border-color 0.15s ease, background-color 0.15s ease",
                        textAlign: "left",
                        width: "100%",
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--huntr-orange)";
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--ui-bg-card)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--ui-border-input)";
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--ui-bg-input)";
                      }}
                    >
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "6px",
                          border: "1px solid var(--ui-border)",
                          backgroundColor: "var(--ui-bg-card)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--huntr-orange)",
                          flexShrink: 0,
                        }}
                      >
                        <Building2 size={14} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "var(--ui-text-primary)",
                            lineHeight: 1.2,
                          }}
                        >
                          {m.label}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "var(--ui-text-muted)",
                            marginTop: "2px",
                          }}
                        >
                          {m.sub}
                        </div>
                      </div>

                      <ChevronRight size={14} color="var(--ui-text-muted)" style={{ flexShrink: 0 }} />
                    </button>
                  ))}
                </div>
              </div>

              {loading && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "11px",
                    borderRadius: "8px",
                    border: "1px solid var(--ui-border)",
                    backgroundColor: "var(--ui-bg-input)",
                  }}
                >
                  <Loader2 size={14} color="var(--huntr-orange)" style={{ animation: "spin 1s linear infinite" }} />
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--ui-text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Menghubungkan…
                  </span>
                </div>
              )}

              {error && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(239,68,68,0.25)",
                    backgroundColor: "rgba(239,68,68,0.06)",
                    color: "#ef4444",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  <AlertCircle size={13} style={{ flexShrink: 0 }} />
                  {error}
                </div>
              )}
            </>
          ) : (
            /* ── Payment Instruction View ── */
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Status indicator */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  border: `1px solid ${isSuccess ? "rgba(34,197,94,0.25)" : "rgba(249,115,22,0.25)"}`,
                  backgroundColor: isSuccess ? "rgba(34,197,94,0.05)" : "rgba(249,115,22,0.05)",
                }}
              >
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "8px",
                    backgroundColor: isSuccess ? "#22c55e" : "transparent",
                    border: isSuccess ? "none" : "2px solid var(--huntr-orange)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    color: isSuccess ? "#fff" : "var(--huntr-orange)",
                  }}
                >
                  {isSuccess ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <Loader2 size={17} style={{ animation: "spin 1s linear infinite" }} />
                  )}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: isSuccess ? "#22c55e" : "var(--huntr-orange)",
                      lineHeight: 1.2,
                    }}
                  >
                    {isSuccess ? "Pembayaran Diterima" : "Menunggu Pembayaran"}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--ui-text-muted)", marginTop: "2px" }}>
                    {isSuccess
                      ? "Transaksi berhasil dikonfirmasi."
                      : "Selesaikan pembayaran sesuai instruksi di bawah."}
                  </div>
                </div>
              </div>

              {/* VA Number Card */}
              {!isSuccess && paymentData.payment_method.includes("_va") && (
                <div
                  style={{
                    border: "1px solid var(--ui-border)",
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "9px 14px",
                      borderBottom: "1px solid var(--ui-border)",
                      backgroundColor: "var(--ui-bg-input)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "var(--ui-text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                      }}
                    >
                      Nomor VA — {paymentData.payment_method.split("_")[0].toUpperCase()}
                    </span>
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 700,
                        color: "var(--huntr-orange)",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        border: "1px solid rgba(249,115,22,0.3)",
                        backgroundColor: "rgba(249,115,22,0.08)",
                      }}
                    >
                      Pending
                    </span>
                  </div>

                  <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    {/* VA Number */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "11px 12px",
                        borderRadius: "6px",
                        border: "1px dashed var(--ui-border)",
                        backgroundColor: "var(--ui-bg-input)",
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          minWidth: 0,
                          fontSize: "18px",
                          fontWeight: 800,
                          color: "var(--huntr-orange)",
                          letterSpacing: "0.1em",
                          fontFamily: "monospace",
                          lineHeight: 1.2,
                          wordBreak: "break-all",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {paymentData.payment_info.va_number || paymentData.payment_info.bill_key}
                      </div>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            paymentData.payment_info.va_number || paymentData.payment_info.bill_key
                          )
                        }
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "5px 10px",
                          borderRadius: "5px",
                          border: "1px solid var(--huntr-orange)",
                          backgroundColor: copied ? "var(--huntr-orange)" : "transparent",
                          color: copied ? "#fff" : "var(--huntr-orange)",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          flexShrink: 0,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        <Copy size={11} />
                        {copied ? "Tersalin!" : "Salin"}
                      </button>
                    </div>

                    {/* Biller Code (Mandiri) */}
                    {paymentData.payment_method === "mandiri_va" &&
                      paymentData.payment_info.biller_code && (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            border: "1px solid var(--ui-border)",
                            backgroundColor: "var(--ui-bg-input)",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              color: "var(--ui-text-muted)",
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                            }}
                          >
                            Kode Biller
                          </span>
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: 700,
                              color: "var(--ui-text-primary)",
                              fontFamily: "monospace",
                              letterSpacing: "0.06em",
                            }}
                          >
                            {paymentData.payment_info.biller_code}
                          </span>
                        </div>
                      )}

                    {/* Info notice */}
                    <div
                      style={{
                        display: "flex",
                        gap: "7px",
                        padding: "8px 10px",
                        borderRadius: "6px",
                        backgroundColor: "rgba(249,115,22,0.04)",
                        border: "1px solid rgba(249,115,22,0.15)",
                      }}
                    >
                      <AlertCircle size={12} color="var(--huntr-orange)" style={{ flexShrink: 0, marginTop: "1px" }} />
                      <p style={{ fontSize: "11px", color: "var(--ui-text-muted)", lineHeight: 1.5, margin: 0 }}>
                        Transfer tepat sesuai nominal. Pembayaran diverifikasi otomatis dalam beberapa menit.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={isSuccess ? onSuccess : checkStatus}
                disabled={checking}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "11px 20px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: isSuccess ? "#22c55e" : "var(--huntr-orange)",
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: checking ? "not-allowed" : "pointer",
                  opacity: checking ? 0.8 : 1,
                  transition: "opacity 0.15s ease",
                  width: "100%",
                  letterSpacing: "0.02em",
                }}
                onMouseEnter={(e) => {
                  if (!checking)
                    (e.currentTarget as HTMLButtonElement).style.opacity = "0.88";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = checking ? "0.8" : "1";
                }}
              >
                {checking ? (
                  <>
                    <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                    Memeriksa Status…
                  </>
                ) : isSuccess ? (
                  "Kembali ke Dashboard"
                ) : (
                  <>
                    <RefreshCw size={14} />
                    Konfirmasi Pembayaran
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/* ── Helper: Fee Row ── */
function FeeRow({
  label,
  value,
  valueColor,
  dot,
}: {
  label: string;
  value: string;
  valueColor?: string;
  dot?: string;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {dot && (
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: dot,
              flexShrink: 0,
            }}
          />
        )}
        <span style={{ fontSize: "12px", color: "var(--ui-text-secondary)", fontWeight: 400 }}>
          {label}
        </span>
      </div>
      <span
        style={{
          fontSize: "12px",
          fontWeight: 600,
          color: valueColor || "var(--ui-text-primary)",
          flexShrink: 0,
        }}
      >
        {value}
      </span>
    </div>
  );
}
