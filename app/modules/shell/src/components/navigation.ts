import {
  LayoutDashboard,
  ListTodo,
  Building2,
  Package,
  ClipboardList,
  Lightbulb,
  Trophy,
  CheckCircle2,
  ReceiptText,
  List,
  Settings,
  Medal,
  History,
  MessageSquare,
  Briefcase,
  FileText,
  Sparkles,
  Users,
  ContactRound,
  WalletCards,
  Boxes,
  Map,
  ArrowDownToLine,
  Truck,
  BarChart3,
  Layers,
  PackageCheck,
  SlidersHorizontal,
  Target,
  Headphones,
  Zap,
  Landmark,
} from "lucide-react";
import { isNavItemDisabledInDemo } from "~/lib/demo-mode";
import type { TranslationKey } from "~/context/LanguageContext";

export interface NavItemConfig {
  to: string;
  label: string;
  bottomLabel?: string;
  labelKey?: TranslationKey;
  Icon: any;
  section: string;
  badge?: string;
  exact?: boolean;
  isAi?: boolean;
}

/**
 * Warehouse operations exposed while the user is working in WMS.
 */
export function buildWmsBottomNavItems(companyPrefix: string): NavItemConfig[] {
  const wmsPath = `${companyPrefix}/wms`;

  return [
    { to: wmsPath, label: "Overview", Icon: LayoutDashboard, section: "wms", exact: true },
    { to: `${wmsPath}?tab=Stock`, label: "Stock", Icon: Boxes, section: "wms", exact: true },
    { to: `${wmsPath}?tab=Warehouse%20Map`, label: "Peta Gudang", Icon: Map, section: "wms", exact: true },
    { to: `${wmsPath}?tab=Racks`, label: "Rak", Icon: Layers, section: "wms", exact: true },
    { to: `${wmsPath}?tab=Receiving`, label: "Terima", Icon: ArrowDownToLine, section: "wms", exact: true },
    { to: `${wmsPath}?tab=Fulfillment`, label: "Fulfillment", Icon: PackageCheck, section: "wms", exact: true },
    { to: `${wmsPath}?tab=Transfers`, label: "Transfer", Icon: Truck, section: "wms", exact: true },
    { to: `${wmsPath}?tab=Adjustments`, label: "Penyesuaian", Icon: SlidersHorizontal, section: "wms", exact: true },
    { to: `${wmsPath}?tab=Warehouses`, label: "Gudang", Icon: Building2, section: "wms", exact: true },
    { to: `${wmsPath}?tab=Reports`, label: "Laporan", Icon: BarChart3, section: "wms", exact: true },
  ];
}

/** CRM operations exposed while the user is working in CRM Enterprise. */
export function buildCrmBottomNavItems(companyPrefix: string): NavItemConfig[] {
  const crmPath = `${companyPrefix}/crm`;

  return [
    { to: crmPath, label: "Overview", Icon: LayoutDashboard, section: "crm", exact: true },
    { to: `${crmPath}?tab=leads`, label: "Leads", Icon: Target, section: "crm", exact: true },
    { to: `${crmPath}?tab=pipeline`, label: "Pipeline", Icon: ContactRound, section: "crm", exact: true },
    { to: `${crmPath}?tab=customers`, label: "Customer", Icon: Users, section: "crm", exact: true },
    { to: `${crmPath}?tab=tasks`, label: "Tasks", Icon: ListTodo, section: "crm", exact: true },
    { to: `${crmPath}?tab=helpdesk`, label: "Helpdesk", Icon: Headphones, section: "crm", exact: true },
    { to: `${crmPath}?tab=cpq`, label: "Quotes", Icon: FileText, section: "crm", exact: true },
    { to: `${crmPath}?tab=automation`, label: "Automasi", Icon: Zap, section: "crm", exact: true },
    { to: `${crmPath}?tab=insights`, label: "Insights", Icon: Sparkles, section: "crm", exact: true },
  ];
}

/** Budgeting operations exposed while the user is working in Budgeting. */
export function buildBudgetBottomNavItems(companyPrefix: string): NavItemConfig[] {
  const budgetPath = `${companyPrefix}/budgeting`;

  return [
    { to: budgetPath, label: "Overview", Icon: WalletCards, section: "budgeting", exact: true },
    { to: `${budgetPath}?tab=allocations`, label: "Alokasi", Icon: Landmark, section: "budgeting", exact: true },
    { to: `${budgetPath}?tab=plans`, label: "Rencana", Icon: ClipboardList, section: "budgeting", exact: true },
  ];
}

