import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  BarChart3,
  CheckCircle2,
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
} from "lucide-react";
import {
  createCrmActivity,
  createCrmCampaign,
  createCrmCurrencyRate,
  createCrmCustomer,
  createCrmDeal,
  createCrmEmailConnection,
  createCrmLead,
  createCrmQuote,
  createCrmSalesTarget,
  createCrmKnowledge,
  connectCrmIntegration,
  convertCrmLead,
  disconnectCrmWhatsAppSession,
  startCrmWhatsAppSession,
  authorizeCrmEmail,
  createCrmTicket,
  createCrmWorkflow,
  getCrmActivities,
  getCrmCampaigns,
  getCrmCurrencyRates,
  getCrmConversations,
  getCrmConversationMessages,
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
  getCrmWorkflows,
  getCrmWhatsAppSession,
  requestCrmQuoteApproval,
  sendCrmWhatsAppMessage,
  syncCrmEmailInbox,
  updateCrmActivity,
  updateCrmDeal,
  updateCrmLead,
} from "~/lib/api/crm";

type Tab =
  | "overview"
  | "leads"
  | "pipeline"
  | "customers"
  | "tasks"
  | "helpdesk"
  | "cpq"
  | "automation"
  | "insights";
type ComposerKind =
  | "lead"
  | "customer"
  | "deal"
  | "task"
  | "ticket"
  | "quote"
  | "workflow"
  | "email"
  | "campaign"
  | "knowledge"
  | "integration"
  | "target"
  | "rate";
type RecordRow = Record<string, any>;

const tabs: { key: Tab; label: string; icon: any }[] = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "leads", label: "Leads", icon: Target },
  { key: "pipeline", label: "Pipeline", icon: ContactRound },
  { key: "customers", label: "Customer 360", icon: UsersRound },
  { key: "tasks", label: "Tasks", icon: ClipboardList },
  { key: "helpdesk", label: "Helpdesk", icon: Headphones },
  { key: "cpq", label: "CPQ", icon: FileText },
  { key: "automation", label: "Automation", icon: Mail },
  { key: "insights", label: "Insights AI", icon: Sparkles },
];
const stages = [
  "qualification",
  "discovery",
  "proposal",
  "negotiation",
  "closed_won",
  "closed_lost",
];
const money = (value: unknown, currency = "IDR") =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
const date = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      })
    : "—";
