import React, { useState, useEffect } from "react";
import { QrCode } from "lucide-react";

export const QRCodeDisplay = ({ text, generateQR }: { text: string; generateQR: (t: string) => Promise<string | null> }) => {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (showQR) {
      generateQR(text).then(url => setQrUrl(url));
    }
  }, [showQR, text, generateQR]);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setShowQR(!showQR)}
        style={{
          padding: "6px 10px",
          borderRadius: 8,
          background: "var(--ui-bg-input)",
          border: "1px solid var(--ui-border-input)",
          color: "var(--ui-text-secondary)",
          fontSize: 11,
          fontWeight: 700,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 4,
          transition: "all 0.2s ease"
        }}
      >
        <QrCode size={14} />
        QR Code
      </button>
      {showQR && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: 8,
            padding: 12,
            background: "var(--ui-bg-card)",
            borderRadius: 12,
            border: "1px solid var(--ui-border-input)",
            zIndex: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)"
          }}
        >
          {qrUrl ? (
            <img src={qrUrl} alt="QR Code" style={{ width: 128, height: 128 }} />
          ) : (
            <div style={{ width: 128, height: 128, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ui-text-muted)", fontSize: 12 }}>
              Generating...
            </div>
          )}
        </div>
      )}
    </div>
  );
};


