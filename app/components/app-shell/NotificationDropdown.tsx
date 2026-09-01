import React from "react";
import { useNavigate } from "react-router";

interface NotificationDropdownProps {
  unreadCount: number;
  recentNotifications: any[];
  onMarkAllAsRead: () => void;
  onNotificationClick: (notification: any) => void;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  unreadCount,
  recentNotifications,
  onMarkAllAsRead,
  onNotificationClick,
  onClose,
}) => {
  const navigate = useNavigate();

  return (
    <div
      className="huntr-notif-dropdown"
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="notifications-title"
      tabIndex={-1}
      style={{
        background: "var(--ui-bg-card)",
        borderRadius: 12,
        border: "1px solid var(--ui-border)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        zIndex: 99999,
        overflow: "hidden",
        position: "absolute",
        top: "calc(100% + 8px)",
        right: 0,
        width: "360px",
        maxWidth: "90vw",
        outline: "none",
      }}
    >
      <div
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid var(--ui-border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            id="notifications-title"
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--ui-text-primary)",
            }}
          >
            Notifications
          </span>
          {unreadCount > 0 && (
            <span
              style={{
                fontSize: 9,
                background: "rgba(249,115,22,0.15)",
                color: "#fb923c",
                padding: "2px 7px",
                borderRadius: 8,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {unreadCount} new
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMarkAllAsRead();
          }}
          style={{
            background: "none",
            border: "none",
            color: "var(--ui-text-muted)",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            padding: 0,
          }}
        >
          Mark all read
        </button>
      </div>

      <div style={{ maxHeight: 340, overflowY: "auto" }}>
        {recentNotifications.length === 0 ? (
          <div
            style={{
              padding: 36,
              textAlign: "center",
              color: "var(--ui-text-muted)",
              fontSize: 12,
            }}
          >
            No recent activity
          </div>
        ) : (
          recentNotifications.map((n: any) => (
            <div
              key={n.id}
              onClick={() => onNotificationClick(n)}
              className="huntr-notif-item"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onNotificationClick(n);
                }
              }}
              aria-label={`Notification: ${n.data?.title}`}
              style={{
                padding: "12px 18px",
                borderBottom: "1px solid var(--ui-border)",
                cursor: "pointer",
                background: n.read_at
                  ? "transparent"
                  : "rgba(249,115,22,0.03)",
                transition: "background 0.15s",
                outline: "none",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: n.read_at
                    ? "var(--ui-text-secondary)"
                    : "var(--ui-text-primary)",
                  marginBottom: 2,
                }}
              >
                {n.data?.title}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--ui-text-muted)",
                  lineHeight: 1.4,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {n.data?.body}
              </div>
            </div>
          ))
        )}
      </div>

      <button
        onClick={() => {
          navigate("/notifications");
          onClose();
        }}
        style={{
          width: "100%",
          padding: "12px",
          background: "transparent",
          borderTop: "1px solid var(--ui-border)",
          border: "none",
          color: "#f59e0b",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        View All Notifications
      </button>
    </div>
  );
};