const jsonValue = (value: unknown): Record<string, any> => {
  if (value && typeof value === "object") return value as Record<string, any>;
  try {
    return JSON.parse(String(value || "{}"));
  } catch {
    return {};
  }
};
const card = "border border-[var(--ui-border)] bg-[var(--ui-bg-card)]";
const input =
  "w-full border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] px-3 py-2 text-sm text-[var(--ui-text-primary)] outline-none focus:border-[var(--ui-primary)]";

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
  const createMap: Partial<Record<Tab, ComposerKind>> = {
    leads: "lead",
    pipeline: "deal",
    customers: "customer",
    tasks: "task",
    helpdesk: "ticket",
    cpq: "quote",
    automation: "workflow",
  };

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
  const moveDeal = async (row: RecordRow, stage: string) => {
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
    } catch (e: any) {
      Swal.fire({ icon: "error", title: "Gagal", text: e.message });
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
  return (
    <div className="space-y-4">
      <section className={`${card} p-4 sm:p-5`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.14em] text-[var(--ui-text-muted)]">
              Enterprise Pro workspace
            </p>
            <h2 className="mt-1 text-xl font-bold text-[var(--ui-text-primary)]">
              CRM untuk {company.name || "workspace Anda"}
            </h2>
            <p className="mt-1 text-sm text-[var(--ui-text-secondary)]">
              Mulai dari lead, lanjutkan follow up, lalu pantau deal dan layanan
              pelanggan dalam satu tempat.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setComposer("email")}
              className="border border-[var(--ui-border-input)] bg-[var(--ui-bg-card)] px-3 py-2 text-xs font-semibold text-[var(--ui-text-primary)]"
            >
              Connect email
            </button>
            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center gap-2 bg-[var(--ui-primary)] px-3 py-2 text-xs font-bold text-white"
            >
              <RefreshCw size={14} className={busy ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
        <div className="mt-4 flex gap-1 overflow-x-auto border-t border-[var(--ui-border)] pt-3">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-2 text-xs font-semibold ${tab === key ? "border-[var(--ui-primary)] text-[var(--ui-primary)]" : "border-transparent text-[var(--ui-text-muted)]"}`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </section>

      {busy ? (
        <Loading />
      ) : (
        <CrmTab
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
        />
      )}
      {composer && (
        <Composer
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

function CrmTab({
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
}: {
  tab: Tab;
  crm: Record<string, any>;
  companyId: string;
  onCreate: () => void;
  onConvertLead: (row: RecordRow) => void;
  onMoveDeal: (row: RecordRow, stage: string) => void;
  onCompleteTask: (row: RecordRow) => void;
  onCompose: (kind: ComposerKind) => void;
  onRequestQuoteApproval: (row: RecordRow) => void;
  onScheduleLeadFollowUp: (row: RecordRow) => void;
  onDisconnectWhatsApp: () => void;
  onSyncEmailInbox: () => void;
  onRefreshInbox: () => Promise<void>;
}) {
  if (tab === "overview") return <Overview crm={crm} />;
  if (tab === "pipeline")
    return (
      <Pipeline deals={crm.deals} onCreate={onCreate} onMove={onMoveDeal} />
    );
  if (tab === "insights") return <Insights crm={crm} onCompose={onCompose} />;
  if (tab === "automation")
    return (
      <Automation
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
  if (tab === "helpdesk") {
    return (
      <Helpdesk
        companyId={companyId}
        tickets={crm.tickets}
        conversations={crm.conversations}
        onCreate={onCreate}
        onRefreshInbox={onRefreshInbox}
      />
    );
  }
  const mapping: Record<
    string,
    {
      title: string;
      intro: string;
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
      title: "Lead management",
      intro:
        "Prioritaskan prospek bernilai tinggi melalui skor yang dapat dijelaskan.",
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
      actionLabel: "Convert",
      secondaryAction: onScheduleLeadFollowUp,
      secondaryActionLabel: "Jadwalkan follow up",
    },
    customers: {
      title: "Customer 360",
      intro:
        "Satu profil untuk kontak, perusahaan, lifecycle, dan riwayat interaksi lintas tim.",
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
      title: "Follow up & tasks",
      intro:
        "Buat pekerjaan berulang dan pastikan tindak lanjut tidak terlewat.",
      rows: crm.activities,
      cols: ["title", "type", "status", "due_at", "completed_at"],
      action: onCompleteTask,
      actionLabel: (row) =>
        row.status === "completed" ? "Selesai" : "Tandai selesai",
      canAction: (row) => row.status === "open",
    },
    cpq: {
      title: "CPQ & quotation",
      intro:
        "Susun quote dengan line item, diskon, pajak, mata uang, dan masa berlaku yang terkendali.",
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
    <Records
      title={view.title}
      intro={view.intro}
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

function Overview({ crm }: { crm: Record<string, any> }) {
  const metrics = crm.dashboard.metrics ?? {};
  return (
    <div className="space-y-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Metric label="Lead aktif" value={metrics.open_leads ?? 0} />
        <Metric label="Pipeline" value={money(metrics.pipeline_value)} />
        <Metric
          label="Forecast berbobot"
          value={money(metrics.weighted_forecast)}
        />
        <Metric label="Tiket terbuka" value={metrics.open_tickets ?? 0} />
        <Metric
          label="Task terlambat"
          value={metrics.overdue_tasks ?? 0}
          tone="danger"
        />
        <Metric
          label="SLA terlewati"
          value={metrics.sla_breaches ?? 0}
          tone="danger"
        />
      </section>
      <section className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
        <Panel title="Alur penjualan" caption="Nilai dan peluang per tahap">
          <PipelineBars pipeline={crm.dashboard.pipeline ?? {}} />
        </Panel>
        <Panel
          title="Berikutnya untuk dikerjakan"
          caption="Follow up yang dijadwalkan"
        >
          <TaskList rows={crm.dashboard.upcoming_tasks ?? []} />
        </Panel>
      </section>
      <section className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Panduan mulai cepat"
          caption="Bangun proses CRM tanpa membuat tim bingung"
        >
          <ol className="space-y-3 text-sm text-[var(--ui-text-secondary)]">
            <li>
              <b className="text-[var(--ui-text-primary)]">
                1. Hubungkan email
              </b>{" "}
              untuk mencatat komunikasi kerja dalam satu workspace.
            </li>
            <li>
              <b className="text-[var(--ui-text-primary)]">2. Tambah lead</b>{" "}
              lalu gunakan skor untuk memilih follow up paling potensial.
            </li>
            <li>
              <b className="text-[var(--ui-text-primary)]">3. Pindahkan deal</b>{" "}
              pada pipeline dan buat task atau quote saat dibutuhkan.
            </li>
          </ol>
        </Panel>
        <Panel
          title="Aktivitas terakhir"
          caption="Jejak kerja tim lintas divisi"
        >
          <TaskList rows={crm.dashboard.recent_activity ?? []} />
        </Panel>
      </section>
    </div>
  );
}
function Insights({
  crm,
  onCompose,
}: {
  crm: Record<string, any>;
  onCompose: (kind: ComposerKind) => void;
}) {
  const f = crm.forecast;
  const report = crm.reports || {};
  return (
    <div className="grid gap-4 xl:grid-cols-[.85fr_1.15fr]">
      <Panel
        title="Predictive forecast"
        caption="Model prediksi transparan dari pipeline dan konversi historis"
      >
        <div className="space-y-4">
          <div className="text-3xl font-bold text-[var(--ui-text-primary)]">
            {money(f.predicted_amount, f.currency)}
          </div>
          <p className="text-sm text-[var(--ui-text-secondary)]">
            Proyeksi kuartal berikutnya · confidence{" "}
            <b>{f.confidence || "low"}</b>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Mini
              label="Pipeline"
              value={money(f.pipeline_amount, f.currency)}
            />
            <Mini
              label="Weighted"
              value={money(f.weighted_amount, f.currency)}
            />
            <Mini
              label="Win rate"
              value={
                f.historical_win_rate == null
                  ? "Belum cukup data"
                  : `${Math.round(f.historical_win_rate * 100)}%`
              }
            />
            <Mini label="Model" value="Explainable v1" />
          </div>
        </div>
      </Panel>
      <Panel
        title="Laporan enterprise"
        caption={`Periode ${report.period || "bulan berjalan"}`}
      >
        <div className="grid grid-cols-2 gap-2">
          <Mini label="Target" value={money(report.sales_target)} />
          <Mini label="Revenue won" value={money(report.won_revenue)} />
          <Mini
            label="Pencapaian"
            value={
              report.target_attainment == null
                ? "—"
                : `${report.target_attainment}%`
            }
          />
          <Mini
            label="Win rate"
            value={report.win_rate == null ? "—" : `${report.win_rate}%`}
          />
        </div>
        <p className="mt-3 text-xs leading-5 text-[var(--ui-text-muted)]">
          Laporan menyatukan target, deal menang, ticket, dan campaign. Kurs
          disimpan per tenant agar nilai lintas mata uang dapat ditinjau sebelum
          laporan final diekspor.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => onCompose("target")}
            className="border border-[var(--ui-border-input)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ui-text-primary)]"
          >
            Atur target
          </button>
          <button
            onClick={() => onCompose("rate")}
            className="border border-[var(--ui-border-input)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ui-text-primary)]"
          >
            Tambah kurs
          </button>
        </div>
      </Panel>
      <Panel
        title="Cara kerja AI"
        caption="Akurat, dapat ditinjau, dan tidak menebak data"
      >
        <p className="text-sm leading-6 text-[var(--ui-text-secondary)]">
          {f.explanation ||
            "Tambahkan data lead dan deal untuk menghasilkan prediksi."}
        </p>
        <div className="mt-4 border-l-2 border-[var(--ui-primary)] pl-3 text-sm text-[var(--ui-text-secondary)]">
          Lead scoring menilai kelengkapan kontak, sumber, perusahaan, dan nilai
          peluang. Alasan skor tampil pada setiap lead agar tim dapat memeriksa
          keputusan.
        </div>
      </Panel>
    </div>
  );
}
function Helpdesk({
  companyId,
  tickets,
  conversations,
  onCreate,
  onRefreshInbox,
}: {
  companyId: string;
  tickets: RecordRow[];
  conversations: RecordRow[];
  onCreate: () => void;
  onRefreshInbox: () => Promise<void>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<RecordRow[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const selected = conversations.find((item) => item.id === selectedId);
  const loadMessages = useCallback(
    async (conversationId: string) => {
      const response = await getCrmConversationMessages(
        companyId,
        conversationId,
      );
      setMessages(response.messages ?? []);
    },
    [companyId],
  );

  useEffect(() => {
    if (selectedId) void loadMessages(selectedId);
  }, [loadMessages, selectedId]);

  useEffect(() => {
    if (!selectedId && conversations[0]) setSelectedId(conversations[0].id);
    if (selectedId && !conversations.some((item) => item.id === selectedId)) {
      setSelectedId(null);
    }
  }, [conversations, selectedId]);

  useEffect(() => {
    let active = true;
    const pollInbox = async () => {
      await onRefreshInbox();
      if (active && selectedId) await loadMessages(selectedId);
    };
    const timer = window.setInterval(() => void pollInbox(), 4_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [loadMessages, onRefreshInbox, selectedId]);

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    setSending(true);
    try {
      if (selected.channel !== "whatsapp") {
        throw new Error(
          "Pengiriman balasan baru tersedia untuk kanal WhatsApp.",
        );
      }
      await sendCrmWhatsAppMessage(companyId, {
        conversation_id: selected.id,
        to: selected.external_id,
        body: reply.trim(),
      });
      setReply("");
      await loadMessages(selected.id);
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Pesan tidak terkirim",
        text: error.message,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <Records
        title="Helpdesk & ticketing"
        intro="SLA dibuat otomatis dari prioritas tiket. Resolusi dan komunikasi tetap dapat ditelusuri per workspace."
        rows={tickets}
        cols={[
          "number",
          "subject",
          "channel",
          "priority",
          "status",
          "resolve_due_at",
        ]}
        onCreate={onCreate}
        createLabel="Tiket baru"
      />
      <section
        className={`${card} grid min-h-[430px] xl:grid-cols-[300px_1fr]`}
      >
        <aside className="border-b border-[var(--ui-border)] xl:border-b-0 xl:border-r">
          <div className="border-b border-[var(--ui-border)] p-4">
            <h3 className="font-bold text-[var(--ui-text-primary)]">
              Omnichannel inbox
            </h3>
            <p className="mt-1 text-xs text-[var(--ui-text-muted)]">
              Pilih percakapan untuk membaca dan membalas.
            </p>
          </div>
          {conversations.length ? (
            conversations.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`block w-full border-b border-[var(--ui-border)] p-3 text-left text-sm ${selectedId === item.id ? "bg-[var(--ui-bg-input)]" : ""}`}
              >
                <div className="flex justify-between gap-2">
                  <b className="text-[var(--ui-text-primary)]">
                    {item.channel}
                  </b>
                  <span className="text-xs text-[var(--ui-text-muted)]">
                    {item.status}
                  </span>
                </div>
                <span className="mt-1 block truncate text-xs text-[var(--ui-text-muted)]">
                  {item.external_id || "Customer CRM"} ·{" "}
                  {date(item.last_message_at)}
                </span>
              </button>
            ))
          ) : (
            <Empty text="Pesan WhatsApp masuk akan muncul di sini." />
          )}
        </aside>
        <div className="flex min-h-[360px] flex-col">
          {selected ? (
            <>
              <div className="border-b border-[var(--ui-border)] p-4">
                <b className="text-[var(--ui-text-primary)]">
                  {selected.channel === "whatsapp"
                    ? "WhatsApp"
                    : selected.channel}
                </b>
                <span className="ml-2 text-xs text-[var(--ui-text-muted)]">
                  {selected.external_id}
                </span>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.length ? (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`max-w-[80%] p-3 text-sm ${message.direction === "outbound" ? "ml-auto bg-[var(--ui-primary)] text-white" : "bg-[var(--ui-bg-input)] text-[var(--ui-text-primary)]"}`}
                    >
                      <p>{message.body}</p>
                      <span className="mt-1 block text-[10px] opacity-70">
                        {date(message.created_at)}
                      </span>
                    </div>
                  ))
                ) : (
                  <Empty text="Belum ada pesan dalam percakapan ini." />
                )}
              </div>
              <div className="border-t border-[var(--ui-border)] p-3">
                <textarea
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="Tulis balasan WhatsApp"
                  className={`${input} min-h-20`}
                />
                <button
                  type="button"
                  disabled={
                    sending || selected.channel !== "whatsapp" || !reply.trim()
                  }
                  onClick={() => void sendReply()}
                  className="mt-2 bg-[var(--ui-primary)] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  {sending ? "Mengirim…" : "Kirim balasan"}
                </button>
              </div>
            </>
          ) : (
            <div className="grid flex-1 place-items-center p-6">
              <Empty text="Pilih percakapan untuk membuka inbox." />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
function Automation({
  workflows,
  emails,
  campaigns,
  knowledge,
  integrations,
  onCreate,
  onCompose,
  onDisconnectWhatsApp,
  onSyncEmailInbox,
}: {
  workflows: RecordRow[];
  emails: RecordRow[];
  campaigns: RecordRow[];
  knowledge: RecordRow[];
  integrations: RecordRow[];
  onCreate: () => void;
  onCompose: (kind: ComposerKind) => void;
  onDisconnectWhatsApp: () => void;
  onSyncEmailInbox: () => void;
}) {
  const whatsApp = integrations.find(
    (item) => item.provider === "whatsapp_web",
  );
  const whatsAppSettings = jsonValue(whatsApp?.settings);
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Records
        title="Workflow lintas divisi"
        intro="Atur approval dan pekerjaan otomatis saat lead, deal, tiket, atau quote berubah."
        rows={workflows}
        cols={["name", "trigger", "is_active", "updated_at"]}
        onCreate={onCreate}
        createLabel="Buat workflow"
      />
      <Panel title="Connect email" caption="Koneksi disimpan per workspace">
        <div className="space-y-2">
          {emails.length ? (
            emails.map((e: RecordRow) => (
              <div
                key={e.id}
                className="flex items-center justify-between border-b border-[var(--ui-border)] py-2 text-sm"
              >
                <span>{e.email}</span>
                <span className="text-[var(--ui-text-muted)]">
                  {e.provider} · {e.status}
                </span>
              </div>
            ))
          ) : (
            <Empty text="Belum ada email terhubung. Gunakan tombol Connect email di atas." />
          )}
        </div>
        {emails.length > 0 && (
          <button
            onClick={onSyncEmailInbox}
            className="mt-3 border border-[var(--ui-border-input)] px-3 py-2 text-xs font-semibold text-[var(--ui-text-primary)]"
          >
            Sync inbox sekarang
          </button>
        )}
      </Panel>
      <Records
        title="Campaign email"
        intro="Jadwalkan email berdasarkan lifecycle customer. Pengiriman berjalan melalui queue dan scheduler Laravel."
        rows={campaigns}
        cols={["name", "status", "scheduled_at", "sent_at"]}
        onCreate={() => onCompose("campaign")}
        createLabel="Buat campaign"
      />
      <Panel
        title="Kanal komunikasi"
        caption="Simpan koneksi tenant untuk WhatsApp, live chat, dan sosial sebelum webhook atau sinkronisasi diaktifkan."
      >
        <div className="space-y-2">
          {integrations.length ? (
            integrations.map((item: RecordRow) => (
              <div
                key={item.id}
                className="flex items-center justify-between border-b border-[var(--ui-border)] py-2 text-sm"
              >
                <span className="font-medium text-[var(--ui-text-primary)]">
                  {item.provider}
                </span>
                <span className="text-[var(--ui-text-muted)]">
                  {item.channel} · {item.status}
                </span>
              </div>
            ))
          ) : (
            <Empty text="Belum ada kanal terhubung." />
          )}
          <button
            onClick={() => onCompose("integration")}
            className="mt-2 inline-flex items-center gap-2 border border-[var(--ui-border-input)] px-3 py-2 text-xs font-semibold text-[var(--ui-text-primary)]"
          >
            <Plus size={14} /> Hubungkan kanal
          </button>
          {whatsApp && (
            <button
              type="button"
              onClick={onDisconnectWhatsApp}
              className="ml-2 border border-red-300 px-3 py-2 text-xs font-semibold text-red-700"
            >
              Hapus koneksi WhatsApp
            </button>
          )}
          {whatsApp?.status === "awaiting_scan" && whatsAppSettings.qr && (
            <div className="mt-4 border border-[var(--ui-border)] bg-white p-3">
              <p className="mb-2 text-xs font-semibold text-slate-700">
                Scan QR dengan WhatsApp untuk menghubungkan nomor ini.
              </p>
              <img
                src={whatsAppSettings.qr}
                alt="QR WhatsApp"
                className="h-52 w-52"
              />
            </div>
          )}
          {whatsApp?.status === "connected" && (
            <p className="mt-3 text-xs font-semibold text-emerald-600">
              WhatsApp terhubung{" "}
              {whatsAppSettings.phone ? `· ${whatsAppSettings.phone}` : ""}
            </p>
          )}
          {whatsAppSettings.delivery_error && (
            <div className="mt-3 border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <b>Pesan masuk belum tersimpan</b>
              <p className="mt-1">{whatsAppSettings.delivery_error}</p>
            </div>
          )}
          {["error", "auth_failed", "disconnected"].includes(
            whatsApp?.status || "",
          ) && (
            <div className="mt-3 border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <b>WhatsApp {whatsApp?.status}</b>
              <p className="mt-1">
                {whatsAppSettings.message ||
                  whatsAppSettings.reason ||
                  "Sesi tidak dapat dijalankan. Periksa log container WhatsApp."}
              </p>
            </div>
          )}
        </div>
      </Panel>
      <Records
        title="Knowledge base"
        intro="Artikel internal untuk jawaban yang seragam dan resolusi tiket lebih cepat."
        rows={knowledge}
        cols={["title", "locale", "status", "updated_at"]}
        onCreate={() => onCompose("knowledge")}
        createLabel="Tulis artikel"
      />
    </div>
  );
}
function Pipeline({
  deals,
  onCreate,
  onMove,
}: {
  deals: RecordRow[];
  onCreate: () => void;
  onMove: (row: RecordRow, stage: string) => void;
}) {
  return (
    <section className={`${card} overflow-x-auto`}>
      <div className="flex items-center justify-between border-b border-[var(--ui-border)] p-4">
        <div>
          <h3 className="font-bold text-[var(--ui-text-primary)]">
            Sales pipeline
          </h3>
          <p className="mt-1 text-sm text-[var(--ui-text-secondary)]">
            Pindahkan deal melalui tahap penjualan dan pantau nilai terbesar.
          </p>
        </div>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 bg-[var(--ui-primary)] px-3 py-2 text-xs font-bold text-white"
        >
          <Plus size={14} />
          Deal baru
        </button>
      </div>
      <div className="grid min-w-[1040px] grid-cols-6 gap-2 p-4">
        {stages.map((stage) => (
          <div
            key={stage}
            className="min-h-[270px] bg-[var(--ui-bg-input)] p-2"
          >
            <div className="mb-2 text-xs font-bold capitalize text-[var(--ui-text-secondary)]">
              {stage.replaceAll("_", " ")}
            </div>
            {deals
              .filter((d: RecordRow) => d.stage === stage)
              .map((deal: RecordRow) => (
                <article
                  key={deal.id}
                  className="mb-2 border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-3"
                >
                  <b className="block text-sm text-[var(--ui-text-primary)]">
                    {deal.name}
                  </b>
                  <span className="mt-1 block text-xs text-[var(--ui-text-muted)]">
                    {money(deal.amount, deal.currency)} · {deal.probability}%
                  </span>
                  <select
                    value={deal.stage}
                    onChange={(e) => onMove(deal, e.target.value)}
                    className="mt-3 w-full border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] p-1.5 text-[11px]"
                  >
                    {stages.map((s) => (
                      <option key={s} value={s}>
                        {s.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </article>
              ))}
          </div>
        ))}
      </div>
    </section>
  );
}
function Records({
  title,
  intro,
  rows,
  cols,
  onCreate,
  onAction,
  actionLabel,
  onSecondaryAction,
  secondaryActionLabel,
  canAction,
  createLabel,
}: {
  title: string;
  intro: string;
  rows: RecordRow[];
  cols: string[];
  onCreate: () => void;
  onAction?: (row: RecordRow) => void;
  actionLabel?: string | ((row: RecordRow) => string);
  onSecondaryAction?: (row: RecordRow) => void;
  secondaryActionLabel?: string;
  canAction?: (row: RecordRow) => boolean;
  createLabel?: string;
}) {
  return (
    <section className={card}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ui-border)] p-4">
        <div>
          <h3 className="font-bold text-[var(--ui-text-primary)]">{title}</h3>
          <p className="mt-1 text-sm text-[var(--ui-text-secondary)]">
            {intro}
          </p>
        </div>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 bg-[var(--ui-primary)] px-3 py-2 text-xs font-bold text-white"
        >
          <Plus size={14} />
          {createLabel || "Tambah data"}
        </button>
      </div>
      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-[var(--ui-bg-input)] text-xs uppercase tracking-wide text-[var(--ui-text-muted)]">
              <tr>
                {cols.map((c) => (
                  <th key={c} className="px-4 py-3 font-semibold">
                    {c.replaceAll("_", " ")}
                  </th>
                ))}
                {(onAction || onSecondaryAction) && <th />}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-[var(--ui-border)]">
                  {cols.map((c) => (
                    <td
                      key={c}
                      className="max-w-[240px] px-4 py-3 text-[var(--ui-text-secondary)]"
                    >
                      {c.includes("amount") || c === "subtotal"
                        ? money(row[c], row.currency)
                        : c.includes("_at")
                          ? date(row[c])
                          : String(row[c] ?? "—")}
                    </td>
                  ))}
                  {(onAction || onSecondaryAction) && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {onSecondaryAction && (
                          <button
                            onClick={() => onSecondaryAction(row)}
                            className="border border-[var(--ui-border-input)] px-2 py-1 text-xs font-semibold text-[var(--ui-text-primary)]"
                          >
                            {secondaryActionLabel}
                          </button>
                        )}
                        {onAction && (
                          <button
                            type="button"
                            disabled={canAction ? !canAction(row) : false}
                            onClick={() => onAction(row)}
                            className="border border-[var(--ui-border-input)] px-2 py-1 text-xs font-semibold text-[var(--ui-text-primary)] disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            {typeof actionLabel === "function"
                              ? actionLabel(row)
                              : actionLabel}
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty text="Belum ada data. Tambahkan data pertama untuk memulai alur kerja tim." />
      )}
    </section>
  );
}
function Composer({
  kind,
  companyId,
  customers,
  leads,
  deals,
  onClose,
  onDone,
}: {
  kind: ComposerKind;
  companyId: string;
  customers: RecordRow[];
  leads: RecordRow[];
  deals: RecordRow[];
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({
    currency: "IDR",
    source: "manual",
    type: "task",
    priority: "normal",
    channel: "web",
    trigger: "lead_created",
    provider: "gmail",
    integration_provider: "whatsapp",
    integration_channel: "whatsapp",
    base_currency: "IDR",
    period: new Date().toISOString().slice(0, 7),
  });
  const field = (key: string, label: string, type = "text") => (
    <label className="block text-xs font-semibold text-[var(--ui-text-secondary)]">
      {label}
      <input
        type={type}
        value={form[key] || ""}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className={`${input} mt-1`}
      />
    </label>
  );
  const submit = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (kind === "lead") await createCrmLead(companyId, form);
      if (kind === "customer") await createCrmCustomer(companyId, form);
      if (kind === "deal")
        await createCrmDeal(companyId, {
          ...form,
          amount: Number(form.amount || 0),
          probability: Number(form.probability || 10),
        });
      if (kind === "task") await createCrmActivity(companyId, form);
      if (kind === "ticket") await createCrmTicket(companyId, form);
      if (kind === "quote")
        await createCrmQuote(companyId, {
          ...form,
          lines: [
            {
              name: form.line_name || "Item",
              quantity: Number(form.quantity || 1),
              unit_price: Number(form.unit_price || 0),
            },
          ],
          discount_amount: Number(form.discount_amount || 0),
          tax_amount: Number(form.tax_amount || 0),
        });
      if (kind === "workflow")
        await createCrmWorkflow(companyId, {
          ...form,
          actions: [{ type: "create_task", title: "Review otomatis" }],
        });
      if (kind === "email") {
        if (form.provider === "imap") {
          await createCrmEmailConnection(companyId, form);
        } else {
          const { authorization_url } = await authorizeCrmEmail(
            companyId,
            form.provider,
          );
          window.open(
            authorization_url,
            "crm-email-oauth",
            "width=560,height=720",
          );
          Swal.fire({
            icon: "info",
            title: "Lanjutkan otorisasi",
            text: "Selesaikan login pada jendela provider, lalu kembali dan refresh CRM.",
          });
        }
      }
      if (kind === "campaign")
        await createCrmCampaign(companyId, {
          name: form.name,
          subject: form.subject,
          body: form.body,
          scheduled_at: form.scheduled_at || undefined,
        });
      if (kind === "knowledge")
        await createCrmKnowledge(companyId, {
          title: form.title,
          body: form.body,
          status: form.status || "draft",
          locale: form.locale || "id",
        });
      if (kind === "integration")
        if (form.integration_provider === "whatsapp") {
          await startCrmWhatsAppSession(companyId);
        } else {
          await connectCrmIntegration(companyId, {
            provider: form.integration_provider,
            channel: form.integration_channel,
            settings: form.settings ? { endpoint: form.settings } : {},
          });
        }
      if (kind === "target")
        await createCrmSalesTarget(companyId, {
          period: form.period,
          target_amount: Number(form.target_amount || 0),
          currency: form.currency || "IDR",
        });
      if (kind === "rate")
        await createCrmCurrencyRate(companyId, {
          base_currency: form.base_currency || "IDR",
          quote_currency: form.quote_currency,
          rate: Number(form.rate || 0),
        });
      await onDone();
      Swal.fire({
        icon: "success",
        title: "Tersimpan",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal menyimpan",
        text: err.message || "Periksa kembali data.",
      });
    } finally {
      setSaving(false);
    }
  };
  const title = {
    lead: "Lead baru",
    customer: "Customer baru",
    deal: "Deal baru",
    task: "Task baru",
    ticket: "Tiket baru",
    quote: "Quote baru",
    workflow: "Workflow baru",
    email: "Connect email",
    campaign: "Campaign email",
    knowledge: "Artikel knowledge base",
    integration: "Hubungkan kanal",
    target: "Target penjualan",
    rate: "Kurs mata uang",
  }[kind];
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/35 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-lg border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-5 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold text-[var(--ui-text-primary)]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-[var(--ui-text-muted)]"
          >
            Tutup
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {["lead", "customer"].includes(kind) && (
            <>
              {field("name", "Nama *")}
              {field("company_name", "Perusahaan")}
              {field("email", "Email", "email")}
              {field("phone", "Nomor telepon")}
              {kind === "lead" &&
                field("estimated_value", "Estimasi nilai", "number")}
            </>
          )}
          {kind === "deal" && (
            <>
              {field("name", "Nama deal *")}
              {field("amount", "Nilai peluang", "number")}
              {field("probability", "Probabilitas (%)", "number")}
              <Select
                label="Customer"
                value={form.customer_id || ""}
                onChange={(v) => setForm({ ...form, customer_id: v })}
                options={customers}
              />
              <Select
                label="Lead"
                value={form.lead_id || ""}
                onChange={(v) => setForm({ ...form, lead_id: v })}
                options={leads}
              />
            </>
          )}
          {kind === "task" && (
            <>
              {field("title", "Judul task *")}
              <Select
                label="Terkait deal"
                value={form.deal_id || ""}
                onChange={(v) => setForm({ ...form, deal_id: v })}
                options={deals}
              />
              {field("due_at", "Jatuh tempo", "datetime-local")}
            </>
          )}
          {kind === "ticket" && (
            <>
              {field("subject", "Subjek *")}
              <Select
                label="Customer"
                value={form.customer_id || ""}
                onChange={(v) => setForm({ ...form, customer_id: v })}
                options={customers}
              />
              <label className="block text-xs font-semibold text-[var(--ui-text-secondary)]">
                Prioritas
                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm({ ...form, priority: e.target.value })
                  }
                  className={`${input} mt-1`}
                >
                  <option>normal</option>
                  <option>high</option>
                  <option>urgent</option>
                </select>
              </label>
            </>
          )}
          {kind === "quote" && (
            <>
              {field("line_name", "Nama item *")}
              {field("quantity", "Kuantitas", "number")}
              {field("unit_price", "Harga satuan", "number")}
              <Select
                label="Customer"
                value={form.customer_id || ""}
                onChange={(v) => setForm({ ...form, customer_id: v })}
                options={customers}
              />
            </>
          )}
          {kind === "workflow" && (
            <>
              {field("name", "Nama workflow *")}
              <label className="block text-xs font-semibold text-[var(--ui-text-secondary)]">
                Trigger
                <select
                  value={form.trigger}
                  onChange={(e) =>
                    setForm({ ...form, trigger: e.target.value })
                  }
                  className={`${input} mt-1`}
                >
                  <option value="lead_created">Lead dibuat</option>
                  <option value="deal_stage_changed">Deal berubah tahap</option>
                  <option value="ticket_created">Tiket dibuat</option>
                  <option value="quote_approved">Quote disetujui</option>
                </select>
              </label>
            </>
          )}
          {kind === "email" && (
            <>
              <label className="block text-xs font-semibold text-[var(--ui-text-secondary)]">
                Provider
                <select
                  value={form.provider}
                  onChange={(e) =>
                    setForm({ ...form, provider: e.target.value })
                  }
                  className={`${input} mt-1`}
                >
                  <option value="gmail">Gmail</option>
                  <option value="microsoft">Microsoft 365</option>
                  <option value="imap">IMAP</option>
                </select>
              </label>
              {form.provider === "imap" &&
                field("email", "Email kerja *", "email")}
              {form.provider !== "imap" && (
                <p className="sm:col-span-2 text-xs leading-5 text-[var(--ui-text-muted)]">
                  Anda akan login ke provider. Alamat email akan diambil
                  langsung dari akun yang disetujui.
                </p>
              )}
            </>
          )}
          {kind === "campaign" && (
            <>
              {field("name", "Nama campaign *")}
              {field("subject", "Subjek email *")}
              {field("scheduled_at", "Jadwalkan kirim", "datetime-local")}
              <label className="sm:col-span-2 block text-xs font-semibold text-[var(--ui-text-secondary)]">
                Isi email *
                <textarea
                  value={form.body || ""}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  className={`${input} mt-1 min-h-28`}
                />
              </label>
            </>
          )}
          {kind === "knowledge" && (
            <>
              {field("title", "Judul artikel *")}
              <label className="block text-xs font-semibold text-[var(--ui-text-secondary)]">
                Status
                <select
                  value={form.status || "draft"}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className={`${input} mt-1`}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>
              <label className="sm:col-span-2 block text-xs font-semibold text-[var(--ui-text-secondary)]">
                Isi artikel *
                <textarea
                  value={form.body || ""}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  className={`${input} mt-1 min-h-28`}
                />
              </label>
            </>
          )}
          {kind === "integration" && (
            <>
              <label className="block text-xs font-semibold text-[var(--ui-text-secondary)]">
                Provider
                <select
                  value={form.integration_provider}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      integration_provider: e.target.value,
                      integration_channel:
                        e.target.value === "live_chat"
                          ? "live_chat"
                          : e.target.value === "social"
                            ? "social"
                            : e.target.value,
                    })
                  }
                  className={`${input} mt-1`}
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="live_chat">Live chat</option>
                  <option value="social">Social</option>
                  <option value="gmail">Gmail</option>
                  <option value="microsoft">Microsoft 365</option>
                </select>
              </label>
              {field("settings", "Endpoint atau workspace ID")}
            </>
          )}
          {kind === "target" && (
            <>
              {field("period", "Periode (YYYY-MM) *")}
              {field("target_amount", "Target penjualan *", "number")}
            </>
          )}
          {kind === "rate" && (
            <>
              {field("base_currency", "Mata uang dasar *")}
              {field("quote_currency", "Mata uang pembanding *")}
              {field("rate", "Nilai kurs *", "number")}
            </>
          )}
        </div>
        <button
          disabled={saving}
          className="mt-5 w-full bg-[var(--ui-primary)] px-3 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? "Menyimpan…" : "Simpan"}
        </button>
      </form>
    </div>
  );
}
function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: RecordRow[];
}) {
  return (
    <label className="block text-xs font-semibold text-[var(--ui-text-secondary)]">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${input} mt-1`}
      >
        <option value="">Tidak dipilih</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name || o.title}
          </option>
        ))}
      </select>
    </label>
  );
}
function Panel({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: any;
}) {
  return (
    <section className={`${card} p-4`}>
      <h3 className="font-bold text-[var(--ui-text-primary)]">{title}</h3>
      <p className="mt-1 text-sm text-[var(--ui-text-secondary)]">{caption}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}
function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: any;
  tone?: string;
}) {
  return (
    <div className={`${card} p-4`}>
      <p className="text-xs font-semibold uppercase tracking-[.1em] text-[var(--ui-text-muted)]">
        {label}
      </p>
      <p
        className={`mt-2 text-xl font-bold ${tone ? "text-red-600" : "text-[var(--ui-text-primary)]"}`}
      >
        {value}
      </p>
    </div>
  );
}
function Mini({ label, value }: { label: string; value: any }) {
  return (
    <div className="border border-[var(--ui-border)] bg-[var(--ui-bg-input)] p-3">
      <p className="text-[11px] text-[var(--ui-text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-bold text-[var(--ui-text-primary)]">
        {value}
      </p>
    </div>
  );
}
function PipelineBars({ pipeline }: { pipeline: Record<string, any> }) {
  return (
    <div className="space-y-3">
      {stages.slice(0, 4).map((stage) => {
        const row = pipeline[stage] || {};
        const value = Number(row.amount || 0);
        const max = Math.max(
          ...Object.values(pipeline).map((x: any) => Number(x.amount || 0)),
          1,
        );
        return (
          <div key={stage}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="capitalize text-[var(--ui-text-secondary)]">
                {stage}
              </span>
              <span className="font-semibold text-[var(--ui-text-primary)]">
                {money(value)}
              </span>
            </div>
            <div className="h-2 bg-[var(--ui-bg-input)]">
              <div
                className="h-full bg-[var(--ui-primary)]"
                style={{ width: `${Math.max(4, (value / max) * 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
function TaskList({ rows }: { rows: RecordRow[] }) {
  return rows.length ? (
    <div className="space-y-2">
      {rows.map((r) => (
        <div
          key={r.id}
          className="border-b border-[var(--ui-border)] pb-2 last:border-0"
        >
          <div className="text-sm font-semibold text-[var(--ui-text-primary)]">
            {r.title}
          </div>
          <div className="mt-1 text-xs text-[var(--ui-text-muted)]">
            {r.type || r.status} · {date(r.due_at || r.created_at)}
          </div>
        </div>
      ))}
    </div>
  ) : (
    <Empty text="Belum ada aktivitas terjadwal." />
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="p-8 text-center text-sm text-[var(--ui-text-muted)]">
      {text}
    </div>
  );
}
function Loading() {
  return (
    <div className="grid place-items-center p-20 text-sm text-[var(--ui-text-muted)]">
      Memuat CRM…
    </div>
  );
}
function AccessState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <section className={`${card} mx-auto max-w-2xl p-8 text-center`}>
      <ContactRound className="mx-auto text-[var(--ui-primary)]" size={36} />
      <h2 className="mt-4 text-lg font-bold text-[var(--ui-text-primary)]">
        CRM belum dapat dibuka
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--ui-text-secondary)]">
        {error}
      </p>
      <button
        onClick={onRetry}
        className="mt-5 bg-[var(--ui-primary)] px-4 py-2 text-sm font-bold text-white"
      >
        Coba lagi
      </button>
    </section>
  );
}
