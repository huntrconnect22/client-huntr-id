import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  IconButton,
  Chip,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
} from "@mui/material";
import { Monitor, Smartphone, Trash2, RefreshCw } from "lucide-react";
import Swal from "sweetalert2";
import { getSessions, logoutSession } from "../../../lib/api";
import { useLanguage } from "../../../context/LanguageContext";

/**
 * AccountSessionsTab Component
 * 
 * Pure Material UI implementation.
 */
export function AccountSessionsTab() {
  const { t } = useLanguage();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const data = await getSessions();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleLogoutSession = async (sessionId: string) => {
    const result = await Swal.fire({
      icon: "question",
      title: t("settings.sessions.terminateConfirmTitle"),
      text: t("settings.sessions.terminateConfirmText"),
      showCancelButton: true,
      confirmButtonText: t("settings.sessions.terminateConfirmBtn"),
      cancelButtonText: t("settings.sessions.cancelBtn"),
    });
    if (!result.isConfirmed) return;

    try {
      await logoutSession(sessionId);
      fetchSessions();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: err.message,
      });
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 860 }}>
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {t("settings.sessions.title")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {t("settings.sessions.subtitle")}
          </Typography>
        </Box>

        <Button
          variant="outlined"
          color="inherit"
          onClick={fetchSessions}
          disabled={loading}
          startIcon={<RefreshCw size={15} className={loading ? "animate-spin" : ""} />}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, fontSize: 13 }}
        >
          {t("settings.sessions.refresh")}
        </Button>
      </Stack>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "text.secondary",
            px: 0.5,
          }}
        >
          {t("settings.sessions.connectedDevices")}
        </Typography>

        <Paper
          variant="outlined"
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            bgcolor: "background.paper",
          }}
        >
          {sessions.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
              <Monitor size={44} style={{ opacity: 0.3, marginBottom: 12 }} />
              <Typography variant="body2">{t("settings.sessions.noSessions")}</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {sessions.map((session, index) => {
                const isMobile =
                  session.name?.toLowerCase().includes("android") ||
                  session.name?.toLowerCase().includes("ios") ||
                  session.user_agent?.toLowerCase().includes("mobile");
                const Icon = isMobile ? Smartphone : Monitor;

                return (
                  <React.Fragment key={session.id || index}>
                    {index > 0 && <Divider />}
                    <ListItem
                      sx={{
                        p: { xs: 2, sm: 2.5 },
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Stack direction="row" spacing={2} sx={{ alignItems: "center", minWidth: 0, pr: 2 }}>
                        <Avatar
                          sx={{
                            width: 42,
                            height: 42,
                            borderRadius: 2.5,
                            bgcolor: session.is_current_device
                              ? (theme) => `${theme.palette.primary.main}1A`
                              : "action.hover",
                            color: session.is_current_device ? "primary.main" : "text.secondary",
                          }}
                        >
                          <Icon size={20} />
                        </Avatar>

                        <Box sx={{ minWidth: 0 }}>
                          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", gap: 0.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                              {session.type === "API Token" ? session.name || "Unknown Device" : session.ip_address}
                            </Typography>
                            {session.is_current_device && (
                              <Chip
                                size="small"
                                label={t("settings.sessions.currentDevice")}
                                color="success"
                                sx={{ height: 20, fontSize: 10, fontWeight: 700 }}
                              />
                            )}
                          </Stack>

                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }} noWrap>
                            {session.user_agent || "Web Browser"}
                          </Typography>
                          {session.last_active_at && (
                            <Typography variant="caption" color="text.disabled" sx={{ display: "block" }}>
                              {t("settings.sessions.lastActive")}: {session.last_active_at}
                            </Typography>
                          )}
                        </Box>
                      </Stack>

                      {!session.is_current_device && (
                        <Tooltip title={t("settings.sessions.terminateBtn")}>
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleLogoutSession(session.id)}
                            sx={{
                              bgcolor: "rgba(239, 68, 68, 0.08)",
                              "&:hover": { bgcolor: "rgba(239, 68, 68, 0.16)" },
                            }}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </ListItem>
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
