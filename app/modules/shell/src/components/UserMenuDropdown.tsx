import { Surface as HuntrSurface } from "~/shared/ui/Surface";
import { Button as HuntrButton } from "~/shared/ui/Button";
import React from "react";
import { useNavigate } from "react-router";
import { ArrowLeftRight, Settings, LogOut } from "lucide-react";
import { useLanguage } from "~/context/LanguageContext";

interface UserMenuDropdownProps {
  user: any;
  activeCompany: any;
  isVendorComp: boolean;
  isBuyerComp: boolean;
  counterpartBuyer: any;
  counterpartVendor: any;
  rejectedCounterpart: any;
  switchingWorkspace: boolean;
  onSwitchWorkspace: (targetCompany: any) => void;
  onLogout: () => void;
  onClose: () => void;
}

export const UserMenuDropdown: React.FC<UserMenuDropdownProps> = ({
  user,
  activeCompany,
  isVendorComp,
  isBuyerComp,
  counterpartBuyer,
  counterpartVendor,
  rejectedCounterpart,
  switchingWorkspace,
  onSwitchWorkspace,
  onLogout,
  onClose,
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <HuntrSurface
      style={{
        position: "absolute",
        top: "calc(100% + 8px)",
        right: 0,
        width: "210px",
        background: "var(--ui-bg-card)",
        border: "1px solid var(--ui-border)",
        borderRadius: 12,
        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)",
        zIndex: 99999,
        padding: "6px",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <div
        style={{
          padding: "8px 10px 8px",
          borderBottom: "1px solid var(--ui-border)",
          marginBottom: 4,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            overflow: "hidden",
            flexShrink: 0,
            background: "#ea580c",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          {user.profile_photo_url ? (
            <img
              src={user.profile_photo_url}
              alt={user.name || "User"}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            user.name?.[0]?.toUpperCase() || "U"
          )}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--ui-text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user.name}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--ui-text-muted)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user.email}
          </div>
        </div>
      </div>

      {/* Real Workspace Switcher in user menu */}
      {(isVendorComp || isBuyerComp) && (
        <HuntrButton
          disabled={switchingWorkspace}
          onClick={() => {
            onClose();
            const counterpart = isVendorComp
              ? counterpartBuyer
              : counterpartVendor;
            if (counterpart) {
              onSwitchWorkspace(counterpart);
            } else {
              const type = isVendorComp ? "buyer" : "vendor";
              navigate(
                `/onboarding?type=${type}&from_company=${activeCompany?.id}`
              );
            }
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "8px 10px",
            borderRadius: 6,
            border: "none",
            background: (isVendorComp ? counterpartBuyer : counterpartVendor)
              ? "rgba(99,102,241,0.08)"
              : "transparent",
            color: (isVendorComp ? counterpartBuyer : counterpartVendor)
              ? "#818cf8"
              : "var(--ui-text-primary)",
            fontSize: 12,
            fontWeight: 600,
            cursor: switchingWorkspace ? "not-allowed" : "pointer",
            textAlign: "left",
            opacity: switchingWorkspace ? 0.6 : 1,
          }}
          className="hover:bg-[var(--ui-bg-input)]"
        >
          <ArrowLeftRight
            size={14}
            style={{
              color: (isVendorComp ? counterpartBuyer : counterpartVendor)
                ? "#818cf8"
                : "var(--ui-text-muted)",
            }}
          />
          <span>
            {switchingWorkspace
              ? t("userMenu.switchingWorkspace")
              : (isVendorComp ? counterpartBuyer : counterpartVendor)
              ? isVendorComp
                ? t("userMenu.switchToBuyer")
                : t("userMenu.switchToVendor")
              : rejectedCounterpart
              ? isVendorComp
                ? t("userMenu.reactivateBuyerMode")
                : t("userMenu.reregisterVendor")
              : isVendorComp
              ? t("userMenu.activateBuyerMode")
              : t("userMenu.registerAsVendor")}
          </span>
        </HuntrButton>
      )}

      <HuntrButton
        onClick={() => {
          onClose();
          navigate("/account");
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          padding: "8px 10px",
          borderRadius: 6,
          border: "none",
          background: "transparent",
          color: "var(--ui-text-primary)",
          fontSize: 12,
          fontWeight: 500,
          cursor: "pointer",
          textAlign: "left",
        }}
        className="hover:bg-[var(--ui-bg-input)]"
      >
        <Settings size={14} className="text-[var(--ui-text-muted)]" />
        <span>{t("userMenu.accountSettings")}</span>
      </HuntrButton>

      <HuntrButton
        onClick={() => {
          onClose();
          onLogout();
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          padding: "8px 10px",
          borderRadius: 6,
          border: "none",
          background: "rgba(239,68,68,0.08)",
          color: "#ef4444",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          textAlign: "left",
          marginTop: 2,
        }}
      >
        <LogOut size={14} />
        <span>{t("userMenu.signOut")}</span>
      </HuntrButton>
    </HuntrSurface>
  );
};
