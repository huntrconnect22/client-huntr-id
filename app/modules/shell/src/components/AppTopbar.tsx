import type { ReactNode, Ref } from "react";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import { Bell, ShoppingCart } from "lucide-react";
import { LanguageSwitcher } from "../../../../shared/components/LanguageSwitcher";
import { useLanguage } from "../../../../context/LanguageContext";
import "./AppTopbar.css";

interface AppTopbarProps {
  title: string;
  subtitle?: string;
  breadcrumb?: ReactNode;
  status?: ReactNode;
  user: { name?: string; email?: string; profile_photo_url?: string } | null;
  cartCount: number;
  unreadCount: number;
  notificationsOpen: boolean;
  userMenuOpen: boolean;
  notificationMenu?: ReactNode;
  userMenu?: ReactNode;
  headerRef?: Ref<HTMLElement>;
  notificationRef?: Ref<HTMLButtonElement>;
  userMenuRef?: Ref<HTMLDivElement>;
  obscured?: boolean;
  onHome: () => void;
  onCart: () => void;
  onNotifications: () => void;
  onUserMenu: () => void;
}

/** Presentation only: session, permissions and notification loading stay in AppShell. */
export function AppTopbar({
  title, subtitle, breadcrumb, status, user, cartCount, unreadCount,
  notificationsOpen, userMenuOpen, notificationMenu, userMenu,
  headerRef, notificationRef, userMenuRef, obscured,
  onHome, onCart, onNotifications, onUserMenu,
}: AppTopbarProps) {
  const { t } = useLanguage();
  return (
    <AppBar component="header" position="relative" color="default" elevation={0}
      ref={headerRef}
      className={`huntr-topbar${obscured ? " huntr-shell--blur huntr-shell--dim" : ""}`}>
      <ButtonBase className="huntr-topbar-brand" type="button" onClick={onHome} aria-label="Huntr dashboard">
        <img src="/assets/img/logo/sidebar.png" alt="Huntr" />
      </ButtonBase>

      <div className="huntr-topbar-context">
        <div className="huntr-topbar-heading">
          {breadcrumb}
          <h1 title={title}>{title}</h1>
          {subtitle && <p title={subtitle}>{subtitle}</p>}
        </div>
        {status && <div className="huntr-topbar-status">{status}</div>}
      </div>

      <div className="huntr-topbar-actions">
        <LanguageSwitcher compact className="huntr-topbar-language" buttonStyle={{ width: 44, height: 44, minHeight: 44, padding: 0 }} />
        <IconButton type="button" className="huntr-topbar-action huntr-topbar-cart" onClick={onCart}
          aria-label={t("header.viewCart", { count: cartCount })}>
          <Badge badgeContent={cartCount} max={99} color="primary"><ShoppingCart size={20} /></Badge>
        </IconButton>
        <div className="huntr-topbar-menu-anchor">
          <IconButton type="button" className="huntr-topbar-action" ref={notificationRef}
            onClick={onNotifications} aria-expanded={notificationsOpen}
            aria-label={unreadCount > 0 ? t("header.notificationsUnread", { count: unreadCount }) : t("header.notifications")}>
            <Badge badgeContent={unreadCount} max={99} color="primary"><Bell size={20} /></Badge>
          </IconButton>
          {notificationMenu}
        </div>
        {user && <div ref={userMenuRef} className="huntr-topbar-menu-anchor huntr-topbar-account">
          <ButtonBase type="button" className="huntr-topbar-user" onClick={onUserMenu}
            aria-expanded={userMenuOpen} aria-haspopup="true"
            aria-label={t("header.userMenu", { name: user.name || "" })}>
            <Avatar src={user.profile_photo_url} alt={user.name || "User"}
              sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: "primary.main", color: "primary.contrastText", fontSize: 14 }}>
              {user.name?.[0]?.toUpperCase() || "U"}
            </Avatar>
            <span className="huntr-topbar-user-label">
              <strong>{user.name}</strong><span>{user.email}</span>
            </span>
          </ButtonBase>
          {userMenu}
        </div>}
      </div>
    </AppBar>
  );
}
