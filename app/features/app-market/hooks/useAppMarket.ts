import { useEffect, useState, useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Package,
  BarChart3,
  Truck,
  Headphones,
  ContactRound,
  WalletCards,
} from "lucide-react";
import { getWmsApps, installWms, uninstallWms } from "~/lib/api/wms";
import { getCrmApps, installCrm, uninstallCrm } from "~/lib/api/crm";
import { getBudgetApps, installBudgetApp, uninstallBudgetApp } from "~/lib/api/budgeting";

export type AppIconKey =
  | "wms-inventory"
  | "crm"
  | "budget-procurement-plan"
  | "analytics"
  | "logistics"
  | "support";

export interface MarketApp {
  key: AppIconKey;
  name: string;
  category: "Operations" | "Analytics" | "Logistics" | "Support" | "Sales";
  shortName: string;
  description: string;
  longDescription: string;
  badge: string;
  tags: string[];
  free: boolean;
  installedKey?: "wms-inventory" | "crm" | "budget-procurement-plan";
  requiredPlan?: "enterprise_pro";
  icon: LucideIcon;
  iconBgGradient: string;
  iconColor: string;
  route?: string;
}

export const MARKET_APPS: MarketApp[] = [
  {
    key: "wms-inventory",
    name: "WMS & Inventory",
    category: "Operations",
    shortName: "WMS",
    description:
      "Multiwarehouse operations with receiving, put away, inventory allocation, fulfilment, and operational reporting.",
    longDescription:
      "Kelola multiwarehouse, receiving dan put away, alokasi order, packaging, pergerakan stok, serta laporan operasional dari satu tempat. Data setiap perusahaan workspace terisolasi penuh (tenant-isolated) dan terintegrasi langsung dengan Huntr Catalogue.",
    badge: "Huntr Catalogue integrated",
    tags: [
      "Multiwarehouse",
      "Receiving & Put Away",
      "Order Allocation",
      "Packaging & Dispatch",
      "Stock Analysis",
      "Tenant isolated",
    ],
    free: true,
    installedKey: "wms-inventory",
    icon: Package,
    iconBgGradient:
      "linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#ec4899 100%)",
    iconColor: "#ffffff",
    route: "/wms",
  },
  {
    key: "crm",
    name: "CRM Enterprise",
    category: "Sales",
    shortName: "CRM",
    description:
      "Customer 360, pipeline penjualan, automation, helpdesk, CPQ, dan forecast AI.",
    longDescription:
      "CRM Enterprise menyatukan data pelanggan, lead, deal, aktivitas, tiket, kanal komunikasi, workflow lintas divisi, quotation CPQ, wilayah penjualan, dan prediksi pendapatan. Hanya tersedia untuk Enterprise Pro aktif dan setiap data tetap terisolasi di workspace perusahaan.",
    badge: "Enterprise Pro",
    tags: [
      "Customer 360",
      "Lead Scoring",
      "Sales Pipeline",
      "Helpdesk",
      "CPQ",
      "Forecast AI",
    ],
    free: true,
    installedKey: "crm",
    requiredPlan: "enterprise_pro",
    icon: ContactRound,
    iconBgGradient:
      "linear-gradient(135deg,#0f766e 0%,#0ea5e9 55%,#6366f1 100%)",
    iconColor: "#ffffff",
    route: "/crm",
  },
  {
    key: "budget-procurement-plan",
    name: "Budgeting & Procurement Plan",
    category: "Operations",
    shortName: "Budget",
    description: "Budget cycle, allocation, procurement plan, approval, dan kontrol komitmen PR/PO.",
    longDescription: "Rencanakan belanja dari awal tahun sampai realisasi. Buat periode anggaran, pecah alokasi per departemen atau kategori, ajukan procurement plan, lalu kaitkan ke PR dan PO agar komitmen serta selisih anggaran selalu terlihat.",
    badge: "Enterprise Pro",
    tags: ["Budget cycle", "Allocation", "Procurement plan", "PR/PO commitment", "Variance"],
    free: true,
    installedKey: "budget-procurement-plan",
    requiredPlan: "enterprise_pro",
    icon: WalletCards,
    iconBgGradient: "linear-gradient(135deg,#334155 0%,#0f766e 100%)",
    iconColor: "#ffffff",
    route: "/budgeting",
  },
  {
    key: "analytics",
    name: "Business Analytics",
    category: "Analytics",
    shortName: "BI",
    description:
      "Dashboards, KPIs, dan laporan pembelanjaan perusahaan secara real-time.",
    longDescription:
      "Business Analytics menyediakan dasbor interaktif dengan KPI spend, pembelian per kategori, tren vendor, serta performa tender. Dapat di export ke PDF / Excel dan tersedia widget yang bisa di embed ke halaman perusahaan Anda.",
    badge: "Coming soon",
    tags: [
      "KPI Dashboard",
      "Spend Analysis",
      "Vendor Performance",
      "Export PDF/Excel",
    ],
    free: true,
    icon: BarChart3,
    iconBgGradient:
      "linear-gradient(135deg,#06b6d4 0%,#3b82f6 60%,#6366f1 100%)",
    iconColor: "#ffffff",
  },
  {
    key: "logistics",
    name: "Logistics & Tracking",
    category: "Logistics",
    shortName: "Log",
    description:
      "Integrasi kurir, tracking pengiriman, dan penerimaan barang end-to-end.",
    longDescription:
      "Integrasi dengan penyedia jasa pengiriman lokal (JNE, SiCepat, J&T, dll) untuk tracking otomatis, manajemen proof of delivery (POD), serta integrasi ke penerimaan barang di WMS.",
    badge: "Coming soon",
    tags: ["Courier Integration", "Live Tracking", "Proof of Delivery"],
    free: true,
    icon: Truck,
    iconBgGradient:
      "linear-gradient(135deg,#1f2937 0%,#4b5563 50%,#111827 100%)",
    iconColor: "#facc15",
  },
  {
    key: "support",
    name: "Helpdesk & Ticketing",
    category: "Support",
    shortName: "Sup",
    description:
      "Tiket bantuan internal untuk tim procurement, vendor, dan buyer.",
    longDescription:
      "Sistem tiket bantuan multi-channel untuk operasional perusahaan: support untuk user internal, vendor, maupun buyer. Termasuk SLA, routing otomatis, dan laporan CSAT.",
    badge: "Coming soon",
    tags: ["Multi-channel", "SLA Management", "CSAT Reporting"],
    free: true,
    icon: Headphones,
    iconBgGradient:
      "linear-gradient(135deg,#84cc16 0%,#22c55e 50%,#06b6d4 100%)",
    iconColor: "#052e16",
  },
];

