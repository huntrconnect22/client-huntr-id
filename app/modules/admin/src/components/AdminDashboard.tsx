import { useState, type ComponentType } from "react";
import {
  Building2,
  ShieldCheck,
  LogOut,
  Users,
  X,
  Menu,
  CreditCard,
  Package,
  LayoutDashboard,
  ReceiptText,
} from "lucide-react";
import ThemeToggle from "../ThemeToggle";
import AdminCompaniesTab from "./AdminCompaniesTab";
import AdminCatalogueTab from "./AdminCatalogueTab";
import AdminTransactionsTab from "./AdminTransactionsTab";
import AdminUsersTab from "./AdminUsersTab";
import AdminAdminsTab from "./AdminAdminsTab";
import AdminSubscriptionTab from "./AdminSubscriptionTab";
import AdminOverview from "./AdminOverview";
import type { AdminUser } from "./shared";

export type TabId =
  | "overview"
  | "companies"
  | "catalogue"
  | "transactions"
  | "subscription"
  | "users"
  | "admins";
const tabs: {
  id: TabId;
  label: string;
  icon: ComponentType<{ size?: number }>;
}[] = [
  { id: "overview", label: "Ringkasan", icon: LayoutDashboard },
  { id: "subscription", label: "Subscription", icon: CreditCard },
  { id: "transactions", label: "Transaksi PO", icon: ReceiptText },
  { id: "companies", label: "Perusahaan", icon: Building2 },
  { id: "catalogue", label: "Katalog", icon: Package },
  { id: "users", label: "Pengguna", icon: Users },
  { id: "admins", label: "Admin", icon: ShieldCheck },
];

export default function AdminDashboard({
  admin,
  activeTab,
  onTabChange,
  onLogout,
}: {
  admin: AdminUser;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const navigation = (
    <nav className="space-y-1" aria-label="Navigasi admin">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => {
            onTabChange(id);
            setOpen(false);
          }}
          aria-current={activeTab === id ? "page" : undefined}
          className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium ${activeTab === id ? "bg-orange-500/10 text-orange-500" : "text-[var(--ui-text-secondary)] hover:bg-[var(--ui-bg-input)]"}`}
        >
          <Icon size={17} />
          {label}
        </button>
      ))}
    </nav>
  );
  return (
    <div className="min-h-screen bg-[var(--ui-bg-page)] text-[var(--ui-text-primary)] lg:flex">
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-4 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="mb-7 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/assets/img/logo/sidebar.png"
              alt="Huntr"
              className="h-7 w-auto"
            />
            <div>
              <div className="text-sm font-bold">Admin Portal</div>
              <div className="text-xs text-[var(--ui-text-muted)]">
                Operasional platform
              </div>
            </div>
          </div>
          <button
            className="lg:hidden"
            aria-label="Tutup menu"
            onClick={() => setOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
        {navigation}
        <div className="mt-auto border-t border-[var(--ui-border)] pt-4">
          <div className="truncate text-sm font-semibold">{admin.name}</div>
          <div className="truncate text-xs text-[var(--ui-text-muted)]">
            {admin.email}
          </div>
          <button
            onClick={onLogout}
            className="mt-3 flex items-center gap-2 text-xs font-semibold text-[var(--ui-text-secondary)]"
          >
            <LogOut size={15} />
            Keluar
          </button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--ui-border)] bg-[var(--ui-bg-header)] px-4 lg:px-7">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden"
              aria-label="Buka menu"
              onClick={() => setOpen(true)}
            >
              <Menu size={20} />
            </button>
            <span className="text-sm font-semibold">
              {tabs.find((tab) => tab.id === activeTab)?.label}
            </span>
          </div>
          <ThemeToggle />
        </header>
        <main className="mx-auto w-full max-w-[1440px] p-4 sm:p-6 lg:p-7">
          {activeTab === "overview" && (
            <AdminOverview onNavigate={onTabChange} />
          )}
          {activeTab === "subscription" && <AdminSubscriptionTab />}
          {activeTab === "companies" && <AdminCompaniesTab />}
          {activeTab === "catalogue" && <AdminCatalogueTab />}
          {activeTab === "transactions" && <AdminTransactionsTab />}
          {activeTab === "users" && <AdminUsersTab />}
          {activeTab === "admins" && <AdminAdminsTab />}
        </main>
      </div>
    </div>
  );
}
