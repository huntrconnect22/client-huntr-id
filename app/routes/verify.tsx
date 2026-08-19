import React, { useEffect } from "react";
import { useLocation } from "react-router";
import { Loader2 } from "lucide-react";
import {
  useVerify,
  CameraScanner,
  VerifyHeader,
  VerifyLandingState,
  VerifyErrorState,
  VerifyResult,
} from "../features/verify";

export default function VerifyPage() {
  const location = useLocation();
  const params   = new URLSearchParams(location.search);

  const docType = params.get("type") ?? "";
  const docId   = params.get("id")   ?? "";
  const role    = params.get("role") ?? "";

  const {
    loading, result, error, showScanner, scanError,
    setShowScanner, setResult, setError,
    verify, handleScan,
  } = useVerify();

  useEffect(() => {
    if (docType && docId) {
      verify(docType, docId, role);
    }
  }, [docType, docId]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
      fontFamily: "'Inter', 'Outfit', system-ui, sans-serif",
    }}>
      {/* Camera scanner overlay */}
      {showScanner && (
        <CameraScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      <VerifyHeader />

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 64px" }}>
        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <Loader2 size={40} color="#22c55e" style={{ animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15, margin: 0, fontWeight: 600 }}>
              Verifying document authenticity…
            </p>
          </div>
        )}

        {/* Landing */}
        {!loading && !result && !error && (
          <VerifyLandingState
            scanError={scanError}
            onOpenScanner={() => { setShowScanner(true); }}
          />
        )}

        {/* Error */}
        {error && !loading && (
          <VerifyErrorState
            error={error}
            onScanAgain={() => { setError(null); setResult(null); setShowScanner(true); }}
          />
        )}

        {/* Success */}
        {result && !loading && (
          <VerifyResult
            result={result}
            onScanAnother={() => { setResult(null); setError(null); setShowScanner(true); }}
          />
        )}
      </main>

      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "20px 24px", textAlign: "center",
      }}>
        <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.2)", fontWeight: 500 }}>
          © {new Date().getFullYear()} huntr.id — Procurement & Supply Chain Platform
        </p>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        #qr-scanner-container video { width: 100% !important; height: auto !important; object-fit: contain; }
        #qr-scanner-container canvas { display: none; }
      `}</style>
    </div>
  );
}