export const CATEGORIES: MarketApp["category"][] = [
  "Operations",
  "Analytics",
  "Logistics",
  "Support",
  "Sales",
];

export const FILTERS = ["All apps", "Available", "Installed"] as const;
export type FilterOption = (typeof FILTERS)[number];

export function useAppMarket() {
  const [company, setCompany] = useState<any>(null);
  const [installStates, setInstallStates] = useState<Record<string, boolean>>(
    {},
  );
  const [eligibility, setEligibility] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [category, setCategory] = useState<string>("All categories");
  const [filter, setFilter] = useState<FilterOption>("All apps");

  useEffect(() => {
    try {
      setCompany(JSON.parse(localStorage.getItem("active_company") || "null"));
    } catch {
      setCompany(null);
    }
  }, []);

  useEffect(() => {
    if (!company?.id) return;
    Promise.all([getWmsApps(company.id), getCrmApps(company.id), getBudgetApps(company.id)])
      .then(([wms, crm, budgeting]: any[]) => {
        const map: Record<string, boolean> = {};
        const eligible: Record<string, boolean> = {};
        for (const app of [...(wms?.apps ?? []), ...(crm?.apps ?? []), ...(budgeting?.apps ?? [])]) {
          map[app.key] = Boolean(app.installed);
          if (typeof app.eligible === "boolean")
            eligible[app.key] = app.eligible;
        }
        setInstallStates(map);
        setEligibility(eligible);
      })
      .catch((e: any) => setError(e.message));
  }, [company?.id]);

  const isInstalled = (app: MarketApp): boolean => {
    if (!app.installedKey) return false;
    return Boolean(installStates[app.installedKey]);
  };

  const isBusy = (key: string) => Boolean(busy[key]);
  const isEligible = (app: MarketApp) =>
    !app.requiredPlan || eligibility[app.key] === true;

  const install = async (app: MarketApp) => {
    if (!company?.id) {
      setError("Pilih perusahaan terlebih dahulu.");
      return;
    }
    if (!app.installedKey) {
      setError(`${app.name} akan segera tersedia.`);
      return;
    }
    if (!isEligible(app)) {
      setError(
        `${app.name} hanya dapat diinstall pada paket Enterprise Pro yang aktif.`,
      );
      return;
    }
    setBusy((b) => ({ ...b, [app.key]: true }));
    setError("");
    try {
      if (app.installedKey === "wms-inventory") await installWms(company.id);
      if (app.installedKey === "crm") await installCrm(company.id);
      if (app.installedKey === "budget-procurement-plan") await installBudgetApp(company.id);
      setInstallStates((s) => ({ ...s, [app.installedKey as string]: true }));
      window.dispatchEvent(new Event("huntr-app-installations-updated"));
    } catch (e: any) {
      setError(e.message || "Gagal menginstall aplikasi.");
    } finally {
      setBusy((b) => ({ ...b, [app.key]: false }));
    }
  };

  const uninstall = async (app: MarketApp) => {
    if (!company?.id) return;
    if (!app.installedKey) return;
    setBusy((b) => ({ ...b, [app.key]: true }));
    setError("");
    try {
      if (app.installedKey === "wms-inventory") await uninstallWms(company.id);
      if (app.installedKey === "crm") await uninstallCrm(company.id);
      if (app.installedKey === "budget-procurement-plan") await uninstallBudgetApp(company.id);
      setInstallStates((s) => ({ ...s, [app.installedKey as string]: false }));
      window.dispatchEvent(new Event("huntr-app-installations-updated"));
    } catch (e: any) {
      setError(e.message || "Gagal menghapus aplikasi.");
    } finally {
      setBusy((b) => ({ ...b, [app.key]: false }));
    }
  };

  const visibleApps = useMemo(() => {
    return MARKET_APPS.filter((app) => {
      const matchCategory =
        category === "All categories" || category === app.category;
      const installed = isInstalled(app);
      const matchFilter =
        filter === "All apps" ||
        (filter === "Installed" && installed) ||
        (filter === "Available" && !installed);
      const q = query.trim().toLowerCase();
      const matchQuery =
        !q ||
        `${app.name} ${app.shortName} ${app.description} ${app.category}`
          .toLowerCase()
          .includes(q);
      return matchCategory && matchFilter && matchQuery;
    });
  }, [category, filter, query, installStates]);

  return {
    company,
    query,
    setQuery,
    category,
    setCategory,
    filter,
    setFilter,
    error,
    setError,
    visibleApps,
    isInstalled,
    isBusy,
    isEligible,
    install,
    uninstall,
  };
}
