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

export interface NavItemConfig {
  to: string;
  label: string;
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
  const items = [
    ...(isPendingCompany
      ? [
          {
            to: `${companyPrefix}/company`,
            label: "Company",
            Icon: Building2,
            section: "settings",
            badge: "companyAlerts",
          },
          {
            to: `${companyPrefix}/account`,
            label: "Settings",
            Icon: Settings,
            section: "settings",
            badge: "accountAlerts",
          },
        ]
      : [
          {
            to: `${companyPrefix || "/"}`,
            label: "Dashboard",
            Icon: LayoutDashboard,
            section: "main",
            exact: true,
          },
          {
            to: `${companyPrefix}/tasks`,
            label: "Tasks",
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
                        Icon: Sparkles,
                        section: "procurement",
                        isAi: true,
                      },
                    ]
                  : []),
                {
                  to: `${companyPrefix}/marketplace`,
                  label: "Huntr Catalog",
                  Icon: Package,
                  section: "procurement",
                },
                {
                  to: `${companyPrefix}/my-pr`,
                  label: "My PR",
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
                  Icon: List,
                  section: "vendor",
                  badge: "catalogueAlerts",
                },
                {
                  to: `${companyPrefix}/proposals`,
                  label: "Proposals",
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
            Icon: MessageSquare,
            section: "orders",
            badge: "negotiations",
          },
          ...(isVendorComp
            ? [
                {
                  to: `${companyPrefix}/orders`,
                  label: "Purchase Order",
                  Icon: ReceiptText,
                  section: "orders",
                  badge: "pendingPurchaseOrders",
                },
              ]
            : [
                {
                  to: `${companyPrefix}/orders`,
                  label: "Purchase Order",
                  Icon: ReceiptText,
                  section: "orders",
                  badge: "buyerOrderAlerts",
                },
              ]),
          {
            to: `${companyPrefix}/receipts`,
            label: "Goods Receipt",
            Icon: CheckCircle2,
            section: "orders",
            badge: "receiptsToInspect",
          },
          {
            to: `${companyPrefix}/bast`,
            label: "BAST",
            Icon: FileText,
            section: "orders",
            badge: "pendingBast",
          },
          {
            to: `${companyPrefix}/efaktur`,
            label: "e-Faktur",
            Icon: ReceiptText,
            section: "orders",
          },
          {
            to: `${companyPrefix}/returns`,
            label: "Returns",
            Icon: Package,
            section: "orders",
            badge: "pendingReturns",
          },
          {
            to: `${companyPrefix}/debit-notes`,
            label: "Debit Notes",
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
                  Icon: Briefcase,
                  section: "finance",
                  badge: "financeApprovals",
                },
              ]
            : []),
          {
            to: `${companyPrefix}/payment-history`,
            label: "Payment History",
            Icon: History,
            section: "finance",
          },

          // Settings
          {
            to: `${companyPrefix}/company`,
            label: "Company",
            Icon: Building2,
            section: "settings",
            badge: "companyAlerts",
          },
          {
            to: `${companyPrefix}/account`,
            label: "Settings",
            Icon: Settings,
            section: "settings",
            badge: "accountAlerts",
          },
        ]),
  ];

  return items.filter((item: any) => !isNavItemDisabledInDemo(item.to));
}
