import React from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { type SignatureMeta, buildSignatureQrPayload } from "../types";
import { SignatureQrInline } from "./SignatureQrInline";

export const SignatureButtons = ({
  docType,
  docId,
  handedBySigned,
  receivedBySigned,
  handedByMeta,
  receivedByMeta,
  onSign,
  processingId,
  user,
  company,
  generateQR,
}: {
  docType: 'bast' | 'do';
  docId: string;
  handedBySigned: boolean;
  receivedBySigned: boolean;
  handedByMeta?: SignatureMeta;
  receivedByMeta?: SignatureMeta;
  onSign: (type: 'bast' | 'do', id: string, role: 'handed-by' | 'received-by') => Promise<void>;
  processingId: string | null;
  user: any;
  company: any;
  generateQR: (t: string) => Promise<string | null>;
}) => {
  const isManager = user?.role === 'manager' || company?.owner_id === user?.id;
  const isVendor = company.type === 'vendor';
  const isBuyer = company.type === 'buyer';

  const renderButton = (
    role: 'handed-by' | 'received-by',
    label: string,
    signed: boolean,
    isYourParty: boolean,
    meta?: SignatureMeta
  ) => (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 11, color: "var(--ui-text-muted)", fontWeight: 600, textTransform: "uppercase", textAlign: "center" }}>{label}</div>
      {signed ? (
        <div style={{
          padding: "10px 12px",
          borderRadius: 10,
          background: "rgba(34,197,94,0.1)",
          border: "1px solid rgba(34,197,94,0.3)",
          color: "#22c55e",
          fontSize: 12,
          fontWeight: 600,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <CheckCircle2 size={14} />
            Signed
          </div>
          {meta?.name && (
            <div style={{ fontSize: 11, color: "var(--ui-text-primary)", fontWeight: 700 }}>{meta.name}</div>
          )}
          {meta?.position && (
            <div style={{ fontSize: 10, color: "var(--ui-text-muted)", fontWeight: 600 }}>{meta.position}</div>
          )}
          {meta?.signed_at && (
            <div style={{ fontSize: 10, color: "var(--ui-text-muted)", fontWeight: 600 }}>
              {new Date(meta.signed_at).toLocaleString()}
            </div>
          )}
          <SignatureQrInline
            payload={buildSignatureQrPayload(docType, docId, role, meta)}
            generateQR={generateQR}
          />
        </div>
      ) : (
        <button
          onClick={() => onSign(docType, docId, role)}
          disabled={processingId === docId || !isYourParty || !isManager}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            background: isYourParty && isManager ? "var(--huntr-orange)" : "var(--ui-bg-input)",
            border: "none",
            color: isYourParty && isManager ? "#fff" : "var(--ui-text-muted)",
            fontSize: 11,
            fontWeight: 600,
            textAlign: "center",
            cursor: isYourParty && isManager ? "pointer" : "not-allowed",
            opacity: isYourParty && isManager ? 1 : 0.5,
            transition: "all 0.2s ease"
          }}
        >
          {processingId === docId ? <Loader2 size={14} className="animate-spin" /> : (isYourParty && isManager ? "Sign" : "-")}
        </button>
      )}
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
      {renderButton('handed-by', isVendor ? 'Vendor (You)' : 'Vendor', handedBySigned, isVendor, handedByMeta)}
      {renderButton('received-by', isBuyer ? 'Buyer (You)' : 'Buyer', receivedBySigned, isBuyer, receivedByMeta)}
    </div>
  );
};


