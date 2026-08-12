import React from "react";
import { AlertTriangle, Lock } from "lucide-react";
import { useNavigate } from "react-router";
import {
  type DemoDisabledModule,
  demoModuleBannerMessage,
  demoModuleBannerTitle,
} from "../lib/demo-mode";

interface DemoDisabledBannerProps {
  module: DemoDisabledModule;
  showBackButton?: boolean;
}

export const DemoDisabledBanner: React.FC<DemoDisabledBannerProps> = ({
  module,
  showBackButton = true,
}) => {
  const navigate = useNavigate();
  const title = demoModuleBannerTitle(module);
  const message = demoModuleBannerMessage(module);

  return (
    <div style={{ width: "100%", padding: "40px 24px" }}>
      <div
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: 32,
          borderRadius: 16,
          border: "1px solid var(--ui-border)",
          background: "var(--ui-bg-card)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(234, 179, 8, 0.12)",
              color: "rgb(202, 138, 4)",
            }}
          >
            <Lock size={26} />
          </div>
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "var(--ui-text-primary)",
                lineHeight: 1.2,
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "rgb(202, 138, 4)",
                marginTop: 4,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Mode Demo Aktif
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "14px 16px",
            borderRadius: 12,
            background: "rgba(234, 179, 8, 0.06)",
            border: "1px solid rgba(234, 179, 8, 0.18)",
            marginBottom: 24,
          }}
        >
          <AlertTriangle
            size={18}
            style={{
              color: "rgb(202, 138, 4)",
              flexShrink: 0,
              marginTop: 1,
            }}
          />
          <p
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.55,
              color: "var(--ui-text-secondary)",
            }}
          >
            {message}
          </p>
        </div>

        {showBackButton && (
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                border: "1px solid var(--ui-border)",
                background: "var(--ui-bg-input)",
                color: "var(--ui-text-secondary)",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Kembali
            </button>
            <button
              type="button"
              onClick={() => navigate("/")}
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                border: "none",
                background: "var(--ui-accent-primary)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
              }}
            >
              Ke Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DemoDisabledBanner;
