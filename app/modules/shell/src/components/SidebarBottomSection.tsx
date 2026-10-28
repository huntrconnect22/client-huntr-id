import React from "react";
import { Link, useNavigate } from "react-router";
import { Building2, CheckCircle2, ArrowLeftRight, ShoppingCart } from "lucide-react";
import { useLanguage } from "~/context/LanguageContext";

interface SidebarBottomSectionProps {
  user: any;
  activeCompany: any;
  isBuyerComp: boolean;
  isVendorComp: boolean;
  enterprisePlan: string | null;
  isTrialPlan: boolean;
  roleSwitching: boolean;
  switchingWorkspace: boolean;
  counterpartBuyer: any;
  counterpartVendor: any;
  rejectedCounterpart: any;
  onRoleSwitch: (role: string) => void;
  onSwitchWorkspace: (targetCompany: any) => void;
  onSwitchCompany: () => void;
}

export const SidebarBottomSection: React.FC<SidebarBottomSectionProps> = ({
  user,
  activeCompany,
  isBuyerComp,
  isVendorComp,
  enterprisePlan,
  isTrialPlan,
  roleSwitching,
  switchingWorkspace,
  counterpartBuyer,
  counterpartVendor,
  rejectedCounterpart,
  onRoleSwitch,
  onSwitchWorkspace,
  onSwitchCompany,
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  if (!activeCompany) return null;

  const planLabel = enterprisePlan
    ? isTrialPlan
      ? "TRIAL ENTERPRISE PRO"
      : ({
          enterprise_starter: "ENTERPRISE STARTER",
          enterprise_growth: "ENTERPRISE GROWTH",
          enterprise_pro: "ENTERPRISE PRO",
        }[enterprisePlan] ?? enterprisePlan.replace(/_/g, " ").toUpperCase())
    : null;

  return (
    <div
      style={{
        margin: "8px 8px 0",
        borderTop: "1px solid var(--ui-border)",
        paddingTop: 10,
      }}
    >
      {/* ⚡ Octane + Swoole indicator — DEV only */}
      {import.meta.env.DEV && (
        <>
          <style>{`
            @keyframes _octane_pulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.4; transform: scale(0.75); }
            }
            @keyframes _octane_shimmer {
              0% { background-position: -200% center; }
              100% { background-position: 200% center; }
            }
          `}</style>
          <div
            title="Laravel Octane + Swoole is active — requests are served by a persistent in-memory worker"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 9px",
              marginBottom: 8,
              borderRadius: 7,
              background: "linear-gradient(90deg, rgba(16,185,129,0.08) 0%, rgba(6,182,212,0.08) 100%)",
              border: "1px solid rgba(16,185,129,0.22)",
              cursor: "default",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* animated shimmer strip */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.10) 50%, transparent 100%)",
                backgroundSize: "200% 100%",
                animation: "_octane_shimmer 3s linear infinite",
                pointerEvents: "none",
              }}
            />
            {/* pulsing green dot */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#10b981",
                  animation: "_octane_pulse 1.8s ease-in-out infinite",
                  boxShadow: "0 0 6px rgba(16,185,129,0.7)",
                }}
              />
            </div>
            {/* label */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  background: "linear-gradient(90deg, #10b981, #06b6d4)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  lineHeight: 1.2,
                }}
              >
                ⚡ Octane · Swoole
              </div>
              <div
                style={{
                  fontSize: 8,
                  color: "rgba(16,185,129,0.6)",
                  fontWeight: 500,
                  marginTop: 1,
                  letterSpacing: "0.03em",
                }}
              >
                persistent worker · port 8000
              </div>
            </div>
            {/* right badge */}
            <div
              style={{
                padding: "1px 5px",
                borderRadius: 4,
                background: "rgba(16,185,129,0.15)",
                border: "1px solid rgba(16,185,129,0.3)",
                fontSize: 7,
                fontWeight: 800,
                color: "#10b981",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                flexShrink: 0,
              }}
            >
              LIVE
            </div>
          </div>
        </>
      )}
      {/* Dev: role switcher */}
      {import.meta.env.DEV && user && (
        <div
          style={{
            marginBottom: 8,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: "var(--ui-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
            }}
          >
            Debug: {t("sidebar.debugSwitchRole").split(":")[1]?.trim() || "Switch Role"}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            {(() => {
              const buyerRoles = ["manager", "buyer", "finance"];
              const vendorRoles = ["manager", "admin", "finance", "buyer"];
              const roles = isBuyerComp ? buyerRoles : vendorRoles;
              return roles.map((role) => (
                <button
                  key={role}
                  onClick={() => onRoleSwitch(role)}
                  disabled={roleSwitching || user.role === role}
                  style={{
                    padding: "3px 7px",
                    borderRadius: 6,
                    fontSize: 9,
                    fontWeight: 600,
                    background:
                      user.role === role
                        ? "rgba(249,115,22,0.15)"
                        : "var(--ui-bg-input)",
                    border:
                      user.role === role
                        ? "1px solid rgba(249,115,22,0.35)"
                        : "1px solid var(--ui-border)",
                    color:
                      user.role === role ? "#f97316" : "var(--ui-text-muted)",
                    cursor: user.role === role ? "not-allowed" : "pointer",
                    textTransform: "capitalize",
                    transition: "all 0.15s ease",
                  }}
                >
                  {role}
                </button>
              ));
            })()}
          </div>
        </div>
      )}

      <div
        style={{
          background: "var(--ui-bg-badge)",
          border: "1px solid var(--ui-border-badge)",
          borderRadius: 8,
          padding: "10px 12px",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            fontSize: 9,
            color: "#f59e0b",
            fontWeight: 700,
            letterSpacing: "0.1em",
            marginBottom: 5,
            textTransform: "uppercase",
          }}
        >
          {t("sidebar.activeWorkspace")}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: isBuyerComp
                ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                : "linear-gradient(135deg,#f97316,#f59e0b)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Building2 size={13} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--ui-text-primary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {activeCompany.name}
            </div>
            <div
              style={{
                fontSize: 9,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginTop: 2,
                display: "flex",
                alignItems: "center",
                gap: 4,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  padding: "1px 6px",
                  borderRadius: 4,
                  fontWeight: 800,
                  fontSize: 8,
                  background: isBuyerComp
                    ? "rgba(99,102,241,0.15)"
                    : "rgba(249,115,22,0.15)",
                  color: isBuyerComp ? "#818cf8" : "#f97316",
                }}
              >
                {isBuyerComp ? "BUYER" : "VENDOR"}
              </span>
              {planLabel && (
                <span
                  style={{
                    padding: "1px 6px",
                    borderRadius: 4,
                    fontWeight: 800,
                    fontSize: 8,
                    background: isTrialPlan
                      ? "rgba(245, 158, 11, 0.14)"
                      : "rgba(16, 185, 129, 0.14)",
                    color: isTrialPlan ? "#d97706" : "#059669",
                    border: isTrialPlan
                      ? "1px solid rgba(245, 158, 11, 0.28)"
                      : "1px solid rgba(16, 185, 129, 0.28)",
                  }}
                >
                  {planLabel}
                </span>
              )}
              {(activeCompany.formatted_tax_id || activeCompany.tax_id) && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "2px",
                    padding: "1px 5px",
                    borderRadius: "4px",
                    fontWeight: 700,
                    fontSize: "8px",
                    background: "rgba(56, 189, 248, 0.15)",
                    color: "#38bdf8",
                    border: "1px solid rgba(56, 189, 248, 0.25)",
                  }}
                  title={t("sidebar.npwpVerified")}
                >
                  <CheckCircle2 size={8} className="text-sky-400" />
                  <span>{t("sidebar.npwpVerified")}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Real Workspace Switcher */}
        {(isVendorComp || isBuyerComp) && (
          <div style={{ marginTop: 8 }}>
            {(isVendorComp ? counterpartBuyer : counterpartVendor) ? (
              <button
                disabled={switchingWorkspace}
                onClick={() =>
                  onSwitchWorkspace(
                    isVendorComp ? counterpartBuyer : counterpartVendor
                  )
                }
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: 6,
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: switchingWorkspace ? "not-allowed" : "pointer",
                  background:
                    "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.12))",
                  border: "1px solid rgba(99,102,241,0.3)",
                  color: "#818cf8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "all 0.15s ease",
                  opacity: switchingWorkspace ? 0.6 : 1,
                }}
              >
                <ArrowLeftRight size={11} />
                <span>
                  {switchingWorkspace
                    ? t("sidebar.switchingWorkspace")
                    : isVendorComp
                    ? t("sidebar.switchToBuyer")
                    : t("sidebar.switchToVendor")}
                </span>
              </button>
            ) : (
              <button
                onClick={() => {
                  const type = isVendorComp ? "buyer" : "vendor";
                  navigate(
                    `/onboarding?type=${type}&from_company=${activeCompany.id}`
                  );
                }}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: 6,
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: "pointer",
                  background: rejectedCounterpart
                    ? "rgba(239, 68, 68, 0.1)"
                    : "var(--ui-bg-input)",
                  border: rejectedCounterpart
                    ? "1px solid rgba(239, 68, 68, 0.3)"
                    : "1px solid var(--ui-border)",
                  color: rejectedCounterpart ? "#ef4444" : "var(--ui-text-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "all 0.15s ease",
                }}
              >
                <ShoppingCart size={11} />
                <span>
                  {rejectedCounterpart
                    ? isVendorComp
                      ? t("sidebar.reactivateBuyerMode")
                      : t("sidebar.reregisterVendor")
                    : isVendorComp
                    ? t("sidebar.activateBuyerMode")
                    : t("sidebar.registerAsVendor")}
                </span>
              </button>
            )}
          </div>
        )}

        <div style={{ marginTop: 6 }}>
          <button
            onClick={onSwitchCompany}
            style={{
              width: "100%",
              padding: "6px 8px",
              borderRadius: 6,
              fontSize: 10,
              fontWeight: 600,
              cursor: "pointer",
              background: "var(--ui-switch-bg)",
              border: "1px solid var(--ui-switch-border)",
              color: "var(--ui-switch-text)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              transition: "all 0.15s",
            }}
          >
            <ArrowLeftRight size={10} /> {t("sidebar.switchCompany")}
          </button>
        </div>
      </div>
    </div>
  );
};
