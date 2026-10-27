import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  // ── SEO / Search Engine feeds ──────────────────────────────────────────────
  route("robots.txt", "modules/public/seo/routes/RobotsRoute.tsx"),
  route("sitemap.xml", "modules/public/seo/routes/SitemapRoute.tsx"),
  route("sitemap.xsl", "modules/public/seo/routes/SitemapStyleRoute.tsx"),

  // ── Public / standalone routes (no persistent shell) ──────────────────────
  route("login", "modules/auth/routes/LoginRoute.tsx"),
  route("register", "modules/auth/routes/RegisterRoute.tsx"),
  route("forgot-password", "modules/auth/routes/ForgotPasswordRoute.tsx"),
  route("onboarding", "modules/auth/routes/OnboardingRoute.tsx"),
  route("select-company", "modules/auth/routes/SelectCompanyRoute.tsx"),
  route("admin", "modules/admin/routes/AdminRoute.tsx"),
  route("admin/:tab", "modules/admin/routes/AdminRoute.tsx", { id: "admin-tab" }),
  route("invite/accept", "modules/auth/routes/InviteAcceptanceRoute.tsx"),
  route("track", "modules/public/tracking/routes/TrackingRoute.tsx"),
  route("verify", "modules/public/verification/routes/VerificationRoute.tsx"),
  route("tender/:id", "modules/public/tender/routes/PublicTenderRoute.tsx"),
  route("t/:id", "modules/public/tender/routes/PublicTenderRoute.tsx", { id: "tender-short" }),
  route("crowd-buy", "modules/marketplace/crowd-buy/routes/PublicCampaignIndexRoute.tsx", { id: "crowd-buy-index-public" }),
  route("crowd-buy/p/:id", "modules/marketplace/crowd-buy/routes/PublicCampaignRoute.tsx", {
    id: "crowd-buy-public",
  }),
  route("cb/:id", "modules/marketplace/crowd-buy/routes/PublicCampaignRoute.tsx", { id: "crowd-buy-short" }),

  // ── Authenticated routes (inside persistent AppShell) ─────────────────────
  layout("modules/shell/src/features/AppShell.tsx", [
    index("modules/buyer/dashboard/routes/HomeRoute.tsx"),

    // Dynamic company slug prefixed routes (e.g. /micro-padma-nusantara, /micro-padma-nusantara/dashboard)
    route(":companySlug", "modules/buyer/dashboard/routes/HomeRoute.tsx", { id: "company-home" }),
    route(":companySlug/dashboard", "modules/buyer/dashboard/routes/HomeRoute.tsx", {
      id: "company-dashboard",
    }),
    route(":companySlug/crowd-buy", "modules/marketplace/crowd-buy/routes/CrowdBuyRoute.tsx", {
      id: "company-crowd-buy",
    }),
    route(":companySlug/crowd-buy/:id", "modules/marketplace/crowd-buy/routes/CrowdBuyDetailRoute.tsx", {
      id: "company-crowd-buy-detail",
    }),
    route(
      ":companySlug/agentic-procurement",
      "modules/buyer/agentic-procurement/routes/AgenticProcurementRoute.tsx",
      { id: "company-agentic-procurement" },
    ),
    route(":companySlug/marketplace", "modules/marketplace/catalogue/routes/MarketplaceRoute.tsx", {
      id: "company-marketplace",
    }),
    route(":companySlug/apps", "modules/app-market/routes/AppMarketRoute.tsx", {
      id: "company-app-market",
    }),
    route(":companySlug/wms", "modules/buyer/wms/routes/WmsRoute.tsx", { id: "company-wms" }),
    route(":companySlug/crm", "modules/buyer/crm/routes/CrmRoute.tsx", { id: "company-crm" }),
    route(":companySlug/budgeting", "modules/buyer/budgeting/routes/BudgetingRoute.tsx", { id: "company-budgeting" }),
    route(":companySlug/marketplace/:id", "modules/marketplace/catalogue/routes/MarketplaceProductDetailRoute.tsx", {
      id: "company-marketplace-detail",
    }),
    route(":companySlug/cart", "modules/marketplace/checkout/routes/CartRoute.tsx", { id: "company-cart" }),
    // Cart page removed — cart is now inline sidebar on marketplace
    route(":companySlug/my-pr", "modules/buyer/PR/routes/PurchaseRequestListRoute.tsx", { id: "company-my-pr" }),
    route(":companySlug/my-pr/:id", "modules/buyer/PR/routes/PurchaseRequestDetailRoute.tsx", {
      id: "company-my-pr-detail",
    }),
    route(":companySlug/compare-review/:id", "modules/buyer/PR/routes/CompareReviewRoute.tsx", {
      id: "company-compare-review",
    }),
    route(":companySlug/all-requests", "modules/vendor/requests/routes/AllRequestsRoute.tsx", {
      id: "company-all-requests",
    }),
    route(":companySlug/rfq/:id", "modules/buyer/PR/routes/RfqDetailRoute.tsx", {
      id: "company-rfq-detail",
    }),
    route(":companySlug/checkout", "modules/marketplace/checkout/routes/CheckoutRoute.tsx", {
      id: "company-checkout",
    }),
    route(":companySlug/approvals", "modules/buyer/approvals/routes/ApprovalsRoute.tsx", {
      id: "company-approvals",
    }),
    route(":companySlug/finance", "modules/finance/payables/routes/FinanceRoute.tsx", {
      id: "company-finance",
    }),
    route(":companySlug/company", "modules/buyer/company/routes/CompanyRoute.tsx", {
      id: "company-company",
    }),
    route(":companySlug/catalogue", "modules/vendor/catalogue/routes/CatalogueRoute.tsx", {
      id: "company-catalogue",
    }),
    route(":companySlug/rfq", "modules/buyer/PR/routes/RfqRoute.tsx", { id: "company-rfq" }),
    route(":companySlug/proposals", "modules/vendor/proposals/routes/ProposalsRoute.tsx", {
      id: "company-proposals",
    }),
    route(":companySlug/negotiation", "modules/buyer/negotiations/routes/NegotiationRoute.tsx", {
      id: "company-negotiation",
    }),
    route(":companySlug/my-rank", "modules/vendor/proposals/routes/MyRankRoute.tsx", {
      id: "company-my-rank",
    }),
    route(":companySlug/orders", "modules/buyer/PO/routes/OrdersRoute.tsx", { id: "company-orders" }),
    route(":companySlug/direct-po", "modules/buyer/PO/routes/DirectPurchaseOrderRoute.tsx", {
      id: "company-direct-po",
    }),
    route(":companySlug/receipts", "modules/buyer/PO/routes/GoodsReceiptsRoute.tsx", {
      id: "company-receipts",
    }),
    route(":companySlug/payment-history", "modules/finance/payables/routes/PaymentHistoryRoute.tsx", {
      id: "company-payment-history",
    }),
    route(":companySlug/returns", "modules/finance/payables/routes/ReturnsRoute.tsx", {
      id: "company-returns",
    }),
    route(":companySlug/debit-notes", "modules/finance/payables/routes/DebitNotesRoute.tsx", {
      id: "company-debit-notes",
    }),
    route(":companySlug/bast", "modules/finance/payables/routes/BastRoute.tsx", { id: "company-bast" }),
    route(":companySlug/efaktur", "modules/finance/efaktur/routes/EFakturRoute.tsx", {
      id: "company-efaktur",
    }),
    route(":companySlug/notifications", "modules/shell/routes/NotificationsRoute.tsx", {
      id: "company-notifications",
    }),
    route(":companySlug/account", "modules/buyer/settings/routes/AccountRoute.tsx", {
      id: "company-account",
    }),
    route(":companySlug/pr-audit", "modules/buyer/PR/routes/PurchaseRequestAuditRoute.tsx", {
      id: "company-pr-audit",
    }),
    route(":companySlug/tasks", "modules/shell/routes/TasksRoute.tsx", { id: "company-tasks" }),

    // Fallback legacy paths
    route("agentic-procurement", "modules/buyer/agentic-procurement/routes/AgenticProcurementRoute.tsx"),
    route("marketplace", "modules/marketplace/catalogue/routes/MarketplaceRoute.tsx"),
    route("apps", "modules/app-market/routes/AppMarketRoute.tsx"),
    route("wms", "modules/buyer/wms/routes/WmsRoute.tsx"),
    route("budgeting", "modules/buyer/budgeting/routes/BudgetingRoute.tsx"),
    route("marketplace/:id", "modules/marketplace/catalogue/routes/MarketplaceProductDetailRoute.tsx"),
    route("cart", "modules/marketplace/checkout/routes/CartRoute.tsx"),
    route("my-pr", "modules/buyer/PR/routes/PurchaseRequestListRoute.tsx"),
    route("my-pr/:id", "modules/buyer/PR/routes/PurchaseRequestDetailRoute.tsx"),
    route("compare-review/:id", "modules/buyer/PR/routes/CompareReviewRoute.tsx"),
    route("all-requests", "modules/vendor/requests/routes/AllRequestsRoute.tsx"),
    route("rfq/:id", "modules/buyer/PR/routes/RfqDetailRoute.tsx"),
    route("checkout", "modules/marketplace/checkout/routes/CheckoutRoute.tsx"),
    route("approvals", "modules/buyer/approvals/routes/ApprovalsRoute.tsx"),
    route("finance", "modules/finance/payables/routes/FinanceRoute.tsx"),
    route("company", "modules/buyer/company/routes/CompanyRoute.tsx"),
    route("catalogue", "modules/vendor/catalogue/routes/CatalogueRoute.tsx"),
    route("rfq", "modules/buyer/PR/routes/RfqRoute.tsx"),
    route("proposals", "modules/vendor/proposals/routes/ProposalsRoute.tsx"),
    route("negotiation", "modules/buyer/negotiations/routes/NegotiationRoute.tsx"),
    route("my-rank", "modules/vendor/proposals/routes/MyRankRoute.tsx"),
    route("orders", "modules/buyer/PO/routes/OrdersRoute.tsx"),
    route("direct-po", "modules/buyer/PO/routes/DirectPurchaseOrderRoute.tsx"),
    route("receipts", "modules/buyer/PO/routes/GoodsReceiptsRoute.tsx"),
    route("payment-history", "modules/finance/payables/routes/PaymentHistoryRoute.tsx"),
    route("returns", "modules/finance/payables/routes/ReturnsRoute.tsx"),
    route("debit-notes", "modules/finance/payables/routes/DebitNotesRoute.tsx"),
    route("bast", "modules/finance/payables/routes/BastRoute.tsx"),
    route("efaktur", "modules/finance/efaktur/routes/EFakturRoute.tsx"),
    route("notifications", "modules/shell/routes/NotificationsRoute.tsx"),
    route("account", "modules/buyer/settings/routes/AccountRoute.tsx"),
    route("pr-audit", "modules/buyer/PR/routes/PurchaseRequestAuditRoute.tsx"),
    route("tasks", "modules/shell/routes/TasksRoute.tsx"),

    // Catch-all
    route("*", "modules/public/system/routes/NotFoundRoute.tsx"),
  ]),
] satisfies RouteConfig;
