import React, { useState, useEffect } from "react";

export const SignatureQrInline = ({
  payload,
  generateQR,
}: {
  payload: string;
  generateQR: (t: string) => Promise<string | null>;
}) => {
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    generateQR(payload).then(url => setQrUrl(url));
  }, [payload, generateQR]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, marginTop: 8 }}>
      {qrUrl ? (
        <img
          src={qrUrl}
          alt="Signature QR"
          style={{ width: 88, height: 88, borderRadius: 8, border: "1px solid var(--ui-border-input)", background: "var(--ui-bg-card)", padding: 4 }}
        />
      ) : (
        <div style={{ width: 88, height: 88, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ui-text-muted)", fontSize: 10 }}>
          QR...
        </div>
      )}
      <div style={{ fontSize: 10, color: "var(--ui-text-muted)", fontWeight: 600 }}>Scan to verify signature</div>
    </div>
  );
};


