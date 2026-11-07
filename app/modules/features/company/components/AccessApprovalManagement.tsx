import React, { useEffect, useMemo, useState } from "react";
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
  Checkbox,
  FormControlLabel,
  Divider,
  Grid,
} from "@mui/material";
import {
  ShieldCheck,
  Users,
  Workflow,
  Plus,
  Save,
  Trash2,
  Check,
} from "lucide-react";
import {
  createApprovalFlow,
  createCompanyPermission,
  createCompanyRole,
  deleteApprovalFlow,
  deleteCompanyRole,
  getCompanyAccess,
  updateApprovalFlow,
  updateCompanyRole,
} from "../../../lib/api/company";

type Role = { id: string; name: string; slug: string; description?: string; is_system: boolean; member_count: number; permissions: Permission[] };
type Permission = { id: string; key: string; name: string; category: string; description?: string };
type Step = { id?: string; name?: string; company_role_id: string; required_approvals?: number; role?: Role };
type Flow = { id: string; name: string; subject_type: string; min_amount?: string | null; max_amount?: string | null; is_active: boolean; steps: Step[] };

type AccessConfig = { roles: Role[]; permission_catalog: Permission[]; flows: Flow[]; subjects: Record<string, string> };

const emptyRole = { name: "", description: "", permission_keys: [] as string[] };

