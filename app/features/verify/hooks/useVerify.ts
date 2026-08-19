import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { apiGet } from "../../../lib/client";
import type { VerifyResult } from "../types";

export function useVerify() {
  const navigate = useNavigate();

  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState<VerifyResult | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanError, setScanError]     = useState<string | null>(null);

  const verify = useCallback(async (type: string, id: string, role?: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const qs = new URLSearchParams({ type, id, ...(role ? { role } : {}) });
      const data = await apiGet<VerifyResult>(`/api/verify?${qs}`);
      setResult(data);
    } catch (err: any) {
      setError(err.message ?? "Document not found or verification failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleScan = useCallback((text: string) => {
    setShowScanner(false);
    setScanError(null);

    try {
      // Try JSON payload
      let parsed: any = null;
      try { parsed = JSON.parse(text); } catch (_) {}

      if (parsed?.doc_type && parsed?.doc_id) {
        const t = parsed.doc_type;
        const i = parsed.doc_id;
        const r = parsed.role ?? "";
        navigate(
          `/verify?type=${encodeURIComponent(t)}&id=${encodeURIComponent(i)}${r ? `&role=${encodeURIComponent(r)}` : ""}`,
          { replace: true },
        );
        verify(t, i, r);
        return;
      }

      // Try URL
      let urlObj: URL | null = null;
      try { urlObj = new URL(text); } catch (_) {}

      if (urlObj?.pathname.includes("/verify")) {
        const t = urlObj.searchParams.get("type") ?? "";
        const i = urlObj.searchParams.get("id") ?? "";
        const r = urlObj.searchParams.get("role") ?? "";
        if (t && i) {
          navigate(
            `/verify?type=${encodeURIComponent(t)}&id=${encodeURIComponent(i)}${r ? `&role=${encodeURIComponent(r)}` : ""}`,
            { replace: true },
          );
          verify(t, i, r);
          return;
        }
      }

      // Try raw query string
      if (text.includes("type=") && text.includes("id=")) {
        const qs = new URLSearchParams(text.includes("?") ? text.split("?")[1] : text);
        const t = qs.get("type") ?? "";
        const i = qs.get("id") ?? "";
        const r = qs.get("role") ?? "";
        if (t && i) {
          navigate(
            `/verify?type=${encodeURIComponent(t)}&id=${encodeURIComponent(i)}${r ? `&role=${encodeURIComponent(r)}` : ""}`,
            { replace: true },
          );
          verify(t, i, r);
          return;
        }
      }

      setScanError(
        `QR code scanned but format is unrecognized. Raw value: "${text.slice(0, 80)}${text.length > 80 ? "…" : ""}"`,
      );
    } catch (e: any) {
      setScanError("Failed to parse QR code: " + (e?.message ?? String(e)));
    }
  }, [navigate, verify]);

  return {
    loading, result, error, showScanner, scanError,
    setShowScanner, setResult, setError,
    verify, handleScan,
  };
}
