import { useMemo, useState } from "react";
import { Link } from "react-router";
import { LayoutGrid, MoreHorizontal, X } from "lucide-react";
import MuiBottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Paper from "@mui/material/Paper";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useLanguage } from "~/context/LanguageContext";
import type { NavItemConfig } from "./navigation";

interface BottomNavigationProps {
  navItems: NavItemConfig[];
  pathname: string;
  search?: string;
  pendingCounts: Record<string, number>;
  onOpenMenu: () => void;
}

function isActiveNavigationItem(item: NavItemConfig, pathname: string, search: string) {
  const [itemPath, itemQuery] = item.to.split("?");
  const pathMatches = item.exact
    ? pathname === itemPath
    : pathname === itemPath || (!item.exact && itemPath !== "/" && pathname.startsWith(`${itemPath}/`));

  if (!pathMatches) return false;
  if (itemQuery) return search === `?${itemQuery}`;

  // Exact items without a query (such as WMS Overview) should not appear
  // selected when a sibling WMS operation is selected via the URL query.
  return !item.exact || !search;
}

export function BottomNavigation({ navItems, pathname, search = "", pendingCounts, onOpenMenu }: BottomNavigationProps) {
  const { t } = useLanguage();
  const [moreOpen, setMoreOpen] = useState(false);
  const active = navItems.find((item) => isActiveNavigationItem(item, pathname, search));
  const menuIndex = Math.ceil(navItems.length / 2);

  // A bottom bar is a quick launcher, not a horizontal list. On small screens
  // retain two consistent entry points and the current operation, then expose
  // the rest in a reachable bottom sheet.
  const mobileItems = useMemo(() => {
    const primary = navItems.slice(0, 2);
    const currentIsPrimary = active && primary.some((item) => item.to === active.to);
    const thirdItem = !currentIsPrimary && active ? active : navItems.find((item) => !primary.some((entry) => entry.to === item.to));

    return thirdItem ? [...primary, thirdItem] : primary;
  }, [active, navItems]);
  const hasMoreItems = navItems.some((item) => !mobileItems.some((visible) => visible.to === item.to));

  const renderItem = ({ to, label, bottomLabel, labelKey, Icon, badge }: NavItemConfig) => {
    const fullLabel = labelKey ? t(labelKey) : label;
    return (
    <BottomNavigationAction key={to} component={Link} to={to} value={to}
      aria-current={active?.to === to ? "page" : undefined}
      aria-label={fullLabel}
      title={fullLabel}
      label={bottomLabel ?? fullLabel}
      icon={<Badge badgeContent={badge ? pendingCounts[badge] ?? 0 : 0} color="primary" max={99}><Icon size={19} /></Badge>} />
    );
  };

  return (
    <Paper component="nav" square aria-label="Context navigation"
      sx={{ position: "fixed", inset: "auto 0 0", zIndex: 80, borderTop: 1, borderColor: "divider", pb: "env(safe-area-inset-bottom, 0px)" }}>
      <MuiBottomNavigation showLabels value={active?.to ?? false}
        className="huntr-mobile-bottom-navigation"
        sx={{ display: { xs: "flex", md: "none" }, height: 66, width: "100%", mx: "auto",
          "& .MuiBottomNavigationAction-root": { flex: "1 1 0", minWidth: 0, maxWidth: "none", gap: 0.35, px: 0.35, py: 0.75 },
          "& .MuiBottomNavigationAction-root + .MuiBottomNavigationAction-root": { borderLeft: 1, borderColor: "divider" },
          "& .MuiBottomNavigationAction-label, & .MuiBottomNavigationAction-label.Mui-selected": { maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: { xs: "0.625rem", sm: "0.6875rem" }, lineHeight: 1.15, fontWeight: 650 },
          "& .MuiBottomNavigationAction-root.Mui-selected": { bgcolor: "action.selected", color: "var(--ui-text-brand)" },
          "& .huntr-bottom-navigation-menu": { bgcolor: "secondary.main", color: "secondary.contrastText", "&:hover": { bgcolor: "secondary.dark" }, "& .MuiBottomNavigationAction-label": { color: "inherit" } },
        }}>
        {mobileItems.slice(0, 2).map(renderItem)}
        <BottomNavigationAction className="huntr-bottom-navigation-menu" value="main-menu" label="Menu" icon={<LayoutGrid size={19} />} onClick={onOpenMenu} />
        {mobileItems.slice(2).map(renderItem)}
        {hasMoreItems && <BottomNavigationAction value="more" label="Lainnya" icon={<MoreHorizontal size={20} />} onClick={() => setMoreOpen(true)} />}
      </MuiBottomNavigation>

      <MuiBottomNavigation showLabels value={active?.to ?? false}
        className="huntr-desktop-bottom-navigation"
        sx={{ display: { xs: "none", md: "flex" }, height: 66, width: "100%", maxWidth: 1180, mx: "auto",
          "& .MuiBottomNavigationAction-root": { flex: "1 1 0", minWidth: 0, maxWidth: "none", gap: 0.35, px: 0.5, py: 0.75 },
          "& .MuiBottomNavigationAction-root + .MuiBottomNavigationAction-root": { borderLeft: 1, borderColor: "divider" },
          "& .MuiBottomNavigationAction-label, & .MuiBottomNavigationAction-label.Mui-selected": { maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.6875rem", lineHeight: 1.15, fontWeight: 650 },
          "& .MuiBottomNavigationAction-root.Mui-selected": { bgcolor: "action.selected", color: "var(--ui-text-brand)" },
          "& .huntr-bottom-navigation-menu": { bgcolor: "secondary.main", color: "secondary.contrastText", "&:hover": { bgcolor: "secondary.dark" }, "& .MuiBottomNavigationAction-label": { color: "inherit" } },
        }}>
        {navItems.slice(0, menuIndex).map(renderItem)}
        <BottomNavigationAction className="huntr-bottom-navigation-menu" value="main-menu" label="Menu" icon={<LayoutGrid size={19} />} onClick={onOpenMenu} />
        {navItems.slice(menuIndex).map(renderItem)}
      </MuiBottomNavigation>

      <Drawer anchor="bottom" open={moreOpen} onClose={() => setMoreOpen(false)}
        slotProps={{ paper: { sx: { borderTopLeftRadius: 18, borderTopRightRadius: 18, pb: "max(12px, env(safe-area-inset-bottom, 0px))" } } }}>
        <Box sx={{ width: "100%", maxWidth: 640, mx: "auto" }}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", px: 2, py: 1.25 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 750 }}>Semua operasi</Typography>
              <Typography variant="caption" color="text.secondary">Pilih halaman yang ingin dibuka.</Typography>
            </Box>
            <IconButton aria-label="Tutup menu operasi" onClick={() => setMoreOpen(false)}><X size={20} /></IconButton>
          </Stack>
          <Divider />
          <List disablePadding sx={{ maxHeight: "min(62vh, 560px)", overflowY: "auto", py: 0.75 }}>
            {navItems.map((item) => {
              const itemLabel = item.labelKey ? t(item.labelKey) : item.label;
              const selected = active?.to === item.to;
              return (
                <ListItemButton key={item.to} component={Link} to={item.to} selected={selected} onClick={() => setMoreOpen(false)} sx={{ mx: 1, borderRadius: 1.5 }}>
                  <ListItemIcon sx={{ minWidth: 42, color: selected ? "primary.main" : "text.secondary" }}><item.Icon size={20} /></ListItemIcon>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: selected ? 700 : 600 }}>{itemLabel}</Typography>
                  </Box>
                  {item.badge && (pendingCounts[item.badge] ?? 0) > 0 && <Badge color="primary" badgeContent={pendingCounts[item.badge]} max={99} />}
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      </Drawer>
    </Paper>
  );
}
