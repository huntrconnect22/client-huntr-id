import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { BudgetWorkspace } from "../features/budgeting/BudgetWorkspace";
import { useLanguage } from "../context/LanguageContext";

export default function BudgetingPage() {
  const { t } = useLanguage();
  const [company, setCompany] = useState<{ id: string; name?: string } | null>(null);

  useEffect(() => {
    try {
      setCompany(JSON.parse(localStorage.getItem("active_company") || "null"));
    } catch {
      setCompany(null);
    }
  }, []);

  return (
    <Layout
      title={t("budgeting.pageTitle")}
      subtitle={t("budgeting.pageSubtitle")}
    >
      {company?.id ? (
        <BudgetWorkspace company={company} />
      ) : (
        <div className="border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-10 text-center text-sm text-[var(--ui-text-muted)]">
          {t("budgeting.selectCompanyWarning")}
        </div>
      )}
    </Layout>
  );
}
