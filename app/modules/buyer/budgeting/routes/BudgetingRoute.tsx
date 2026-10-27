import Layout from "~/components/Layout";
import { BudgetWorkspace } from "~/features/budgeting/BudgetWorkspace";
import { useLanguage } from "~/context/LanguageContext";
import { useActiveCompany } from "~/shared/hooks/useActiveCompany";

export default function BudgetingPage() {
  const { t } = useLanguage();
  const company = useActiveCompany();

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
