import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  CircularProgress,
  Chip,
  Alert,
  Avatar,
  InputAdornment,
  Grid,
} from "@mui/material";
import {
  UserPlus,
  Users,
  Mail,
  Loader2,
  Settings,
  Check,
  X as CloseIcon,
} from "lucide-react";
import { getCompanyAccess } from "../../../lib/api/company";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  role: string;
  role_id?: string;
  profile_photo_url?: string;
}

interface TeamManagementProps {
  company: any;
  teamMembers: TeamMember[];
  teamLoading: boolean;
  isInviting: boolean;
  inviteForm: { email: string; role: string; whatsapp?: string };
  setInviteForm: (form: any) => void;
  handleInviteUser: (e: React.FormEvent) => void;
  inviteError: string | null;
  inviteSuccess: string | null;
  onRoleChanged?: () => void; // Callback to refresh team data after role change
}

export const TeamManagement: React.FC<TeamManagementProps> = ({
  company,
  teamMembers,
  teamLoading,
  isInviting,
  inviteForm,
  setInviteForm,
  handleInviteUser,
  inviteError,
  inviteSuccess,
  onRoleChanged,
}) => {
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string>("");
  const [updatingRole, setUpdatingRole] = useState(false);
  const [companyRoles, setCompanyRoles] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    let isCurrent = true;
    if (!company?.id) return;
    getCompanyAccess(company.id)
      .then((response) => {
        if (isCurrent) {
          setCompanyRoles(response?.roles || []);
        }
      })
      .catch(() => {
        if (isCurrent) setCompanyRoles([]);
      });

    return () => {
      isCurrent = false;
    };
  }, [company?.id]);

  const handleRoleEdit = (userId: string, currentRole: string, currentRoleId?: string) => {
    setEditingUserId(userId);
    setNewRole(currentRoleId || currentRole);
  };

  const handleRoleCancel = () => {
    setEditingUserId(null);
    setNewRole("");
  };

  const handleRoleSave = async (userId: string) => {
    if (
      !newRole ||
      newRole === (teamMembers.find((m) => m.id === userId)?.role_id || teamMembers.find((m) => m.id === userId)?.role)
    ) {
      handleRoleCancel();
      return;
    }

    setUpdatingRole(true);
    try {
      const { updateUserRole } = await import("../../../lib/api/company");
      await updateUserRole(company.id, userId, newRole);

      // Check if this is the current user's role being updated
      const currentUser = (() => {
        try {
          const userSession = localStorage.getItem("user_session");
          return userSession ? JSON.parse(userSession) : null;
        } catch (e) {
          return null;
        }
      })();

      // If current user is updating their own role, refresh their session
      if (currentUser && currentUser.id === userId) {
        const updatedUser = { ...currentUser, role: companyRoles.find((role) => role.id === newRole)?.name || newRole };
        localStorage.setItem("user_session", JSON.stringify(updatedUser));

        try {
          const { SessionManager } = await import("../../../lib/session");
          SessionManager.notify();
        } catch (e) {
          // SessionManager not available, that's ok
        }

        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }

      if (onRoleChanged) {
        onRoleChanged();
      }

      setEditingUserId(null);
      setNewRole("");
    } catch (error) {
      console.error("Error updating user role:", error);
      alert(
        "Gagal mengubah role user. Pastikan Anda memiliki izin untuk melakukan tindakan ini.",
      );
    } finally {
      setUpdatingRole(false);
    }
  };

  const validRoles = companyRoles.map((role) => ({ value: role.id, label: role.name }));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, width: "100%" }}>
      {/* Invite Section */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: 3,
          border: "1px solid",
          borderColor: "rgba(239, 125, 0, 0.2)",
          bgcolor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(239, 125, 0, 0.05)"
              : "rgba(239, 125, 0, 0.03)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              bgcolor: "primary.main",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(239, 125, 0, 0.25)",
            }}
          >
            <UserPlus size={20} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.primary" }}>
              Undang Anggota Tim
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Tambahkan rekan kerja ke workspace perusahaan Anda melalui undangan email.
            </Typography>
          </Box>
        </Box>

        <Box component="form" onSubmit={handleInviteUser}>
          <Grid container spacing={2} sx={{ alignItems: "flex-end" }}>
            <Grid size={{ xs: 12, md: 5 }}>
              <TextField
                fullWidth
                size="small"
                type="email"
                required
                label="Alamat Email"
                placeholder="rekan@perusahaan.com"
                value={inviteForm.email}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, email: e.target.value })
                }
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Mail size={16} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth size="small" required>
                <InputLabel id="team-invite-role-label">Role Workspace</InputLabel>
                <Select
                  labelId="team-invite-role-label"
                  label="Role Workspace"
                  value={inviteForm.role}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, role: e.target.value })
                  }
                >
                  <MenuItem value="">
                    <em>Pilih Role...</em>
                  </MenuItem>
                  {validRoles.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <Button
                fullWidth
                type="submit"
                variant="contained"
                color="primary"
                disabled={isInviting}
                startIcon={
                  isInviting ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <Mail size={16} />
                  )
                }
                sx={{
                  height: 40,
                  fontWeight: 600,
                  textTransform: "none",
                  borderRadius: 2,
                }}
              >
                {isInviting ? "Mengirim..." : "Kirim Undangan"}
              </Button>
            </Grid>
          </Grid>
        </Box>

        {inviteError && (
          <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
            {inviteError}
          </Alert>
        )}
        {inviteSuccess && (
          <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>
            {inviteSuccess}
          </Alert>
        )}
      </Paper>

      {/* List Section */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: "action.hover",
                color: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Users size={18} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1rem" }}>
              Anggota Tim Aktif
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Chip
              label={`${teamMembers.length} Anggota`}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
            {process.env.NODE_ENV === "development" && (
              <Button
                size="small"
                variant="outlined"
                color="info"
                onClick={async () => {
                  try {
                    const { diagnoseRoleInconsistencies } =
                      await import("../../../lib/api/company");
                    const result = await diagnoseRoleInconsistencies(
                      company.id,
                    );
                    alert(
                      `Found ${result.inconsistencies_found} role inconsistencies. Check console for details.`,
                    );
                  } catch (err) {
                    alert("Diagnosis failed. Check console for details.");
                  }
                }}
                sx={{ textTransform: "none", fontSize: "0.75rem", py: 0.2 }}
              >
                Diagnosa
              </Button>
            )}
          </Box>
        </Box>

        {teamLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={32} color="primary" />
          </Box>
        ) : teamMembers.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 5,
              textAlign: "center",
              borderRadius: 3,
              border: "1px dashed",
              borderColor: "divider",
              bgcolor: "action.hover",
            }}
          >
            <Users size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
            <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
              Belum ada anggota tim. Undang rekan kerja pertama Anda!
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {teamMembers.map((member) => (
              <Grid size={{ xs: 12, md: 6, xl: 4 }} key={member.id}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      borderColor: "primary.main",
                      boxShadow: (theme) =>
                        theme.palette.mode === "dark"
                          ? "0 4px 16px rgba(0,0,0,0.4)"
                          : "0 4px 16px rgba(239, 125, 0, 0.08)",
                    },
                  }}
                >
                  <Avatar
                    src={member.profile_photo_url}
                    alt={member.name || "Member"}
                    sx={{
                      width: 44,
                      height: 44,
                      bgcolor: "primary.main",
                      fontWeight: 700,
                      fontSize: "1rem",
                    }}
                  >
                    {member.name?.charAt(0).toUpperCase() || "?"}
                  </Avatar>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, color: "text.primary" }}
                      noWrap
                    >
                      {member.name || "Pengguna Tanpa Nama"}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary", display: "block" }}
                      noWrap
                    >
                      {member.email || member.whatsapp}
                    </Typography>
                  </Box>

                  {/* Role Section */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {editingUserId === member.id ? (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <FormControl size="small" sx={{ minWidth: 100 }}>
                          <Select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            disabled={updatingRole}
                            sx={{ fontSize: "0.75rem", height: 32 }}
                          >
                            {validRoles.map((role) => (
                              <MenuItem key={role.value} value={role.value} sx={{ fontSize: "0.8rem" }}>
                                {role.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleRoleSave(member.id)}
                          disabled={updatingRole}
                          title="Simpan perubahan"
                        >
                          {updatingRole ? <Loader2 size={14} className="animate-spin" /> : <Check size={16} />}
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={handleRoleCancel}
                          disabled={updatingRole}
                          title="Batal"
                        >
                          <CloseIcon size={16} />
                        </IconButton>
                      </Box>
                    ) : (
                      <>
                        <Chip
                          label={member.role}
                          size="small"
                          color={!member.role_id ? "error" : "primary"}
                          variant="outlined"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.7rem",
                            textTransform: "uppercase",
                            height: 24,
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleRoleEdit(member.id, member.role, member.role_id)}
                          title="Edit role"
                          sx={{
                            color: "text.secondary",
                            "&:hover": { color: "primary.main" },
                          }}
                        >
                          <Settings size={15} />
                        </IconButton>
                      </>
                    )}
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};