interface BuildNavItemsParams {
  isPendingCompany: boolean;
  companyPrefix: string;
  showBuyerProcurement: boolean;
  canManageApprovals: boolean;
  agenticEnabled: boolean;
  showVendorMenu: boolean;
  isManager: boolean;
  isAdminRole: boolean;
  isVendorComp: boolean;
  wmsInstalled: boolean;
  crmInstalled: boolean;
  budgetInstalled: boolean;
  canAccessWms: boolean;
}

export function buildNavItems({
  isPendingCompany,
  companyPrefix,
  showBuyerProcurement,
  canManageApprovals,
  agenticEnabled,
  showVendorMenu,
  isManager,
  isAdminRole,
  isVendorComp,
  wmsInstalled,
  crmInstalled,
  budgetInstalled,
  canAccessWms,
}: BuildNavItemsParams): NavItemConfig[] {
  const items: NavItemConfig[] = [
    ...(isPendingCompany
      ? [
          {
            to: `${companyPrefix}/company`,
            label: "Company",
            labelKey: "nav.items.company",
            Icon: Building2,
            section: "settings",
            badge: "companyAlerts",
          },
          {
            to: `${companyPrefix}/account`,
            label: "Settings",
            labelKey: "nav.items.settings",
            Icon: Settings,
            section: "settings",
            badge: "accountAlerts",
          },
        ]
      : [
          {
            to: `${companyPrefix || "/"}`,
            label: "Dashboard",
            labelKey: "nav.items.dashboard",
            Icon: LayoutDashboard,
            section: "main",
            exact: true,
          },
          {
            to: `${companyPrefix}/tasks`,
            label: "Tasks",
            labelKey: "nav.items.tasks",
            Icon: ListTodo,
            section: "main",
            badge: "totalUnread",
          },

          // Procurement (Buyer & Vendor Buyer Mode)
          ...(showBuyerProcurement
            ? [
                ...(agenticEnabled
                  ? [
                      {
                        to: `${companyPrefix}/agentic-procurement`,
                        label: "AI Agentic Procurement",
                        bottomLabel: "Agentic",
                        labelKey: "nav.items.agenticProcurement",
                        Icon: Sparkles,
                        section: "procurement",
                        isAi: true,
                      },
                    ]
                  : []),
                {
                  to: `${companyPrefix}/marketplace`,
                  label: "Huntr Catalog",
                  bottomLabel: "Katalog",
                  labelKey: "nav.items.huntrCatalog",
                  Icon: Package,
                  section: "procurement",
                },
                {
                  to: `${companyPrefix}/crowd-buy`,
                  label: "Crowd Buy",
                  labelKey: "nav.items.crowdBuy",
                  Icon: Users,
                  section: "procurement",
                },
                {
                  to: `${companyPrefix}/my-pr`,
                  label: "My PR",
                  labelKey: "nav.items.myPr",
                  Icon: ClipboardList,
                  section: "procurement",
                  badge: "pendingNewProposals",
                },
              ]
            : []),
          ...(canManageApprovals
            ? [
                {
                  to: `${companyPrefix}/approvals`,
                  label: "Approvals",
                  bottomLabel: "Approval",
                  labelKey: "nav.items.approvals",
                  Icon: CheckCircle2,
                  section: "procurement",
                  badge: "pendingApprovals",
                },
              ]
            : []),
          ...(showBuyerProcurement
            ? [
                {
                  to: `${companyPrefix}/pr-audit`,
                  label: "PR Audit Log",
                  bottomLabel: "PR Audit",
                  labelKey: "nav.items.prAuditLog",
                  Icon: History,
                  section: "procurement",
                },
              ]
            : []),

          // Vendor (Only in Vendor Mode)
          ...(showVendorMenu
            ? [
                {
                  to: `${companyPrefix}/all-requests`,
                  label: "All Request",
                  labelKey: "nav.items.allRequest",
                  Icon: Lightbulb,
                  section: "vendor",
                  badge: "opportunities",
                },
              ]
            : []),
          ...(showVendorMenu && (isManager || isAdminRole)
            ? [
                {
                  to: `${companyPrefix}/catalogue`,
                  label: "Catalogue",
                  labelKey: "nav.items.catalogue",
                  Icon: List,
                  section: "vendor",
                  badge: "catalogueAlerts",
                },
                {
                  to: `${companyPrefix}/proposals`,
                  label: "Proposals",
                  labelKey: "nav.items.proposals",
                  Icon: Trophy,
                  section: "vendor",
                  badge: "pendingProposals",
                },
              ]
            : []),
          ...(showVendorMenu && (isManager || isAdminRole)
            ? [
                {
                  to: `${companyPrefix}/my-rank`,
                  label: "My Rank",
                  labelKey: "nav.items.myRank",
                  Icon: Medal,
                  section: "vendor",
                  badge: "rankAlerts",
                },
              ]
            : []),

          {
            to: `${companyPrefix}/apps`,
            label: "App Market",
            Icon: Package,
            section: "main",
          },
          ...(wmsInstalled && canAccessWms
            ? [
                {
                  to: `${companyPrefix}/wms`,
                  label: "WMS & Inventory",
                  Icon: Package,
                  section: "main",
                },
              ]
            : []),
          ...(crmInstalled
            ? [
                {
                  to: `${companyPrefix}/crm`,
                  label: "CRM Enterprise",
                  Icon: ContactRound,
                  section: "main",
                },
              ]
            : []),
          ...(budgetInstalled
            ? [
                {
                  to: `${companyPrefix}/budgeting`,
                  label: "Budgeting & Procurement Plan",
                  labelKey: "nav.items.budgeting",
                  Icon: WalletCards,
                  section: "main",
                },
              ]
            : []),
          // Orders & Documents
          {
            to: `${companyPrefix}/negotiation`,
            label: "Negotiations",
            bottomLabel: "Negosiasi",
            labelKey: "nav.items.negotiations",
            Icon: MessageSquare,
            section: "orders",
            badge: "negotiations",
          },
          ...(isVendorComp
            ? [
                {
                  to: `${companyPrefix}/orders`,
                  label: "Purchase Order",
                  bottomLabel: "PO",
                  labelKey: "nav.items.purchaseOrder",
                  Icon: ReceiptText,
                  section: "orders",
                  badge: "pendingPurchaseOrders",
                },
              ]
            : [
                {
                  to: `${companyPrefix}/orders`,
                  label: "Purchase Order",
                  bottomLabel: "PO",
                  labelKey: "nav.items.purchaseOrder",
                  Icon: ReceiptText,
                  section: "orders",
                  badge: "buyerOrderAlerts",
                },
              ]),
          {
            to: `${companyPrefix}/receipts`,
            label: "Goods Receipt",
            bottomLabel: "GR",
            labelKey: "nav.items.goodsReceipt",
            Icon: CheckCircle2,
            section: "orders",
            badge: "receiptsToInspect",
          },
          {
            to: `${companyPrefix}/bast`,
            label: "BAST",
            labelKey: "nav.items.bast",
            Icon: FileText,
            section: "orders",
            badge: "pendingBast",
          },
          {
            to: `${companyPrefix}/efaktur`,
            label: "e-Faktur",
            labelKey: "nav.items.eFaktur",
            Icon: ReceiptText,
            section: "orders",
          },
          {
            to: `${companyPrefix}/returns`,
            label: "Returns",
            bottomLabel: "Retur",
            labelKey: "nav.items.returns",
            Icon: Package,
            section: "orders",
            badge: "pendingReturns",
          },
          {
            to: `${companyPrefix}/debit-notes`,
            label: "Debit Notes",
            bottomLabel: "Debit",
            labelKey: "nav.items.debitNotes",
            Icon: Briefcase,
            section: "orders",
            badge: "pendingDebitNotes",
          },

          // Finance
          ...(canManageApprovals
            ? [
                {
                  to: `${companyPrefix}/finance`,
                  label: "Finance Approval",
                  labelKey: "nav.items.financeApproval",
                  Icon: Briefcase,
                  section: "finance",
                  badge: "financeApprovals",
                },
              ]
            : []),
          {
            to: `${companyPrefix}/payment-history`,
            label: "Payment History",
            labelKey: "nav.items.paymentHistory",
            Icon: History,
            section: "finance",
          },

          // Settings
          {
            to: `${companyPrefix}/company`,
            label: "Company",
            labelKey: "nav.items.company",
            Icon: Building2,
            section: "settings",
            badge: "companyAlerts",
          },
          {
            to: `${companyPrefix}/account`,
            label: "Settings",
            labelKey: "nav.items.settings",
            Icon: Settings,
            section: "settings",
            badge: "accountAlerts",
          },
        ]),
  ];

  return items.filter((item: any) => !isNavItemDisabledInDemo(item.to));
}
