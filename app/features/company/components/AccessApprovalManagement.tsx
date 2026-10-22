import React, { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Plus, Save, ShieldCheck, Trash2, Users, Workflow } from "lucide-react";
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
    for (const permission of config?.permission_catalog || []) (groups[permission.category] ||= []).push(permission);
    return groups;
  }, [config]);

  const editRole = (role: Role) => {
    setEditingRole(role);
    setRoleForm({ name: role.name, description: role.description || "", permission_keys: role.permissions.map((permission) => permission.key) });
    setNotice(null); setError(null);
  };

  const resetRole = () => { setEditingRole(null); setRoleForm(emptyRole); };

  const saveRole = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!company?.id || !roleForm.name.trim()) return;
    setSaving(true); setError(null);
    try {
      const payload = { ...roleForm, name: roleForm.name.trim() };
      if (editingRole) await updateCompanyRole(company.id, editingRole.id, payload);
      else await createCompanyRole(company.id, payload);
      setNotice(editingRole ? "Role dan aksesnya diperbarui." : "Role baru siap digunakan untuk anggota team.");
      resetRole(); await load();
    } catch (e: any) { setError(e?.message || "Role gagal disimpan."); }
    finally { setSaving(false); }
  };

  const removeRole = async (role: Role) => {
    if (!company?.id || role.is_system || !window.confirm(`Hapus role ${role.name}?`)) return;
    setSaving(true); setError(null);
    try { await deleteCompanyRole(company.id, role.id); setNotice("Role dihapus."); await load(); }
    catch (e: any) { setError(e?.message || "Role tidak dapat dihapus."); }
    finally { setSaving(false); }
  };

  const addPermission = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!company?.id || !customPermission.trim()) return;
    setSaving(true); setError(null);
    try {
      const response = await createCompanyPermission(company.id, { name: customPermission.trim() });
      setRoleForm((form) => ({ ...form, permission_keys: [...form.permission_keys, response.permission.key] }));
      setCustomPermission(""); setNotice("Permission khusus ditambahkan dan dipilih pada role ini."); await load();
    } catch (e: any) { setError(e?.message || "Permission khusus gagal ditambahkan."); }
    finally { setSaving(false); }
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
    } : { name: "", subject_type: "purchase_request", min_amount: "", max_amount: "", is_active: true, steps: config?.roles?.length ? [{ company_role_id: config.roles[0].id, name: "", required_approvals: 1 }] : [] });
    setNotice(null); setError(null);
  };

  const saveFlow = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!company?.id || !flowForm.name.trim() || !flowForm.steps.length) return;
    setSaving(true); setError(null);
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
      setEditingFlow(null); await load();
    } catch (e: any) { setError(e?.message || "Alur approval gagal disimpan."); }
    finally { setSaving(false); }
  };

  const removeFlow = async (flow: Flow) => {
    if (!company?.id || !window.confirm(`Hapus alur ${flow.name}?`)) return;
    setSaving(true); setError(null);
    try { await deleteApprovalFlow(company.id, flow.id); setNotice("Alur approval dihapus."); await load(); }
    catch (e: any) { setError(e?.message || "Alur approval tidak dapat dihapus."); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="py-16 flex justify-center"><Loader2 className="animate-spin text-orange-500" size={22} /></div>;
  if (!config) return <div className="p-4 border border-red-500/20 bg-red-500/5 text-red-500 text-sm">{error || "Konfigurasi akses tidak tersedia."}</div>;

  const selected = new Set(roleForm.permission_keys);
  const togglePermission = (key: string) => setRoleForm((form) => ({ ...form, permission_keys: form.permission_keys.includes(key) ? form.permission_keys.filter((item) => item !== key) : [...form.permission_keys, key] }));

  return (
    <div className="space-y-5">
      <section className="border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 border-b border-[var(--ui-border)] pb-4">
          <div className="flex gap-3">
            <div className="w-9 h-9 grid place-items-center bg-orange-500 text-white"><ShieldCheck size={18} /></div>
            <div><h3 className="font-bold text-[var(--ui-text-primary)]">Access roles</h3><p className="text-xs text-[var(--ui-text-muted)] mt-1">Buat jabatan sesuai struktur perusahaan lalu pilih akses yang benar-benar dibutuhkan.</p></div>
          </div>
          <span className="text-xs text-[var(--ui-text-muted)]">Berlaku untuk workspace {company.type === "vendor" ? "vendor" : "buyer"}</span>
        </div>

        {notice && <div className="mt-4 px-3 py-2 text-xs text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2"><Check size={14} />{notice}</div>}
        {error && <div className="mt-4 px-3 py-2 text-xs text-red-600 bg-red-500/10 border border-red-500/20">{error}</div>}

        <div className="grid xl:grid-cols-[1.05fr_.95fr] gap-5 mt-5">
          <div className="space-y-2">
            {config.roles.map((role) => (
              <div key={role.id} className={`border p-3 flex items-start gap-3 ${editingRole?.id === role.id ? "border-orange-500" : "border-[var(--ui-border)]"}`}>
                <div className="w-8 h-8 shrink-0 grid place-items-center bg-[var(--ui-bg-input)] text-orange-500"><Users size={15} /></div>
                <button type="button" onClick={() => editRole(role)} className="text-left flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-bold text-[var(--ui-text-primary)]">{role.name}</span>{role.is_system && <span className="text-[10px] px-1.5 py-0.5 bg-slate-500/10 text-[var(--ui-text-muted)]">Default</span>}</div>
                  <p className="text-xs text-[var(--ui-text-muted)] mt-1 line-clamp-1">{role.description || `${role.permissions.length} permissions`}</p>
                  <p className="text-[10px] text-[var(--ui-text-muted)] mt-2">{role.member_count} member · {role.permissions.length} permissions</p>
                </button>
                {!role.is_system && <button onClick={() => removeRole(role)} title="Hapus role" className="p-1.5 text-[var(--ui-text-muted)] hover:text-red-500"><Trash2 size={14} /></button>}
              </div>
            ))}
          </div>

          <form onSubmit={saveRole} className="border border-[var(--ui-border)] bg-[var(--ui-bg-input)] p-4">
            <div className="flex items-center justify-between gap-3"><h4 className="font-bold text-sm text-[var(--ui-text-primary)]">{editingRole ? `Edit ${editingRole.name}` : "Role baru"}</h4>{editingRole && <button type="button" onClick={resetRole} className="text-xs text-[var(--ui-text-muted)]">Batal</button>}</div>
            <div className="grid sm:grid-cols-2 gap-3 mt-4"><Field label="Nama jabatan" value={roleForm.name} onChange={(name) => setRoleForm({ ...roleForm, name })} placeholder="Contoh: Head of Procurement" /><Field label="Deskripsi" value={roleForm.description} onChange={(description) => setRoleForm({ ...roleForm, description })} placeholder="Tanggung jawab utama" /></div>
            <div className="mt-4 space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {Object.entries(permissionGroups).map(([group, permissions]) => <div key={group}><p className="text-[10px] font-bold uppercase tracking-wide text-[var(--ui-text-muted)] mb-1.5">{group}</p><div className="grid sm:grid-cols-2 gap-1.5">{permissions.map((permission) => <label key={permission.key} className="flex gap-2 items-start border border-[var(--ui-border)] bg-[var(--ui-bg-card)] px-2.5 py-2 cursor-pointer"><input type="checkbox" checked={selected.has(permission.key)} onChange={() => togglePermission(permission.key)} className="mt-0.5 accent-orange-500" /><span><span className="block text-xs font-semibold text-[var(--ui-text-primary)]">{permission.name}</span><span className="block text-[10px] text-[var(--ui-text-muted)] leading-snug">{permission.description}</span></span></label>)}</div></div>)}
            </div>
            <div className="mt-4 flex gap-2"><input value={customPermission} onChange={(event) => setCustomPermission(event.target.value)} className="min-w-0 flex-1 px-3 py-2 bg-[var(--ui-bg-card)] border border-[var(--ui-border)] text-sm text-[var(--ui-text-primary)]" placeholder="Permission khusus, mis. Approve budget" /><button type="button" onClick={(event) => addPermission(event as any)} disabled={saving || !customPermission.trim()} className="px-3 py-2 border border-[var(--ui-border)] text-xs font-semibold text-[var(--ui-text-primary)]"><Plus size={14} /></button></div>
            <button disabled={saving || !roleForm.name.trim()} className="mt-4 w-full px-3 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold flex justify-center gap-2 items-center">{saving ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />}{editingRole ? "Simpan role" : "Buat role"}</button>
          </form>
        </div>
      </section>

      <section className="border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-[var(--ui-border)] pb-4"><div className="flex gap-3"><div className="w-9 h-9 grid place-items-center bg-[var(--ui-bg-input)] text-orange-500"><Workflow size={18} /></div><div><h3 className="font-bold text-[var(--ui-text-primary)]">Approval flows</h3><p className="text-xs text-[var(--ui-text-muted)] mt-1">Atur persetujuan berurutan sesuai birokrasi perusahaan. Tahap berikutnya aktif setelah tahap sebelumnya menyetujui.</p></div></div><button type="button" onClick={() => beginFlow()} className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold flex items-center justify-center gap-2"><Plus size={15} />Buat alur</button></div>

        {flowForm.steps.length > 0 ? <form onSubmit={saveFlow} className="mt-5 border border-[var(--ui-border)] bg-[var(--ui-bg-input)] p-4"><div className="flex items-center justify-between"><h4 className="font-bold text-sm text-[var(--ui-text-primary)]">{editingFlow ? "Edit alur approval" : "Alur approval baru"}</h4><button type="button" onClick={() => { setEditingFlow(null); setFlowForm({ name: "", subject_type: "purchase_request", min_amount: "", max_amount: "", is_active: true, steps: [] }); }} className="text-xs text-[var(--ui-text-muted)]">Tutup</button></div><div className="grid md:grid-cols-3 gap-3 mt-4"><Field label="Nama alur" value={flowForm.name} onChange={(name) => setFlowForm({ ...flowForm, name })} placeholder="PR di atas Rp50 juta" /><Select label="Dokumen" value={flowForm.subject_type} onChange={(subject_type) => setFlowForm({ ...flowForm, subject_type })} options={Object.entries(config.subjects).map(([value, label]) => ({ value, label }))} /><Field label="Minimal nilai (opsional)" type="number" value={flowForm.min_amount} onChange={(min_amount) => setFlowForm({ ...flowForm, min_amount })} placeholder="0" /></div><div className="mt-4"><p className="text-xs font-bold text-[var(--ui-text-muted)] uppercase tracking-wide">Tahapan berurutan</p><div className="space-y-2 mt-2">{flowForm.steps.map((step, index) => <div key={index} className="grid grid-cols-[28px_1fr_34px] gap-2 items-center"><span className="w-7 h-7 grid place-items-center bg-orange-500/10 text-orange-500 text-xs font-bold">{index + 1}</span><select value={step.company_role_id} onChange={(event) => setFlowForm((form) => ({ ...form, steps: form.steps.map((item, itemIndex) => itemIndex === index ? { ...item, company_role_id: event.target.value } : item) }))} className="px-3 py-2 bg-[var(--ui-bg-card)] border border-[var(--ui-border)] text-sm text-[var(--ui-text-primary)]">{config.roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select><button type="button" disabled={flowForm.steps.length === 1} onClick={() => setFlowForm((form) => ({ ...form, steps: form.steps.filter((_, itemIndex) => itemIndex !== index) }))} className="p-2 text-[var(--ui-text-muted)] hover:text-red-500 disabled:opacity-30"><Trash2 size={15} /></button></div>)}</div><button type="button" onClick={() => setFlowForm((form) => ({ ...form, steps: [...form.steps, { company_role_id: config.roles[0]?.id || "", name: "", required_approvals: 1 }] }))} className="mt-3 text-xs text-orange-600 font-semibold flex items-center gap-1"><Plus size={14} />Tambah tahap</button></div><button disabled={saving || !flowForm.name.trim() || !flowForm.steps.length} className="mt-5 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold flex items-center gap-2">{saving ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />}{editingFlow ? "Simpan perubahan" : "Aktifkan alur"}</button></form> : null}

        <div className="mt-4 divide-y divide-[var(--ui-border)] border-t border-[var(--ui-border)]">{config.flows.length === 0 ? <p className="py-6 text-sm text-[var(--ui-text-muted)]">Belum ada alur custom. Tanpa alur, sistem tetap menggunakan approval manager yang sudah ada.</p> : config.flows.map((flow) => <div key={flow.id} className="py-3 flex flex-col md:flex-row md:items-center gap-3"><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-sm text-[var(--ui-text-primary)]">{flow.name}</span><span className={`text-[10px] px-1.5 py-0.5 ${flow.is_active ? "text-emerald-600 bg-emerald-500/10" : "text-[var(--ui-text-muted)] bg-slate-500/10"}`}>{flow.is_active ? "Active" : "Inactive"}</span></div><p className="text-xs text-[var(--ui-text-muted)] mt-1">{config.subjects[flow.subject_type]} · {flow.steps.map((step) => step.role?.name || "Role").join(" → ")}</p></div><div className="flex gap-2"><button onClick={() => beginFlow(flow)} className="px-2.5 py-1.5 border border-[var(--ui-border)] text-xs font-semibold text-[var(--ui-text-primary)]">Edit</button><button onClick={() => removeFlow(flow)} className="px-2 py-1.5 text-red-500"><Trash2 size={15} /></button></div></div>)}</div>
      </section>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return <label className="block"><span className="block text-xs font-semibold text-[var(--ui-text-muted)] mb-1.5">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full px-3 py-2 bg-[var(--ui-bg-card)] border border-[var(--ui-border)] text-sm text-[var(--ui-text-primary)]" /></label>;
}
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return <label className="block"><span className="block text-xs font-semibold text-[var(--ui-text-muted)] mb-1.5">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full px-3 py-2 bg-[var(--ui-bg-card)] border border-[var(--ui-border)] text-sm text-[var(--ui-text-primary)]">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}