export function AccessApprovalManagement({ company }: { company: any }) {
  const [config, setConfig] = useState<AccessConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [roleForm, setRoleForm] = useState(emptyRole);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [customPermission, setCustomPermission] = useState("");
  const [flowForm, setFlowForm] = useState({ name: "", subject_type: "purchase_request", min_amount: "", max_amount: "", is_active: true, steps: [] as Step[] });
  const [editingFlow, setEditingFlow] = useState<Flow | null>(null);

  const load = async () => {
    if (!company?.id) return;
    setLoading(true);
    try {
      const data = await getCompanyAccess(company.id);
      setConfig(data);
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Konfigurasi akses tidak dapat dimuat.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [company?.id]);

  const permissionGroups = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    for (const permission of config?.permission_catalog || []) {
      (groups[permission.category] ||= []).push(permission);
    }
    return groups;
  }, [config]);

  const editRole = (role: Role) => {
    setEditingRole(role);
    setRoleForm({ name: role.name, description: role.description || "", permission_keys: role.permissions.map((p) => p.key) });
    setNotice(null);
    setError(null);
  };

  const resetRole = () => {
    setEditingRole(null);
    setRoleForm(emptyRole);
  };

  const saveRole = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!company?.id || !roleForm.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload = { ...roleForm, name: roleForm.name.trim() };
      if (editingRole) await updateCompanyRole(company.id, editingRole.id, payload);
      else await createCompanyRole(company.id, payload);
      setNotice(editingRole ? "Role dan aksesnya diperbarui." : "Role baru siap digunakan untuk anggota team.");
      resetRole();
      await load();
    } catch (e: any) {
      setError(e?.message || "Role gagal disimpan.");
    } finally {
      setSaving(false);
    }
  };

  const removeRole = async (role: Role) => {
    if (!company?.id || role.is_system || !window.confirm(`Hapus role ${role.name}?`)) return;
    setSaving(true);
    setError(null);
    try {
      await deleteCompanyRole(company.id, role.id);
      setNotice("Role dihapus.");
      await load();
    } catch (e: any) {
      setError(e?.message || "Role tidak dapat dihapus.");
    } finally {
      setSaving(false);
    }
  };

  const addPermission = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!company?.id || !customPermission.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const response = await createCompanyPermission(company.id, { name: customPermission.trim() });
      setRoleForm((form) => ({ ...form, permission_keys: [...form.permission_keys, response.permission.key] }));
      setCustomPermission("");
      setNotice("Permission khusus ditambahkan dan dipilih pada role ini.");
      await load();
    } catch (e: any) {
      setError(e?.message || "Permission khusus gagal ditambahkan.");
    } finally {
      setSaving(false);
    }
  };

  const beginFlow = (flow?: Flow) => {
    setEditingFlow(flow || null);
    setFlowForm(flow ? {
      name: flow.name,
      subject_type: flow.subject_type,
      min_amount: flow.min_amount || "",
      max_amount: flow.max_amount || "",
      is_active: flow.is_active,
      steps: flow.steps.map((step) => ({ name: step.name || "", company_role_id: step.company_role_id, required_approvals: step.required_approvals || 1 })),
    } : {
      name: "",
      subject_type: "purchase_request",
      min_amount: "",
      max_amount: "",
      is_active: true,
      steps: config?.roles?.length ? [{ company_role_id: config.roles[0].id, name: "", required_approvals: 1 }] : [],
    });
    setNotice(null);
    setError(null);
  };

  const saveFlow = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!company?.id || !flowForm.name.trim() || !flowForm.steps.length) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...flowForm,
        name: flowForm.name.trim(),
        min_amount: flowForm.min_amount === "" ? null : Number(flowForm.min_amount),
        max_amount: flowForm.max_amount === "" ? null : Number(flowForm.max_amount),
      };
      if (editingFlow) await updateApprovalFlow(company.id, editingFlow.id, payload);
      else await createApprovalFlow(company.id, payload);
      setNotice(editingFlow ? "Alur approval diperbarui." : "Alur approval aktif dan akan dipakai untuk dokumen baru.");
      setEditingFlow(null);
      await load();
    } catch (e: any) {
      setError(e?.message || "Alur approval gagal disimpan.");
    } finally {
      setSaving(false);
    }
  };

  const removeFlow = async (flow: Flow) => {
    if (!company?.id || !window.confirm(`Hapus alur ${flow.name}?`)) return;
    setSaving(true);
    setError(null);
    try {
      await deleteApprovalFlow(company.id, flow.id);
      setNotice("Alur approval dihapus.");
      await load();
    } catch (e: any) {
      setError(e?.message || "Alur approval tidak dapat dihapus.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
        <CircularProgress color="primary" size={28} />
      </Box>
    );
  }

  if (!config) {
    return (
      <Alert severity="error" sx={{ borderRadius: 2 }}>
        {error || "Konfigurasi akses tidak tersedia."}
      </Alert>
    );
  }

  const selected = new Set(roleForm.permission_keys);
  const togglePermission = (key: string) => {
    setRoleForm((form) => ({
      ...form,
      permission_keys: form.permission_keys.includes(key)
        ? form.permission_keys.filter((item) => item !== key)
        : [...form.permission_keys, key],
    }));
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Role Management Section */}
      <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { xs: "flex-start", md: "center" }, justifyContent: "space-between", pb: 2.5, borderBottom: "1px solid", borderColor: "divider", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: "primary.main", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldCheck size={20} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Role & Akses Pengguna
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Buat jabatan sesuai struktur perusahaan lalu pilih akses yang benar-benar dibutuhkan.
              </Typography>
            </Box>
          </Box>
          <Chip label={`Workspace ${company.type === "vendor" ? "Vendor" : "Buyer"}`} size="small" variant="outlined" />
        </Box>

        {notice && <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }} icon={<Check size={16} />}>{notice}</Alert>}
        {error && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{error}</Alert>}

        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Roles list */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {config.roles.map((role) => (
                <Paper
                  key={role.id}
                  elevation={0}
                  onClick={() => editRole(role)}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: editingRole?.id === role.id ? "primary.main" : "divider",
                    bgcolor: editingRole?.id === role.id ? "action.selected" : "background.paper",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1.5,
                    transition: "all 0.2s",
                    "&:hover": { borderColor: "primary.main" },
                  }}
                >
                  <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: "action.hover", color: "primary.main", display: "flex", alignItems: "center", justifyContent: "center", shrink: 0, mt: 0.5 }}>
                    <Users size={16} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{role.name}</Typography>
                      {role.is_system && <Chip label="Default" size="small" sx={{ fontSize: "0.65rem", height: 20 }} />}
                    </Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.5 }} noWrap>
                      {role.description || `${role.permissions.length} permissions`}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.5, fontSize: "0.7rem" }}>
                      {role.member_count} member · {role.permissions.length} permissions
                    </Typography>
                  </Box>
                  {!role.is_system && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => { e.stopPropagation(); removeRole(role); }}
                      title="Hapus role"
                    >
                      <Trash2 size={15} />
                    </IconButton>
                  )}
                </Paper>
              ))}
            </Box>
          </Grid>

          {/* Role form */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2, bgcolor: "action.hover", border: "1px solid", borderColor: "divider" }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {editingRole ? `Edit: ${editingRole.name}` : "Buat Role Baru"}
                </Typography>
                {editingRole && (
                  <Button size="small" onClick={resetRole} sx={{ textTransform: "none" }}>
                    Batal
                  </Button>
                )}
              </Box>

              <Box component="form" onSubmit={saveRole}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      required
                      label="Nama Jabatan"
                      placeholder="Mis. Head of Procurement"
                      value={roleForm.name}
                      onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Deskripsi"
                      placeholder="Tanggung jawab utama"
                      value={roleForm.description}
                      onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 2.5, maxHeight: 300, overflowY: "auto", pr: 1 }}>
                  {Object.entries(permissionGroups).map(([group, permissions]) => (
                    <Box key={group} sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5, color: "text.secondary", display: "block", mb: 1 }}>
                        {group}
                      </Typography>
                      <Grid container spacing={1}>
                        {permissions.map((p) => (
                          <Grid size={{ xs: 12, sm: 6 }} key={p.key}>
                            <Paper
                              elevation={0}
                              onClick={() => togglePermission(p.key)}
                              sx={{
                                p: 1,
                                borderRadius: 1.5,
                                border: "1px solid",
                                borderColor: selected.has(p.key) ? "primary.main" : "divider",
                                bgcolor: selected.has(p.key) ? "primary.lighter" : "background.paper",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 1,
                              }}
                            >
                              <Checkbox
                                size="small"
                                checked={selected.has(p.key)}
                                onChange={() => togglePermission(p.key)}
                                sx={{ p: 0.5, mt: 0.2 }}
                              />
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, display: "block", color: "text.primary" }}>
                                  {p.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.68rem", lineHeight: 1.2, display: "block" }}>
                                  {p.description}
                                </Typography>
                              </Box>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  ))}
                </Box>

                <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Permission khusus, mis. Approve budget"
                    value={customPermission}
                    onChange={(e) => setCustomPermission(e.target.value)}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={(e) => addPermission(e as any)}
                    disabled={saving || !customPermission.trim()}
                    sx={{ minWidth: 44, px: 1.5 }}
                  >
                    <Plus size={16} />
                  </Button>
                </Box>

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={saving || !roleForm.name.trim()}
                  startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
                  sx={{ mt: 2.5, fontWeight: 600, textTransform: "none", borderRadius: 2 }}
                >
                  {editingRole ? "Simpan Perubahan Role" : "Buat Role"}
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {/* Approval Flows Section */}
      <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { xs: "flex-start", md: "center" }, justifyContent: "space-between", pb: 2.5, borderBottom: "1px solid", borderColor: "divider", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: "action.hover", color: "primary.main", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Workflow size={20} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Alur Approval Dokumen
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Atur persetujuan berurutan sesuai birokrasi perusahaan. Tahap berikutnya aktif setelah tahap sebelumnya menyetujui.
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => beginFlow()}
            startIcon={<Plus size={16} />}
            sx={{ fontWeight: 600, textTransform: "none", borderRadius: 2 }}
          >
            Buat Alur Baru
          </Button>
        </Box>

        {flowForm.steps.length > 0 && (
          <Paper elevation={0} sx={{ p: 2.5, my: 3, borderRadius: 2, bgcolor: "action.hover", border: "1px solid", borderColor: "divider" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {editingFlow ? "Edit Alur Approval" : "Buat Alur Approval Baru"}
              </Typography>
              <Button
                size="small"
                onClick={() => {
                  setEditingFlow(null);
                  setFlowForm({ name: "", subject_type: "purchase_request", min_amount: "", max_amount: "", is_active: true, steps: [] });
                }}
                sx={{ textTransform: "none" }}
              >
                Tutup
              </Button>
            </Box>

            <Box component="form" onSubmit={saveFlow}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    required
                    label="Nama Alur"
                    placeholder="PR di atas Rp50 juta"
                    value={flowForm.name}
                    onChange={(e) => setFlowForm({ ...flowForm, name: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="flow-subject-label">Jenis Dokumen</InputLabel>
                    <Select
                      labelId="flow-subject-label"
                      label="Jenis Dokumen"
                      value={flowForm.subject_type}
                      onChange={(e) => setFlowForm({ ...flowForm, subject_type: e.target.value })}
                    >
                      {Object.entries(config.subjects).map(([val, label]) => (
                        <MenuItem key={val} value={val}>{label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Minimal Nilai (Opsional)"
                    placeholder="0"
                    value={flowForm.min_amount}
                    onChange={(e) => setFlowForm({ ...flowForm, min_amount: e.target.value })}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, textTransform: "uppercase", color: "text.secondary" }}>
                  Tahapan Persetujuan Berurutan
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1.5 }}>
                  {flowForm.steps.map((step, index) => (
                    <Box key={index} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Box sx={{ width: 28, height: 28, borderRadius: 1.5, bgcolor: "primary.lighter", color: "primary.main", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.8rem", shrink: 0 }}>
                        {index + 1}
                      </Box>
                      <FormControl fullWidth size="small">
                        <Select
                          value={step.company_role_id}
                          onChange={(e) =>
                            setFlowForm((form) => ({
                              ...form,
                              steps: form.steps.map((item, itemIdx) =>
                                itemIdx === index ? { ...item, company_role_id: e.target.value } : item
                              ),
                            }))
                          }
                        >
                          {config.roles.map((role) => (
                            <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <IconButton
                        size="small"
                        color="error"
                        disabled={flowForm.steps.length === 1}
                        onClick={() =>
                          setFlowForm((form) => ({
                            ...form,
                            steps: form.steps.filter((_, itemIdx) => itemIdx !== index),
                          }))
                        }
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
                <Button
                  size="small"
                  onClick={() =>
                    setFlowForm((form) => ({
                      ...form,
                      steps: [...form.steps, { company_role_id: config.roles[0]?.id || "", name: "", required_approvals: 1 }],
                    }))
                  }
                  startIcon={<Plus size={14} />}
                  sx={{ mt: 1.5, textTransform: "none", fontWeight: 600 }}
                >
                  Tambah Tahap
                </Button>
              </Box>

              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={saving || !flowForm.name.trim() || !flowForm.steps.length}
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
                sx={{ mt: 3, fontWeight: 600, textTransform: "none", borderRadius: 2 }}
              >
                {editingFlow ? "Simpan Perubahan Alur" : "Aktifkan Alur"}
              </Button>
            </Box>
          </Paper>
        )}

        <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 1.5 }}>
          {config.flows.length === 0 ? (
            <Typography variant="body2" sx={{ py: 3, color: "text.secondary", textAlign: "center" }}>
              Belum ada alur approval custom. Tanpa alur custom, sistem menggunakan approval manager standar.
            </Typography>
          ) : (
            config.flows.map((flow) => (
              <Paper
                key={flow.id}
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: { xs: "flex-start", sm: "center" },
                  justifyContent: "space-between",
                  gap: 1.5,
                }}
              >
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{flow.name}</Typography>
                    <Chip
                      label={flow.is_active ? "Aktif" : "Nonaktif"}
                      size="small"
                      color={flow.is_active ? "success" : "default"}
                      sx={{ fontSize: "0.65rem", height: 20 }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.5 }}>
                    {config.subjects[flow.subject_type]} · {flow.steps.map((step) => step.role?.name || "Role").join(" → ")}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button size="small" variant="outlined" onClick={() => beginFlow(flow)} sx={{ textTransform: "none" }}>
                    Edit
                  </Button>
                  <IconButton size="small" color="error" onClick={() => removeFlow(flow)}>
                    <Trash2 size={16} />
                  </IconButton>
                </Box>
              </Paper>
            ))
          )}
        </Box>
      </Paper>
    </Box>
  );
}
