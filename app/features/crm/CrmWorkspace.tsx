import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  BarChart3,
  ClipboardList,
  ContactRound,
  FileText,
  Headphones,
  Mail,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
  UsersRound,
  Zap,
} from "lucide-react";
import type { ComposerKind, RecordRow, Tab } from "./types";
import { card, createMap, money } from "./crm-utils";
import { AccessState, Loading } from "./components/CrmShared";
import { CrmOverview } from "./components/CrmOverview";
import { CrmPipeline } from "./components/CrmPipeline";
import { CrmRecords } from "./components/CrmRecords";
import { CrmHelpdesk } from "./components/CrmHelpdesk";
import { CrmAutomation } from "./components/CrmAutomation";
import { CrmInsights } from "./components/CrmInsights";
import { CrmComposer } from "./components/CrmComposer";
import {
  convertCrmLead,
  disconnectCrmWhatsAppSession,
  getCrmActivities,
  getCrmCampaigns,
  getCrmConversations,
  getCrmCurrencyRates,
  getCrmCustomers,
  getCrmDashboard,
  getCrmDeals,
  getCrmEmailConnections,
  getCrmForecast,
  getCrmIntegrations,
  getCrmKnowledge,
  getCrmLeads,
  getCrmQuotes,
  getCrmReports,
  getCrmSalesTargets,
  getCrmTerritories,
  getCrmTickets,
  getCrmWhatsAppSession,
  getCrmWorkflows,
  requestCrmQuoteApproval,
  syncCrmEmailInbox,
  updateCrmActivity,
  updateCrmDeal,
  updateCrmLead,
} from "~/lib/api/crm";

const tabs: { key: Tab; label: string; icon: any; countKey?: string }[] = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "leads", label: "Leads", icon: Target, countKey: "leads" },
  { key: "pipeline", label: "Pipeline", icon: ContactRound, countKey: "deals" },
  { key: "customers", label: "Customer 360", icon: UsersRound, countKey: "customers" },
  { key: "tasks", label: "Tasks", icon: ClipboardList, countKey: "activities" },
  { key: "helpdesk", label: "Helpdesk & Chat", icon: Headphones, countKey: "tickets" },
  { key: "cpq", label: "CPQ & Quotes", icon: FileText, countKey: "quotes" },
  { key: "automation", label: "Automation", icon: Zap, countKey: "workflows" },
  { key: "insights", label: "Insights AI", icon: Sparkles },
];

