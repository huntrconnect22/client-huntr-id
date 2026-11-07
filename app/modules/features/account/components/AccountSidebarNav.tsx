import React from "react";
import {
  Paper,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
} from "@mui/material";
import {
  Shield,
  User,
  Zap,
  Palette,
  Sparkles,
  Monitor,
  ChevronRight,
} from "lucide-react";
import { useLanguage, type TranslationKey } from "../../../context/LanguageContext";

export type AccountTabType =
  | "security"
  | "profile"
  | "subscription"
  | "appearance"
  | "features"
  | "sessions";

interface AccountSidebarNavProps {
  activeTab: AccountTabType;
  onSelectTab: (tab: AccountTabType) => void;
  companyType?: string;
}

const TABS: { id: AccountTabType; icon: React.FC<any>; labelKey: TranslationKey; forBuyerOnly?: boolean }[] = [
  { id: "security", icon: Shield, labelKey: "settings.tabs.security" },
  { id: "profile", icon: User, labelKey: "settings.tabs.profile" },
  { id: "subscription", icon: Zap, labelKey: "settings.tabs.subscription" },
  { id: "appearance", icon: Palette, labelKey: "settings.tabs.appearance" },
  { id: "features", icon: Sparkles, labelKey: "settings.tabs.features", forBuyerOnly: true },
  { id: "sessions", icon: Monitor, labelKey: "settings.tabs.sessions" },
];

export function AccountSidebarNav({ activeTab, onSelectTab, companyType }: AccountSidebarNavProps) {
  const { t } = useLanguage();
  const theme = useTheme();

  const visibleTabs = TABS.filter((tab) => {
    if (tab.forBuyerOnly && companyType === "vendor") {
      return false;
    }
    return true;
  });

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        p: 1,
        position: { md: "sticky" },
        top: { md: 24 },
        bgcolor: "background.paper",
      }}
    >
      <List disablePadding sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        {visibleTabs.map((tab) => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <ListItemButton
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              selected={active}
              sx={{
                borderRadius: 2,
                py: 1.25,
                px: 1.5,
                transition: "all 0.15s ease-in-out",
                "&.Mui-selected": {
                  bgcolor: (theme) => `${theme.palette.primary.main}14`,
                  color: "primary.main",
                  "&:hover": {
                    bgcolor: (theme) => `${theme.palette.primary.main}1F`,
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 34,
                  color: active ? "primary.main" : "text.secondary",
                }}
              >
                <Icon size={18} />
              </ListItemIcon>
              <ListItemText
                primary={t(tab.labelKey)}
                slotProps={{
                  primary: {
                    sx: {
                      fontSize: 13.5,
                      fontWeight: active ? 700 : 500,
                      color: active ? "primary.main" : "text.primary",
                    },
                  },
                }}
              />
              <ChevronRight
                size={14}
                style={{
                  opacity: active ? 1 : 0.4,
                  color: active ? theme.palette.primary.main : theme.palette.text.secondary,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Paper>
  );
}
