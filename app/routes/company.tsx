import React from "react";
import Layout from "../components/Layout";
import { 
  Building2, MapPin, CreditCard, FileText, Users, Plus, X,
  Loader2, AlertCircle, Camera, ShieldCheck, Activity, Award,
  BarChart3, Download, CheckCircle2, Globe, Mail, Phone, Tag,
  Hash, Calendar, TrendingUp, Star
} from "lucide-react";
import { useCompanyViewModel } from "../features/company/hooks/useCompanyViewModel";
import { TeamManagement } from "../features/company/components/TeamManagement";
import { getAssetUrl } from "../lib/assets";

export default function CompanyDetails() {
  const vm = useCompanyViewModel();
  const [profileBannerDismissed, setProfileBannerDismissed] = React.useState(false);

  const statusCfg: any = {
    approved: { cls: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-500" },
    pending:  { cls: "text-amber-500  bg-amber-500/10  border-amber-500/20",  dot: "bg-amber-500"  },
    rejected: { cls: "text-red-500    bg-red-500/10    border-red-500/20",    dot: "bg-red-500"    },
  };

  const tabs = [
    { id: "profile",     label: "Identity",    icon: Building2  },
    { id: "location",    label: "Location",    icon: MapPin     },
    { id: "banking",     label: "Banking",     icon: CreditCard },
    { id: "documents",   label: "Legal Docs",  icon: ShieldCheck},
    { id: "performance", label: "Performance", icon: Activity   },
    { id: "team",        label: "Team",        icon: Users      },
  ];

  const missingFields = React.useMemo(() => {
    if (!vm.company) return [];
    const f: string[] = [];
    if (!vm.company.logo_url && !vm.company.logo_path) f.push("Logo");
    if (!vm.company.address) f.push("Address");
    if (!vm.company.bank_name) f.push("Bank");
    if (!vm.company.documents || vm.company.documents.length === 0) f.push("Docs");
    if (!vm.company.hq_addresses || (Array.isArray(vm.company.hq_addresses) && vm.company.hq_addresses.length === 0)) f.push("HQ");
    if (!vm.company.about) f.push("About");
    return f;
  }, [vm.company]);

  if (vm.loading) {
    return (
      <Layout title="Company" subtitle="Loading...">
        <div className="flex items-center justify-center min-h-[50vh] gap-3">
          <Loader2 size={28} className="animate-spin text-orange-500" />
          <span className="text-sm text-[var(--ui-text-muted)]">Loading workspace...</span>
        </div>
      </Layout>
    );
  }

  /* ── Select Workspace ─────────────────────────────────────────────── */
  if (!vm.showCompanyWorkspace) {
    return (
      <Layout title="Company" subtitle="Select workspace">
        <div className="w-full">
          {vm.companyListLoading ? (
            <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-orange-500" /></div>
          ) : vm.companies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <Building2 size={28} className="text-orange-500" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-[var(--ui-text-primary)] mb-1">No company workspaces</p>
                <p className="text-sm text-[var(--ui-text-muted)]">Register your first company to get started.</p>
              </div>
              <button onClick={() => vm.navigate("/onboarding")} style={{ color: 'white' }} className="px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-sm font-semibold transition-all">
                Register a Company
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Register new — as a ghost card */}
              <button
                onClick={() => vm.navigate("/onboarding")}
                className="text-left p-4 rounded-xl border border-dashed border-[var(--ui-border)] bg-transparent hover:border-orange-500/40 hover:bg-orange-500/3 transition-all flex flex-col items-center justify-center gap-2 min-h-[120px]"
              >
                <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Plus size={18} className="text-orange-500" />
                </div>
                <span className="text-sm font-semibold text-[var(--ui-text-muted)]">Register Company</span>
              </button>

              {vm.companies.map((c: any) => {
                const active = vm.selectedWorkspace?.id === c.id;
                const cfg = statusCfg[c.status] || statusCfg.pending;
                return (
                  <button
                    key={c.id}
                    onClick={() => vm.openCompanyWorkspace(c)}
                    className={`text-left p-4 rounded-xl border transition-all hover:-translate-y-0.5 ${
                      active ? "border-orange-500/60 bg-orange-500/5 shadow-md shadow-orange-500/8" : "border-[var(--ui-border)] bg-[var(--ui-bg-card)] hover:border-orange-500/30"
                    }`}
                  >
                    {/* Logo + Name row */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-[var(--ui-bg-input)] flex items-center justify-center overflow-hidden border border-[var(--ui-border)] flex-shrink-0">
                        {c.logo_url || c.logo_path
                          ? <img src={getAssetUrl(c.logo_url || c.logo_path)} className="w-full h-full object-cover" alt="" />
                          : <Building2 size={18} className="text-orange-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-[var(--ui-text-primary)] truncate">{c.name}</div>
                        <span className="text-[10px] font-bold uppercase text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded">{c.type}</span>
                      </div>
                      {active && <CheckCircle2 size={16} className="text-orange-500 flex-shrink-0" />}
                    </div>
                    {/* Meta */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs text-[var(--ui-text-muted)] truncate">{c.formatted_tax_id || c.tax_id || "—"}</span>
                        {(c.formatted_tax_id || c.tax_id) && (
                          <span
                            className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0"
                            title="NPWP Terverifikasi"
                          >
                            <CheckCircle2 size={10} className="text-sky-400" />
                            <span>Verified</span>
                          </span>
                        )}
                      </div>
                      <div className={`flex items-center gap-1 text-xs font-semibold capitalize shrink-0 ${cfg.cls.split(' ')[0]}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {c.status}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Layout>
    );
  }

  /* ── Company Details ──────────────────────────────────────────────── */
  const cfg = statusCfg[vm.company.status] || statusCfg.pending;
  const winRate = vm.company.stats?.total_proposals > 0
    ? Math.round((vm.company.stats.won_proposals / vm.company.stats.total_proposals) * 100)
    : 0;

  return (
    <Layout title={vm.company.name} subtitle="Company Workspace">
      <div className="flex flex-col gap-0 w-full">

        {/* Missing fields banner */}
        {!profileBannerDismissed && missingFields.length > 0 && (
          <div className="mb-4 p-3 px-4 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <AlertCircle size={14} className="text-amber-500 flex-shrink-0" />
              <span className="text-xs text-amber-600 font-semibold">Complete profile:</span>
              <span className="text-xs text-[var(--ui-text-secondary)] truncate">{missingFields.join(" · ")}</span>
            </div>
            <button onClick={() => setProfileBannerDismissed(true)} className="text-amber-500 hover:text-amber-600 flex-shrink-0" aria-label="Dismiss">
              <X size={14} />
            </button>
          </div>
        )}

        {vm.updateError && (
          <div className="mb-4 p-3 px-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-semibold flex items-center gap-2">
            <AlertCircle size={14} /> {vm.updateError}
          </div>
        )}

        {/* ── Responsive layout: stack on mobile, side-by-side on lg+ ── */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start w-full">

          {/* ── MOBILE compact profile header (hidden on lg+) ── */}
          <div className="lg:hidden w-full">
            <div className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] overflow-hidden">
              {/* Cover gradient */}
              <div className="h-12 bg-gradient-to-br from-orange-500/20 via-orange-400/10 to-transparent relative">
                <div className={`absolute top-2 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${cfg.cls}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {vm.company.status}
                </div>
              </div>
              <div className="px-4 -mt-6 pb-4">
                <div className="flex items-end gap-3">
                  {/* Logo */}
                  <div className="relative group flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-[var(--ui-bg-input)] border-2 border-[var(--ui-bg-card)] flex items-center justify-center overflow-hidden shadow-md">
                      {vm.company.logo_url || vm.company.logo_path
                        ? <img src={getAssetUrl(vm.company.logo_url || vm.company.logo_path)} className="w-full h-full object-cover" alt={vm.company.name} />
                        : <Building2 size={18} className="text-orange-500" />}
                      <button
                        onClick={() => document.getElementById('logo-upload-mobile')?.click()}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all rounded-xl"
                        aria-label="Upload logo"
                      >
                        <Camera size={13} className="text-white" />
                      </button>
                    </div>
                    {vm.logoUploading && (
                      <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                        <Loader2 size={12} className="animate-spin text-white" />
                      </div>
                    )}
                    <input id="logo-upload-mobile" type="file" className="hidden" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) vm.handleLogoUpload(f); }} />
                  </div>
                  {/* Name + type */}
                  <div className="flex-1 min-w-0 pt-2">
                    <h2 className="text-sm font-bold text-[var(--ui-text-primary)] truncate leading-snug">{vm.company.name}</h2>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] font-bold uppercase text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded">{vm.company.type}</span>
                      {vm.company.city && (
                        <span className="text-[10px] text-[var(--ui-text-muted)] flex items-center gap-0.5">
                          <MapPin size={9} className="text-orange-500" />
                          {vm.company.city}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick stats row */}
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] px-2.5 py-2 text-center">
                    <div className="text-base font-bold text-[var(--ui-text-primary)]">
                      {vm.company.type === 'buyer' ? (vm.company.stats?.total_pr || 0) : (vm.company.stats?.total_proposals || 0)}
                    </div>
                    <div className="text-[10px] text-[var(--ui-text-muted)] mt-0.5">{vm.company.type === 'buyer' ? 'Total PR' : 'Total Bids'}</div>
                  </div>
                  <div className="rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] px-2.5 py-2 text-center">
                    <div className="text-base font-bold text-[var(--ui-text-primary)]">
                      {vm.company.type === 'buyer' ? (vm.company.stats?.approved_pr || 0) : (vm.company.stats?.won_proposals || 0)}
                    </div>
                    <div className="text-[10px] text-[var(--ui-text-muted)] mt-0.5">{vm.company.type === 'buyer' ? 'Approved' : 'Won'}</div>
                  </div>
                  <div className="rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] px-2.5 py-2 text-center">
                    <div className="text-base font-bold text-[var(--ui-text-primary)]">{winRate}%</div>
                    <div className="text-[10px] text-[var(--ui-text-muted)] mt-0.5">Win Rate</div>
                  </div>
                </div>

                {/* Mobile action button */}
                <div className="mt-3">
                  {!vm.isEditing ? (
                    <button
                      onClick={() => vm.setIsEditing(true)}
                      className="w-full px-4 py-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-primary)] font-semibold text-sm hover:border-orange-500/40 transition-all"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={vm.handleSaveCompany}
                        disabled={vm.updatingCompany}
                        style={{ color: 'white' }}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 font-semibold text-sm transition-all flex items-center justify-center gap-2"
                      >
                        {vm.updatingCompany ? <Loader2 size={14} className="animate-spin" /> : "Save Changes"}
                      </button>
                      <button
                        onClick={() => vm.setIsEditing(false)}
                        className="px-4 py-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-secondary)] font-medium text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── DESKTOP LEFT SIDEBAR (hidden on mobile) ── */}
          <div className="hidden lg:flex w-64 flex-shrink-0 sticky top-4 flex-col gap-4">

            {/* Logo + Identity */}
            <div className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] overflow-hidden">
              {/* Cover gradient */}
              <div className="h-16 bg-gradient-to-br from-orange-500/20 via-orange-400/10 to-transparent relative">
                <div className={`absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${cfg.cls}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {vm.company.status}
                </div>
              </div>

              {/* Logo — overlaps cover */}
              <div className="px-4 -mt-7 mb-3">
                <div className="relative group w-fit">
                  <div className="w-14 h-14 rounded-xl bg-[var(--ui-bg-input)] border-2 border-[var(--ui-bg-card)] flex items-center justify-center overflow-hidden shadow-lg">
                    {vm.company.logo_url || vm.company.logo_path
                      ? <img src={getAssetUrl(vm.company.logo_url || vm.company.logo_path)} className="w-full h-full object-cover" alt={vm.company.name} />
                      : <Building2 size={22} className="text-orange-500" />}
                    <button
                      onClick={() => document.getElementById('logo-upload-2')?.click()}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all rounded-xl"
                      aria-label="Upload logo"
                    >
                      <Camera size={16} className="text-white" />
                    </button>
                  </div>
                  {vm.logoUploading && (
                    <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                      <Loader2 size={14} className="animate-spin text-white" />
                    </div>
                  )}
                  <input id="logo-upload-2" type="file" className="hidden" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) vm.handleLogoUpload(f); }} />
                </div>
              </div>

              <div className="px-4 pb-4">
                <h2 className="text-sm font-bold text-[var(--ui-text-primary)] leading-snug">{vm.company.name}</h2>
                <span className="text-[10px] font-bold uppercase text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded mt-1 inline-block">{vm.company.type}</span>

                {vm.company.about && (
                  <p className="text-xs text-[var(--ui-text-muted)] mt-2.5 leading-relaxed line-clamp-3">{vm.company.about}</p>
                )}

                <div className="mt-3 space-y-1.5">
                  {vm.company.email && (
                    <div className="flex items-center gap-2 text-xs text-[var(--ui-text-muted)]">
                      <Mail size={11} className="text-orange-500 flex-shrink-0" />
                      <span className="truncate">{vm.company.email}</span>
                    </div>
                  )}
                  {vm.company.phone && (
                    <div className="flex items-center gap-2 text-xs text-[var(--ui-text-muted)]">
                      <Phone size={11} className="text-orange-500 flex-shrink-0" />
                      <span>{vm.company.phone}</span>
                    </div>
                  )}
                  {vm.company.city && (
                    <div className="flex items-center gap-2 text-xs text-[var(--ui-text-muted)]">
                      <MapPin size={11} className="text-orange-500 flex-shrink-0" />
                      <span>{vm.company.city}{vm.company.provincy_country ? `, ${vm.company.provincy_country}` : ''}</span>
                    </div>
                  )}
                  {(vm.company.formatted_tax_id || vm.company.tax_id) && (
                    <div className="flex items-center justify-between gap-1 text-xs text-[var(--ui-text-muted)]">
                      <div className="flex items-center gap-2 truncate">
                        <Hash size={11} className="text-orange-500 flex-shrink-0" />
                        <span className="truncate">{vm.company.formatted_tax_id || vm.company.tax_id}</span>
                      </div>
                      <span
                        className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0"
                        title="NPWP Terverifikasi"
                      >
                        <CheckCircle2 size={10} className="text-sky-400" />
                        <span>Verified</span>
                      </span>
                    </div>
                  )}
                  {vm.company.industry_type && (
                    <div className="flex items-center gap-2 text-xs text-[var(--ui-text-muted)]">
                      <Tag size={11} className="text-orange-500 flex-shrink-0" />
                      <span>{vm.company.industry_type}</span>
                    </div>
                  )}
                  {vm.company.created_at && (
                    <div className="flex items-center gap-2 text-xs text-[var(--ui-text-muted)]">
                      <Calendar size={11} className="text-orange-500 flex-shrink-0" />
                      <span>Since {new Date(vm.company.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short' })}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] divide-y divide-[var(--ui-border)]">
              <div className="px-3.5 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp size={13} className="text-orange-500" />
                  <span className="text-xs font-semibold text-[var(--ui-text-muted)]">
                    {vm.company.type === 'buyer' ? 'Total PR' : 'Total Bids'}
                  </span>
                </div>
                <span className="text-sm font-bold text-[var(--ui-text-primary)]">
                  {vm.company.type === 'buyer' ? (vm.company.stats?.total_pr || 0) : (vm.company.stats?.total_proposals || 0)}
                </span>
              </div>
              <div className="px-3.5 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star size={13} className="text-emerald-500" />
                  <span className="text-xs font-semibold text-[var(--ui-text-muted)]">
                    {vm.company.type === 'buyer' ? 'Approved' : 'Won'}
                  </span>
                </div>
                <span className="text-sm font-bold text-[var(--ui-text-primary)]">
                  {vm.company.type === 'buyer' ? (vm.company.stats?.approved_pr || 0) : (vm.company.stats?.won_proposals || 0)}
                </span>
              </div>
              {vm.company.type === 'vendor' && (
                <div className="px-3.5 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={13} className="text-blue-500" />
                    <span className="text-xs font-semibold text-[var(--ui-text-muted)]">Win Rate</span>
                  </div>
                  <span className="text-sm font-bold text-[var(--ui-text-primary)]">{winRate}%</span>
                </div>
              )}
            </div>

            {/* Edit actions */}
            <div className="flex flex-col gap-2">
              {!vm.isEditing ? (
                <button
                  onClick={() => vm.setIsEditing(true)}
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-primary)] font-semibold text-sm hover:border-orange-500/40 transition-all"
                >
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={vm.handleSaveCompany}
                    disabled={vm.updatingCompany}
                    style={{ color: 'white' }}
                    className="w-full px-4 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 font-semibold text-sm transition-all flex items-center justify-center gap-2"
                  >
                    {vm.updatingCompany ? <Loader2 size={14} className="animate-spin" /> : "Save Changes"}
                  </button>
                  <button
                    onClick={() => vm.setIsEditing(false)}
                    className="w-full px-4 py-2 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-secondary)] font-medium text-sm"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          {/* RIGHT — Tabbed Content */}
          <div className="flex-1 min-w-0 w-full">
            {/* Tab nav: clean pill scrollbar on mobile, underline tabs on sm+ */}
            <div className="mb-4">
              {/* Mobile: horizontal scrollable pills with active indicators */}
              <div className="flex sm:hidden gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
                {tabs.map(t => {
                  const isActive = vm.activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => vm.setActiveTab(t.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                        isActive
                          ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20"
                          : "bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)]"
                      }`}
                    >
                      <t.icon size={13} />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Desktop: horizontal tab bar */}
              <div className="hidden sm:flex gap-0.5 border-b border-[var(--ui-border)] overflow-x-auto scrollbar-hide">
                {tabs.map(t => (
                  <button
                    key={t.id}
                    onClick={() => vm.setActiveTab(t.id)}
                    className={`flex items-center gap-1.5 px-3.5 pb-2.5 pt-1 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                      vm.activeTab === t.id
                        ? "border-orange-500 text-orange-500"
                        : "border-transparent text-[var(--ui-text-muted)] hover:text-[var(--ui-text-primary)] hover:border-[var(--ui-border)]"
                    }`}
                  >
                    <t.icon size={14} /> {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Identity ── */}
            {vm.activeTab === "profile" && (
              <div className="space-y-3 sm:space-y-4">
                <SectionLabel>Corporate Identity</SectionLabel>
                {vm.isEditing ? (
                  <div className="border border-[var(--ui-border)] rounded-xl overflow-hidden bg-[var(--ui-bg-input)] divide-y divide-[var(--ui-border)]">
                    <div className="p-3.5 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <EditField label="Company Name" value={vm.editForm.name} onChange={v => vm.setEditForm({...vm.editForm, name: v})} />
                      <SelectField label="Country" value={vm.editForm.country} onChange={v => vm.setEditForm({...vm.editForm, country: v})} options={[{v:"ID",l:"Indonesia"},{v:"MY",l:"Malaysia"},{v:"SG",l:"Singapore"}]} />
                      <SelectField label="Industry Type" value={vm.editForm.industry_type} onChange={v => vm.setEditForm({ ...vm.editForm, industry_type: v })}
                        options={["Technology","Manufacturing","Healthcare","Retail","Finance","Construction","Logistics","Agriculture","Education","Other"].map(o=>({v:o,l:o}))}
                        placeholder="Select Industry..."
                      />
                      <EditField label="Tax ID (NPWP)" value={vm.editForm.tax_id} onChange={v => vm.setEditForm({...vm.editForm, tax_id: v})} />
                      <EditField label="Email" value={vm.editForm.email} onChange={v => vm.setEditForm({...vm.editForm, email: v})} />
                      <EditField label="Phone / WA" value={vm.editForm.phone} onChange={v => vm.setEditForm({...vm.editForm, phone: v})} />
                    </div>
                    <div className="p-3.5 sm:p-5 grid grid-cols-1 gap-3 sm:gap-4">
                      <EditField label="About" value={vm.editForm.about} textarea onChange={v => vm.setEditForm({...vm.editForm, about: v})} />
                      <EditField label="Keywords / Tags" value={vm.editForm.keywords} textarea onChange={v => vm.setEditForm({...vm.editForm, keywords: v})} />
                    </div>
                  </div>
                ) : (
                  <div className="border border-[var(--ui-border)] rounded-xl overflow-hidden bg-[var(--ui-bg-card)] divide-y divide-[var(--ui-border)]">
                    <DisplayRow label="Company Name" value={vm.company.name} />
                    <DisplayRow label="Industry Type" value={vm.company.industry_type} />
                    <DisplayRow label="Tax ID (NPWP)" value={vm.company.formatted_tax_id || vm.company.tax_id} />
                    <DisplayRow label="Email Address" value={vm.company.email} />
                    <DisplayRow label="Phone Number" value={vm.company.phone} />
                    <DisplayRow label="Keywords / Tags" value={Array.isArray(vm.company.keywords) ? vm.company.keywords.join(", ") : vm.company.keywords} />
                    {vm.company.about && (
                      <div className="p-3.5 sm:p-5 flex flex-col gap-1">
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">Business Biography</span>
                        <p className="text-xs sm:text-sm text-[var(--ui-text-primary)] leading-relaxed break-words">{vm.company.about}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Location ── */}
            {vm.activeTab === "location" && (
              <div className="space-y-3 sm:space-y-4">
                <SectionLabel>Primary Address</SectionLabel>
                {vm.isEditing ? (
                  <div className="border border-[var(--ui-border)] rounded-xl overflow-hidden bg-[var(--ui-bg-input)] divide-y divide-[var(--ui-border)]">
                    <div className="p-3.5 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <EditField label="Province" value={vm.editForm.provincy_country} onChange={v => vm.setEditForm({...vm.editForm, provincy_country: v})} />
                      <EditField label="City" value={vm.editForm.city} onChange={v => vm.setEditForm({...vm.editForm, city: v})} />
                      <EditField label="Zip Code" value={vm.editForm.zip_code} onChange={v => vm.setEditForm({...vm.editForm, zip_code: v})} />
                    </div>
                    <div className="p-3.5 sm:p-5">
                      <EditField label="Full Address" value={vm.editForm.address} textarea onChange={v => vm.setEditForm({...vm.editForm, address: v})} />
                    </div>
                  </div>
                ) : (
                  <div className="border border-[var(--ui-border)] rounded-xl overflow-hidden bg-[var(--ui-bg-card)] divide-y divide-[var(--ui-border)]">
                    <DisplayRow label="Province / Country" value={vm.company.provincy_country} />
                    <DisplayRow label="City" value={vm.company.city} />
                    <DisplayRow label="Zip Code" value={vm.company.zip_code} />
                    <DisplayRow label="Full Business Address" value={vm.company.address} />
                  </div>
                )}

                <div className="flex items-center justify-between px-0.5 pt-1">
                  <SectionLabel>HQ / Office Addresses</SectionLabel>
                  {vm.isEditing && (
                    <button type="button" onClick={vm.addHqAddress} className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-semibold hover:bg-orange-500/20 transition-all">
                      <Plus size={12} /> Add
                    </button>
                  )}
                </div>

                {vm.isEditing ? (
                  <div className="space-y-2">
                    {vm.editForm.hq_addresses?.map((addr: string, idx: number) => (
                      <div key={idx} className="flex gap-2">
                        <textarea value={addr} onChange={e => vm.updateHqAddress(idx, e.target.value)} placeholder={`HQ Address ${idx + 1}`} rows={2} className="flex-1 px-3 py-2 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] text-xs sm:text-sm focus:border-orange-500/50 outline-none transition-all resize-none" />
                        {vm.editForm.hq_addresses.length > 1 && (
                          <button type="button" onClick={() => vm.removeHqAddress(idx)} className="px-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all h-fit py-2">
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-[var(--ui-border)] rounded-xl overflow-hidden bg-[var(--ui-bg-card)] divide-y divide-[var(--ui-border)]">
                    {!vm.company.hq_addresses || (Array.isArray(vm.company.hq_addresses) && vm.company.hq_addresses.length === 0) ? (
                      <div className="p-4 sm:p-6 text-center"><p className="text-xs text-[var(--ui-text-muted)]">No office locations added yet</p></div>
                    ) : (
                      (Array.isArray(vm.company.hq_addresses) ? vm.company.hq_addresses : [vm.company.hq_addresses]).map((addr: string, idx: number) => (
                        <div key={idx} className="p-3.5 sm:p-4 sm:px-5 flex items-start gap-2.5 sm:gap-3">
                          <MapPin size={13} className="text-orange-500 flex-shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] mb-0.5">Location {idx + 1}</div>
                            <p className="text-xs sm:text-sm text-[var(--ui-text-primary)] break-words">{addr}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Banking ── */}
            {vm.activeTab === "banking" && (
              <div className="space-y-3 sm:space-y-4">
                <SectionLabel>Bank Account</SectionLabel>
                {vm.isEditing ? (
                  <div className="border border-[var(--ui-border)] rounded-xl overflow-hidden bg-[var(--ui-bg-input)]">
                    <div className="p-3.5 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <EditField label="Bank Name" value={vm.editForm.bank_name} onChange={v => vm.setEditForm({...vm.editForm, bank_name: v})} />
                      <EditField label="Account Number" value={vm.editForm.bank_account} onChange={v => vm.setEditForm({...vm.editForm, bank_account: v})} />
                      <EditField label="Account Holder Name" value={vm.editForm.bank_account_name} onChange={v => vm.setEditForm({...vm.editForm, bank_account_name: v})} />
                    </div>
                  </div>
                ) : (
                  <div className="border border-[var(--ui-border)] rounded-xl overflow-hidden bg-[var(--ui-bg-card)] divide-y divide-[var(--ui-border)]">
                    <DisplayRow label="Beneficiary Bank" value={vm.company.bank_name} />
                    <DisplayRow label="Account Number" value={vm.company.bank_account} />
                    <DisplayRow label="Account Holder" value={vm.company.bank_account_name} />
                  </div>
                )}
              </div>
            )}

            {/* ── Documents ── */}
            {vm.activeTab === "documents" && (
              <div className="space-y-3 sm:space-y-4">
                <SectionLabel>Corporate Documents</SectionLabel>
                <div className="border border-[var(--ui-border)] rounded-xl overflow-hidden bg-[var(--ui-bg-card)] divide-y divide-[var(--ui-border)]">
                  {!vm.company.documents || vm.company.documents?.length === 0 ? (
                    <div className="py-8 sm:py-10 text-center">
                      <FileText size={24} className="mx-auto text-[var(--ui-text-muted)] opacity-25 mb-2" />
                      <p className="text-xs sm:text-sm text-[var(--ui-text-muted)]">No documents uploaded yet.</p>
                    </div>
                  ) : (
                    vm.company.documents?.map((doc: any) => (
                      <div key={doc.id} className="p-3.5 sm:p-4 sm:px-5 flex items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 flex-shrink-0">
                            <FileText size={15} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-semibold text-[var(--ui-text-primary)] truncate">{doc.type}</div>
                            <div className="text-[11px] sm:text-xs text-[var(--ui-text-muted)] truncate">{doc.name || 'Official Document'}</div>
                          </div>
                        </div>
                        <a href={getAssetUrl(doc.url || doc.file_path)} target="_blank" rel="noopener noreferrer" className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)] flex items-center justify-center text-[var(--ui-text-muted)] hover:text-orange-500 hover:border-orange-500/50 transition-all flex-shrink-0">
                          <Download size={13} />
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ── Performance ── */}
            {vm.activeTab === "performance" && (
              <div className="space-y-3 sm:space-y-4">
                <SectionLabel>Activity Overview</SectionLabel>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {vm.company.type === 'buyer' ? (
                    <>
                      <StatCard icon={FileText} label="Total PR" value={vm.company.stats?.total_pr || 0} color="orange" />
                      <StatCard icon={CheckCircle2} label="Approved" value={vm.company.stats?.approved_pr || 0} color="emerald" />
                      <StatCard icon={Activity} label="Status" value="Active" color="blue" />
                    </>
                  ) : (
                    <>
                      <StatCard icon={FileText} label="Total Bids" value={vm.company.stats?.total_proposals || 0} color="orange" />
                      <StatCard icon={Award} label="Won" value={vm.company.stats?.won_proposals || 0} color="emerald" />
                      <StatCard icon={BarChart3} label="Win Rate" value={`${winRate}%`} color="blue" />
                    </>
                  )}
                </div>
                <div className="border border-[var(--ui-border)] rounded-xl bg-[var(--ui-bg-card)] p-3.5 sm:p-4 sm:px-5">
                  <p className="text-xs sm:text-sm text-[var(--ui-text-secondary)] leading-relaxed">
                    Member since <span className="text-[var(--ui-text-primary)] font-semibold">{new Date(vm.company.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>.{" "}
                    {vm.company.type === 'buyer'
                      ? `Telah membuat ${vm.company.stats?.total_pr || 0} permintaan pengadaan, ${vm.company.stats?.approved_pr || 0} di antaranya disetujui.`
                      : `Berpartisipasi dalam ${vm.company.stats?.total_proposals || 0} tender dan berhasil memenangkan ${vm.company.stats?.won_proposals || 0} kontrak (win rate ${winRate}%).`
                    }
                  </p>
                </div>
              </div>
            )}

            {/* ── Team ── */}
            {vm.activeTab === "team" && (
              <TeamManagement
                company={vm.company}
                teamMembers={vm.teamMembers}
                teamLoading={vm.teamLoading}
                isInviting={vm.isInviting}
                inviteForm={vm.inviteForm}
                setInviteForm={vm.setInviteForm}
                handleInviteUser={vm.handleInviteUser}
                inviteError={vm.inviteError}
                inviteSuccess={vm.inviteSuccess}
                onRoleChanged={() => vm.fetchTeamMembers && vm.fetchTeamMembers(vm.company?.id)}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)] px-0.5 pb-0.5">{children}</div>;
}

function DisplayRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3">
      {/* Mobile: stacked */}
      <div className="flex flex-col gap-0.5 sm:hidden">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">{label}</span>
        <span className="text-sm text-[var(--ui-text-primary)]">{value || "—"}</span>
      </div>
      {/* Desktop: side-by-side */}
      <div className="hidden sm:flex items-center justify-between gap-4">
        <span className="text-sm font-semibold text-[var(--ui-text-muted)] flex-shrink-0 w-2/5">{label}</span>
        <span className="text-sm text-[var(--ui-text-primary)] text-right flex-1">{value || "—"}</span>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  const cols: any = { orange: "text-orange-500 bg-orange-500/10", emerald: "text-emerald-500 bg-emerald-500/10", blue: "text-blue-500 bg-blue-500/10" };
  return (
    <div className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-input)] p-4 flex flex-col gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cols[color]}`}>
        <Icon size={16} />
      </div>
      <div>
        <div className="text-xl font-bold text-[var(--ui-text-primary)]">{value}</div>
        <div className="text-xs text-[var(--ui-text-muted)] mt-0.5">{label}</div>
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder }: { label: string; value: string; onChange: (v: string) => void; options: {v:string,l:string}[]; placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-[var(--ui-text-muted)]">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] text-sm focus:border-orange-500/50 outline-none transition-all appearance-none">
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}

function EditField({ label, value, onChange, textarea, type = "text" }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean; type?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-[var(--ui-text-muted)]">{label}</span>
      {textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] text-sm focus:border-orange-500/50 outline-none transition-all resize-none" />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] text-sm focus:border-orange-500/50 outline-none transition-all" />
      )}
    </div>
  );
}
