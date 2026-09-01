import React from "react";
import { useNavigate } from "react-router";
import { ArrowLeftRight, Settings, LogOut } from "lucide-react";

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

  return (
    <div
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
          padding: "8px 10px 6px",
          borderBottom: "1px solid var(--ui-border)",
          marginBottom: 4,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--ui-text-primary)",
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

      {/* Real Workspace Switcher in user menu */}
      {(isVendorComp || isBuyerComp) && (
        <button
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
              ? "Beralih..."
              : (isVendorComp ? counterpartBuyer : counterpartVendor)
              ? isVendorComp
                ? "Beralih ke Buyer Workspace"
                : "Beralih ke Vendor Workspace"
              : rejectedCounterpart
              ? isVendorComp
                ? "Aktifkan Ulang Buyer Mode"
                : "Daftar Ulang Vendor"
              : isVendorComp
              ? "Aktifkan Buyer Mode"
              : "Daftar sebagai Vendor"}
          </span>
        </button>
      )}

      <button
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
        <span>Account Settings</span>
      </button>

      <button
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
        <span>Sign Out</span>
      </button>
    </div>
  );
};
