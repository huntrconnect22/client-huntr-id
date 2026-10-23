import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { BudgetWorkspace } from "../features/budgeting/BudgetWorkspace";

export default function BudgetingPage() {
  const [company, setCompany] = useState<{ id: string; name?: string } | null>(null);
  useEffect(() => { try { setCompany(JSON.parse(localStorage.getItem("active_company") || "null")); } catch { setCompany(null); } }, []);
  return <Layout title="Budgeting & Procurement Plan" subtitle="Rencanakan belanja, kendalikan komitmen PR/PO, dan pantau realisasi anggaran.">{company?.id ? <BudgetWorkspace company={company}/> : <div className="border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-10 text-center text-sm text-[var(--ui-text-muted)]">Pilih perusahaan aktif terlebih dahulu untuk membuka Budgeting & Procurement Plan.</div>}</Layout>;
}