export function CrmWorkspace({
  company,
}: {
  company: { id: string; name?: string };
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<Record<string, any>>({});
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [composer, setComposer] = useState<ComposerKind | null>(null);

  const refresh = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const [
        dashboard,
        forecast,
        leads,
        deals,
        customers,
        activities,
        tickets,
        quotes,
        workflows,
        emails,
        territories,
        campaigns,
        knowledge,
        integrations,
        rates,
        targets,
        reports,
        conversations,
      ] = await Promise.all([
        getCrmDashboard(company.id),
        getCrmForecast(company.id),
        getCrmLeads(company.id),
        getCrmDeals(company.id),
        getCrmCustomers(company.id),
        getCrmActivities(company.id),
        getCrmTickets(company.id),
        getCrmQuotes(company.id),
        getCrmWorkflows(company.id),
        getCrmEmailConnections(company.id),
        getCrmTerritories(company.id),
        getCrmCampaigns(company.id),
        getCrmKnowledge(company.id),
        getCrmIntegrations(company.id),
        getCrmCurrencyRates(company.id),
        getCrmSalesTargets(company.id),
        getCrmReports(company.id),
        getCrmConversations(company.id),
      ]);
      setData({
        dashboard,
        forecast,
        leads: leads.data ?? [],
        deals: deals.data ?? [],
        customers: customers.data ?? [],
        activities: activities.data ?? [],
        tickets: tickets.data ?? [],
        quotes: quotes.data ?? [],
        workflows: workflows.workflows ?? [],
        emails: emails.connections ?? [],
        territories: territories.territories ?? [],
        campaigns: campaigns.campaigns ?? [],
        knowledge: knowledge.articles ?? [],
        integrations: integrations.integrations ?? [],
        rates: rates.rates ?? [],
        targets: targets.targets ?? [],
        reports,
        conversations: conversations.data ?? [],
      });
    } catch (e: any) {
      setError(e.message || "CRM tidak dapat dimuat.");
    } finally {
      setBusy(false);
    }
  }, [company.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const refreshInbox = useCallback(async () => {
    try {
      const conversations = await getCrmConversations(company.id);
      setData((previous) => ({
        ...previous,
        conversations: conversations.data ?? [],
      }));
    } catch {
      // A temporary polling failure must not hide the inbox already on screen.
    }
  }, [company.id]);

  useEffect(() => {
    const whatsApp = (data.integrations ?? []).find(
      (item: RecordRow) => item.provider === "whatsapp_web",
    );
    if (
      tab !== "automation" ||
      !whatsApp ||
      ["connected", "auth_failed", "error", "disconnected"].includes(
        whatsApp.status,
      )
    ) {
      return;
    }
    let active = true;
    const syncSession = async () => {
      try {
        const { session } = await getCrmWhatsAppSession(company.id);
        if (!active || !session) return;
        setData((previous) => ({
          ...previous,
          integrations: (previous.integrations ?? []).map((item: RecordRow) =>
            item.provider === "whatsapp_web"
              ? { ...item, status: session.status, settings: session }
              : item,
          ),
        }));
      } catch {
        // The initial connection remains visible; the next manual refresh shows server errors.
      }
    };
    void syncSession();
    const timer = window.setInterval(() => void syncSession(), 2000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [company.id, data.integrations, tab]);

  const current = useMemo(
    () => ({
      dashboard: data.dashboard ?? {},
      forecast: data.forecast?.forecast ?? {},
      leads: data.leads ?? [],
      deals: data.deals ?? [],
      customers: data.customers ?? [],
      activities: data.activities ?? [],
      tickets: data.tickets ?? [],
      quotes: data.quotes ?? [],
      workflows: data.workflows ?? [],
      emails: data.emails ?? [],
      territories: data.territories ?? [],
      campaigns: data.campaigns ?? [],
      knowledge: data.knowledge ?? [],
      integrations: data.integrations ?? [],
      rates: data.rates ?? [],
      targets: data.targets ?? [],
      reports: data.reports ?? {},
      conversations: data.conversations ?? [],
    }),
    [data],
  );

  const markTask = async (row: RecordRow) => {
    try {
      await updateCrmActivity(company.id, row.id, { status: "completed" });
      await refresh();
      Swal.fire({
        icon: "success",
        title: "Task selesai",
        text: "Status dan waktu penyelesaian telah diperbarui.",
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (e: any) {
      Swal.fire({ icon: "error", title: "Gagal", text: e.message });
    }
  };

  const moveDeal = async (row: RecordRow, stage: string): Promise<boolean> => {
    try {
      await updateCrmDeal(company.id, row.id, {
        stage,
        probability:
          stage === "closed_won"
            ? 100
            : stage === "closed_lost"
              ? 0
              : row.probability,
      });
      await refresh();
      return true;
    } catch (e: any) {
      Swal.fire({ icon: "error", title: "Gagal memindahkan deal", text: e.message });
      return false;
    }
  };

  const convertLead = async (row: RecordRow) => {
    try {
      const result = await convertCrmLead(company.id, row.id);
      await refresh();
      Swal.fire({
        icon: "success",
        title: "Lead dikonversi",
        text: result.deal
          ? "Customer dan deal baru sudah masuk ke pipeline."
          : "Customer sudah ditautkan ke lead ini.",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (e: any) {
      Swal.fire({ icon: "error", title: "Gagal", text: e.message });
    }
  };

  const scheduleLeadFollowUp = async (row: RecordRow) => {
    const currentValue = row.next_follow_up_at
      ? new Date(row.next_follow_up_at).toISOString().slice(0, 16)
      : "";
    const result = await Swal.fire({
      title: "Jadwalkan follow up",
      text: `Lead: ${row.name}`,
      input: "datetime-local",
      inputValue: currentValue,
      inputLabel: "Waktu follow up",
      showCancelButton: true,
      confirmButtonText: "Simpan jadwal",
      cancelButtonText: "Batal",
      confirmButtonColor: "#f97316",
      inputValidator: (value) =>
        !value ? "Waktu follow up wajib diisi." : undefined,
    });
    if (!result.isConfirmed) return;
    try {
      await updateCrmLead(company.id, row.id, {
        next_follow_up_at: result.value,
      });
      await refresh();
      Swal.fire({
        icon: "success",
        title: "Follow up dijadwalkan",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (e: any) {
      Swal.fire({ icon: "error", title: "Gagal", text: e.message });
    }
  };

  const requestQuoteApproval = async (row: RecordRow) => {
    try {
      await requestCrmQuoteApproval(company.id, row.id);
      await refresh();
      Swal.fire({
        icon: "success",
        title: "Approval diajukan",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (e: any) {
      Swal.fire({ icon: "error", title: "Gagal", text: e.message });
    }
  };

  const disconnectWhatsApp = async () => {
    const confirmation = await Swal.fire({
      icon: "warning",
      title: "Hapus koneksi WhatsApp?",
      text: "Sesi perangkat akan logout. Riwayat inbox CRM tetap tersimpan.",
      showCancelButton: true,
      confirmButtonText: "Hapus koneksi",
      cancelButtonText: "Batal",
      confirmButtonColor: "#dc2626",
    });
    if (!confirmation.isConfirmed) return;
    try {
      await disconnectCrmWhatsAppSession(company.id);
      await refresh();
      Swal.fire({
        icon: "success",
        title: "Koneksi dihapus",
        timer: 1300,
        showConfirmButton: false,
      });
    } catch (e: any) {
      Swal.fire({ icon: "error", title: "Gagal menghapus", text: e.message });
    }
  };

  const syncEmailInbox = async () => {
    try {
      const result = await syncCrmEmailInbox(company.id);
      await refresh();
      Swal.fire({
        icon: "success",
        title: "Inbox disinkronkan",
        text: `${result.imported || 0} pesan baru diimpor.`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e: any) {
      Swal.fire({
        icon: "error",
        title: "Sinkronisasi gagal",
        text: e.message,
      });
    }
  };

  if (error) return <AccessState error={error} onRetry={refresh} />;

  const activeMetrics = current.dashboard.metrics ?? {};

  return (
    <div className="space-y-5">
      {/* ── Top Hero & Workspace Navigation ─────────────────────────── */}
      <section className={`${card} overflow-hidden`}>
        <div className="border-b border-[var(--ui-border)] bg-gradient-to-r from-orange-500/10 via-transparent to-amber-500/5 p-4 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-orange-500/30 bg-orange-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-orange-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                  CRM Enterprise Pro
                </span>
                <span className="text-xs text-[var(--ui-text-muted)]">
                  Multi-Channel Customer 360
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ui-text-primary)]">
                {company.name || "Workspace Perusahaan"}
              </h1>
              <p className="max-w-2xl text-xs sm:text-sm text-[var(--ui-text-secondary)]">
                Kelola lead, orkestrasi deal pipeline, automasi WhatsApp & email kerja, serta layanan tiket dalam satu workspace terpadu.
              </p>
            </div>

            {/* Standardized Header Action Bar (All items h-9) */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Quick Stat Pill (Height h-9) */}
              <div className="hidden sm:inline-flex h-9 items-center gap-3 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] px-3.5">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-[var(--ui-text-muted)] mr-1.5">
                    Pipeline
                  </span>
                  <span className="text-xs font-bold text-orange-500">
                    {money(activeMetrics.pipeline_value)}
                  </span>
                </div>
                <div className="h-4 w-px bg-[var(--ui-border)]" />
                <div>
                  <span className="text-[10px] uppercase font-semibold text-[var(--ui-text-muted)] mr-1.5">
                    Lead
                  </span>
                  <span className="text-xs font-bold text-[var(--ui-text-primary)]">
                    {activeMetrics.open_leads ?? 0}
                  </span>
                </div>
              </div>

              {/* Connect Email (Height h-9) */}
              <button
                type="button"
                onClick={() => setComposer("email")}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[var(--ui-border-input)] bg-[var(--ui-bg-card)] px-3.5 text-xs font-semibold text-[var(--ui-text-primary)] transition-all hover:border-orange-500/50 hover:text-orange-500"
              >
                <Mail size={14} className="text-orange-500" />
                <span>Connect Email</span>
              </button>

              {/* Contextual Action Button (Height h-9) */}
              {createMap[tab] && (
                <button
                  type="button"
                  onClick={() => setComposer(createMap[tab] ?? "lead")}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-orange-500 px-3.5 text-xs font-bold text-white shadow-sm shadow-orange-500/20 transition-all hover:bg-orange-600"
                >
                  <Plus size={14} />
                  <span>
                    {tab === "leads" && "Tambah Lead"}
                    {tab === "pipeline" && "Tambah Deal"}
                    {tab === "customers" && "Tambah Customer"}
                    {tab === "tasks" && "Tambah Task"}
                    {tab === "helpdesk" && "Buat Tiket"}
                    {tab === "cpq" && "Buat Quote"}
                    {tab === "automation" && "Buat Workflow"}
                  </span>
                </button>
              )}

              {/* Refresh Button (Height h-9 w-9) */}
              <button
                type="button"
                onClick={refresh}
                disabled={busy}
                title="Refresh data CRM"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--ui-border-input)] bg-[var(--ui-bg-card)] text-[var(--ui-text-muted)] transition-all hover:border-orange-500/50 hover:text-orange-500 disabled:opacity-50"
              >
                <RefreshCw size={14} className={busy ? "animate-spin text-orange-500" : ""} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Segmented Navigation Tabs ──────────────────────────────── */}
        <div className="flex gap-1.5 overflow-x-auto p-2 scrollbar-none">
          {tabs.map(({ key, label, icon: Icon, countKey }) => {
            const isActive = tab === key;
            const count =
              countKey && (current as Record<string, any>)[countKey]
                ? (current as Record<string, any>)[countKey].length
                : null;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3.5 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20"
                    : "text-[var(--ui-text-secondary)] hover:bg-[var(--ui-bg-input)] hover:text-[var(--ui-text-primary)]"
                }`}
              >
                <Icon size={15} />
                <span>{label}</span>
                {count != null && count > 0 && (
                  <span
                    className={`ml-0.5 rounded-md px-1.5 py-0.2 text-[10px] font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-[var(--ui-bg-input)] text-[var(--ui-text-muted)]"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Tab Content ─────────────────────────────────────────────── */}
      {busy ? (
        <Loading />
      ) : (
        <CrmTabContent
          tab={tab}
          crm={current}
          companyId={company.id}
          onCreate={() => setComposer(createMap[tab] ?? "lead")}
          onConvertLead={convertLead}
          onMoveDeal={moveDeal}
          onCompleteTask={markTask}
          onCompose={setComposer}
          onRequestQuoteApproval={requestQuoteApproval}
          onScheduleLeadFollowUp={scheduleLeadFollowUp}
          onDisconnectWhatsApp={disconnectWhatsApp}
          onSyncEmailInbox={syncEmailInbox}
          onRefreshInbox={refreshInbox}
          onOpenAutomation={() => {
            setTab("automation");
            void refresh();
          }}
        />
      )}

      {/* ── Slide / Modal Composer ──────────────────────────────────── */}
      {composer && (
        <CrmComposer
          kind={composer}
          companyId={company.id}
          customers={current.customers}
          leads={current.leads}
          deals={current.deals}
          onClose={() => setComposer(null)}
          onDone={async () => {
            setComposer(null);
            await refresh();
          }}
        />
      )}
    </div>
  );
}

function CrmTabContent({
  tab,
  crm,
  companyId,
  onCreate,
  onConvertLead,
  onMoveDeal,
  onCompleteTask,
  onCompose,
  onRequestQuoteApproval,
  onScheduleLeadFollowUp,
  onDisconnectWhatsApp,
  onSyncEmailInbox,
  onRefreshInbox,
  onOpenAutomation,
}: {
  tab: Tab;
  crm: Record<string, any>;
  companyId: string;
  onCreate: () => void;
  onConvertLead: (row: RecordRow) => void;
  onMoveDeal: (row: RecordRow, stage: string) => Promise<boolean>;
  onCompleteTask: (row: RecordRow) => void;
  onCompose: (kind: ComposerKind) => void;
  onRequestQuoteApproval: (row: RecordRow) => void;
  onScheduleLeadFollowUp: (row: RecordRow) => void;
  onDisconnectWhatsApp: () => void;
  onSyncEmailInbox: () => void;
  onRefreshInbox: () => Promise<void>;
  onOpenAutomation: () => void;
}) {
  if (tab === "overview") {
    return <CrmOverview crm={crm} onSelectTab={(t) => onCompose(t as any)} />;
  }
  if (tab === "pipeline") {
    return <CrmPipeline deals={crm.deals} onCreate={onCreate} onMove={onMoveDeal} />;
  }
  if (tab === "insights") {
    return <CrmInsights crm={crm} onCompose={onCompose} />;
  }
  if (tab === "automation") {
    return (
      <CrmAutomation
        workflows={crm.workflows}
        emails={crm.emails}
        campaigns={crm.campaigns}
        knowledge={crm.knowledge}
        integrations={crm.integrations}
        onCreate={onCreate}
        onCompose={onCompose}
        onDisconnectWhatsApp={onDisconnectWhatsApp}
        onSyncEmailInbox={onSyncEmailInbox}
      />
    );
  }
  if (tab === "helpdesk") {
    return (
      <CrmHelpdesk
        companyId={companyId}
        tickets={crm.tickets}
        conversations={crm.conversations}
        onCreate={onCreate}
        onRefreshInbox={onRefreshInbox}
        whatsAppStatus={
          crm.integrations.find(
            (item: RecordRow) => item.provider === "whatsapp_web",
          )?.status
        }
        onOpenAutomation={onOpenAutomation}
      />
    );
  }

  const mapping: Record<
    string,
    {
      title: string;
      intro: string;
      icon: any;
      createLabel: string;
      rows: RecordRow[];
      cols: string[];
      action?: (row: RecordRow) => void;
      actionLabel?: string | ((row: RecordRow) => string);
      secondaryAction?: (row: RecordRow) => void;
      secondaryActionLabel?: string;
      canAction?: (row: RecordRow) => boolean;
    }
  > = {
    leads: {
      title: "Manajemen Lead & Peluang Baru",
      intro:
        "Kualifikasi prospek calon pembeli dengan penilaian skor berbasis AI dan riwayat kontak yang transparan.",
      icon: Target,
      createLabel: "Lead Baru",
      rows: crm.leads,
      cols: [
        "name",
        "company_name",
        "source",
        "score",
        "status",
        "next_follow_up_at",
      ],
      action: onConvertLead,
      actionLabel: "Konversi ke Deal",
      secondaryAction: onScheduleLeadFollowUp,
      secondaryActionLabel: "Jadwalkan Follow up",
    },
    customers: {
      title: "Customer 360",
      intro:
        "Profil terintegrasi mencakup kontak PIC, data perusahaan, lifecycle stage, dan riwayat pesanan serta interaksi.",
      icon: UsersRound,
      createLabel: "Customer Baru",
      rows: crm.customers,
      cols: [
        "name",
        "company_name",
        "email",
        "phone",
        "lifecycle_stage",
        "territory",
      ],
    },
    tasks: {
      title: "Aktivitas & Tugas Follow Up",
      intro:
        "Pastikan setiap calon customer mendapatkan tindak lanjut tepat waktu dari tim sales dan operasional.",
      icon: ClipboardList,
      createLabel: "Task Baru",
      rows: crm.activities,
      cols: ["title", "type", "status", "due_at", "completed_at"],
      action: onCompleteTask,
      actionLabel: (row) =>
        row.status === "completed" ? "Selesai" : "Tandai selesai",
      canAction: (row) => row.status === "open",
    },
    cpq: {
      title: "CPQ & Penawaran Harga (Quotation)",
      intro:
        "Susun penawaran harga presisi dengan diskon, kalkulasi pajak, multi mata uang, dan approval alur bertingkat.",
      icon: FileText,
      createLabel: "Quote Baru",
      rows: crm.quotes,
      cols: [
        "number",
        "status",
        "currency",
        "subtotal",
        "discount_amount",
        "total_amount",
      ],
      action: onRequestQuoteApproval,
      actionLabel: "Ajukan approval",
    },
  };

  const view = mapping[tab];
  return (
    <CrmRecords
      title={view.title}
      intro={view.intro}
      icon={view.icon}
      createLabel={view.createLabel}
      rows={view.rows}
      cols={view.cols}
      onCreate={onCreate}
      onAction={view.action}
      actionLabel={view.actionLabel}
      onSecondaryAction={view.secondaryAction}
      secondaryActionLabel={view.secondaryActionLabel}
      canAction={view.canAction}
    />
  );
}
