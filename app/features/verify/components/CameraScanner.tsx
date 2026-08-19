import React, { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, AlertCircle, Camera, QrCode, RefreshCw, X } from "lucide-react";

interface CameraScannerProps {
  onScan: (text: string) => void;
  onClose: () => void;
}

export function CameraScanner({ onScan, onClose }: CameraScannerProps) {
  const scannerRef   = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scannedRef   = useRef(false);

  const [scannerError, setScannerError] = useState<string | null>(null);
  const [scanning, setScanning]         = useState(false);
  const [cameras, setCameras]           = useState<{ id: string; label: string }[]>([]);
  const [activeCamera, setActiveCamera] = useState<string>("");

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState?.();
        if (state === 2 /* SCANNING */) {
          await scannerRef.current.stop();
        }
      } catch (_) {}
    }
  }, []);

  const startCamera = useCallback(async (cameraId?: string) => {
    setScannerError(null);
    setScanning(true);
    scannedRef.current = false;

    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");

      if (scannerRef.current) {
        try { await scannerRef.current.stop(); } catch (_) {}
        try { scannerRef.current.clear(); }  catch (_) {}
        scannerRef.current = null;
      }

      const qr = new Html5Qrcode("qr-scanner-container", {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      scannerRef.current = qr;

      const config = {
        fps: 15,
        qrbox: (width: number, height: number) => {
          const size = Math.floor(Math.min(width, height) * 0.7);
          return { width: size, height: size };
        },
      };

      const onSuccess = (decodedText: string) => {
        if (scannedRef.current) return;
        scannedRef.current = true;
        onScan(decodedText);
      };

      if (cameraId) {
        await qr.start({ deviceId: { exact: cameraId } }, config, onSuccess, () => {});
      } else {
        await qr.start({ facingMode: "environment" }, config, onSuccess, () => {});
      }

      setScanning(false);
    } catch (err: any) {
      setScanning(false);
      if (err?.name === "NotAllowedError" || String(err).includes("NotAllowedError")) {
        setScannerError("Camera permission denied. Please allow camera access in your browser settings.");
      } else if (err?.name === "NotFoundError" || String(err).includes("NotFoundError")) {
        setScannerError("No camera found on this device.");
      } else {
        setScannerError("Failed to start camera: " + (err?.message ?? String(err)));
      }
    }
  }, [onScan]);

  useEffect(() => {
    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const devices = await Html5Qrcode.getCameras();
        setCameras(devices ?? []);
      } catch (_) {}
    })();

    startCamera();
    return () => { stopScanner(); };
  }, []);

  const switchCamera = async (id: string) => {
    setActiveCamera(id);
    await stopScanner();
    await startCamera(id);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.92)",
      backdropFilter: "blur(16px)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      {/* Header */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        padding: "20px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(15,23,42,0.7)",
        backdropFilter: "blur(20px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg,#22c55e,#16a34a)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(34,197,94,0.3)",
          }}>
            <QrCode size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#f1f5f9" }}>Scan QR Code</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>
              Point your camera at the QR code on the document
            </div>
          </div>
        </div>
        <button
          onClick={() => { stopScanner(); onClose(); }}
          style={{
            width: 36, height: 36, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.06)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <X size={18} color="rgba(255,255,255,0.6)" />
        </button>
      </div>

      {/* Scanner Area */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        {/* Viewfinder */}
        <div style={{ position: "relative" }}>
          {/* Corner brackets */}
          {[
            { top: 0,    left: 0,    borderTop: "3px solid #22c55e",    borderLeft: "3px solid #22c55e"    },
            { top: 0,    right: 0,   borderTop: "3px solid #22c55e",    borderRight: "3px solid #22c55e"   },
            { bottom: 0, left: 0,    borderBottom: "3px solid #22c55e", borderLeft: "3px solid #22c55e"    },
            { bottom: 0, right: 0,   borderBottom: "3px solid #22c55e", borderRight: "3px solid #22c55e"   },
          ].map((style, i) => (
            <div key={i} style={{ position: "absolute", width: 28, height: 28, borderRadius: 3, zIndex: 10, ...style }} />
          ))}

          {/* Scan line */}
          {!scannerError && (
            <div style={{
              position: "absolute", left: 0, right: 0, top: "50%", height: 2, zIndex: 10,
              background: "linear-gradient(90deg, transparent, #22c55e, transparent)",
              animation: "scanLine 2s ease-in-out infinite",
            }} />
          )}

          <div
            id="qr-scanner-container"
            ref={containerRef}
            style={{
              width: 300, height: 300, borderRadius: 16, overflow: "hidden",
              background: "#000", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          />
        </div>

        {/* Error state */}
        {scannerError && (
          <div style={{
            maxWidth: 320, padding: "16px 20px", borderRadius: 14,
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center",
          }}>
            <AlertCircle size={24} color="#ef4444" />
            <p style={{ margin: 0, fontSize: 13, color: "#fca5a5", fontWeight: 500, lineHeight: 1.5 }}>
              {scannerError}
            </p>
            <button
              onClick={() => startCamera(activeCamera || undefined)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 10, cursor: "pointer",
                background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
                color: "#f87171", fontSize: 13, fontWeight: 700,
              }}
            >
              <RefreshCw size={13} /> Try Again
            </button>
          </div>
        )}

        {/* Scanning spinner */}
        {scanning && !scannerError && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Loader2 size={16} color="#22c55e" style={{ animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Starting camera…</span>
          </div>
        )}

        {/* Camera switcher */}
        {cameras.length > 1 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", maxWidth: 320 }}>
            {cameras.map((cam) => (
              <button
                key={cam.id}
                onClick={() => switchCamera(cam.id)}
                style={{
                  padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontSize: 11, fontWeight: 700,
                  background: activeCamera === cam.id ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${activeCamera === cam.id ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.1)"}`,
                  color: activeCamera === cam.id ? "#22c55e" : "rgba(255,255,255,0.4)",
                }}
              >
                <Camera size={10} style={{ display: "inline", marginRight: 4 }} />
                {cam.label || `Camera ${cameras.indexOf(cam) + 1}`}
              </button>
            ))}
          </div>
        )}

        {!scanning && !scannerError && (
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.25)", textAlign: "center", maxWidth: 260 }}>
            Center the QR code within the frame. It will be detected automatically.
          </p>
        )}
      </div>

      <style>{`
        @keyframes scanLine {
          0%   { transform: translateY(-120px); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(120px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
