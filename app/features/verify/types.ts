import { ReceiptText, Truck, ClipboardList } from "lucide-react";
import type React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SignatureEntry {
  role: string;
  label: string;
  signer_name?: string;
  signer_position?: string;
  signed_at?: string;
  is_signed: boolean;
}

export interface VerifyResult {
  valid: boolean;
  doc_type: "invoice" | "do" | "bast";
  doc_number: string;
  doc_label: string;
  issued_at?: string;
  status?: string;
  tracking_number?: string;
  vendor_name: string;
  buyer_name: string;
  signatures: SignatureEntry[];
}

// ─── Doc Config ───────────────────────────────────────────────────────────────
export const DOC_CONFIG: Record<
  string,
  { icon: React.FC<any>; color: string; accent: string; bg: string }
> = {
  invoice: { icon: ReceiptText,   color: "#f59e0b", accent: "#fef3c7", bg: "rgba(245,158,11,0.08)" },
  do:      { icon: Truck,         color: "#3b82f6", accent: "#dbeafe", bg: "rgba(59,130,246,0.08)"  },
  bast:    { icon: ClipboardList, color: "#8b5cf6", accent: "#ede9fe", bg: "rgba(139,92,246,0.08)"  },
};
