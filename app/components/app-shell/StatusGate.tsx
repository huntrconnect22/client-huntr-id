import React from "react";
import { useNavigate } from "react-router";
import { Building2 } from "lucide-react";

interface StatusGateProps {
  status: "rejected" | "pending";
  companyName: string;
  verificationNotes?: string;
  onSwitchCompany: () => void;
}

export const StatusGate: React.FC<StatusGateProps> = ({
  status,
  companyName,
  verificationNotes,
  onSwitchCompany,
}) => {
  const navigate = useNavigate();

  if (status === "rejected") {
    return (
      <div
        className="huntr-rejected-gate"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          textAlign: "center",
          background: "var(--ui-bg-card)",
          border: "1px solid var(--ui-border)",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          gap: "20px",
          padding: "48px 32px",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "18px",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ef4444",
          }}
        >
          <Building2 size={36} />
        </div>
        <div style={{ maxWidth: 460 }}>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#ef4444",
              margin: "0 0 8px",
              letterSpacing: "-0.3px",
            }}
          >
            Pendaftaran Perusahaan Ditolak
          </h2>
          <p
            style={{
              fontSize: "13px",
              color: "var(--ui-text-secondary)",
              lineHeight: "1.6",
              margin: 0,
            }}
          >
            Workspace untuk <strong>{companyName}</strong> ditolak oleh tim
            admin.
            {verificationNotes
              ? ` Alasan: "${verificationNotes}"`
              : " Silakan periksa kembali data legalitas dan daftarkan ulang profil perusahaan Anda."}
          </p>
        </div>
        <div
          className="huntr-rejected-gate-actions"
          style={{ display: "flex", gap: "10px" }}
        >
          <button
            onClick={() => navigate("/company")}
            style={{
              padding: "10px 22px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              border: "none",
              color: "#fff",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(239,68,68,0.25)",
            }}
          >
            Lihat Detail Verifikasi
          </button>
          <button
            onClick={onSwitchCompany}
            style={{
              padding: "10px 22px",
              borderRadius: "10px",
              background: "var(--ui-bg-input)",
              border: "1px solid var(--ui-border)",
              color: "var(--ui-text-secondary)",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Ganti Perusahaan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="huntr-pending-gate"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        textAlign: "center",
        background: "var(--ui-bg-card)",
        border: "1px solid var(--ui-border)",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        gap: "20px",
        padding: "48px 32px",
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "18px",
          background: "rgba(251, 191, 36, 0.1)",
          border: "1px solid rgba(251, 191, 36, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fbbf24",
        }}
      >
        <Building2
          size={36}
          style={{ animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }}
        />
      </div>
      <div style={{ maxWidth: 460 }}>
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "var(--ui-text-primary)",
            margin: "0 0 8px",
            letterSpacing: "-0.3px",
          }}
        >
          Verifikasi Perusahaan Pending
        </h2>
        <p
          style={{
            fontSize: "13px",
            color: "var(--ui-text-secondary)",
            lineHeight: "1.6",
            margin: 0,
          }}
        >
          Workspace untuk <strong>{companyName}</strong> sedang dalam proses
          review oleh tim admin. Semua transaksi, pembuatan RFQ, upload dokumen,
          dan manajemen katalog dinonaktifkan sementara hingga akun Anda
          disetujui.
        </p>
      </div>
      <div className="huntr-pending-gate-actions">
        <button
          onClick={() => navigate("/company")}
          style={{
            padding: "10px 22px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #f97316, #f59e0b)",
            border: "none",
            color: "#fff",
            fontWeight: 600,
            fontSize: "13px",
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(249,115,22,0.25)",
          }}
        >
          View Verification Status
        </button>
        <button
          onClick={onSwitchCompany}
          style={{
            padding: "10px 22px",
            borderRadius: "10px",
            background: "var(--ui-bg-input)",
            border: "1px solid var(--ui-border)",
            color: "var(--ui-text-secondary)",
            fontWeight: 600,
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          Ganti Perusahaan
        </button>
      </div>
    </div>
  );
};
