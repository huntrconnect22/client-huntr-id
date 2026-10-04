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
} from "lucide-react";
import { isNavItemDisabledInDemo } from "../../lib/demo-mode";
import type { TranslationKey } from "../../context/LanguageContext";

export interface NavItemConfig {
  to: string;
  label: string;
  labelKey?: TranslationKey;
  Icon: any;
  section: string;
  badge?: string;
  exact?: boolean;
  isAi?: boolean;
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
                  labelKey: "nav.items.huntrCatalog",
                  Icon: Package,
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

          // Orders & Documents
          {
            to: `${companyPrefix}/negotiation`,
            label: "Negotiations",
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
                  labelKey: "nav.items.purchaseOrder",
                  Icon: ReceiptText,
                  section: "orders",
                  badge: "buyerOrderAlerts",
                },
              ]),
          {
            to: `${companyPrefix}/receipts`,
            label: "Goods Receipt",
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
            labelKey: "nav.items.returns",
            Icon: Package,
            section: "orders",
            badge: "pendingReturns",
          },
          {
            to: `${companyPrefix}/debit-notes`,
            label: "Debit Notes",
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
