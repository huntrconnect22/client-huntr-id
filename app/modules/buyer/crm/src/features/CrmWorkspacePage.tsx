import Layout from "~/components/Layout";
import { CrmWorkspace } from "~/features/crm/CrmWorkspace";
import { useActiveCompany } from "~/shared/hooks/useActiveCompany";

export default function CrmPage() {
  const company = useActiveCompany();

  return (
    <Layout
      title="CRM Enterprise"
      subtitle="Customer 360, penjualan, layanan, dan automasi lintas divisi."
    >
      {company?.id ? (
        <CrmWorkspace company={company} />
      ) : (
        <div className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-12 text-center text-sm text-[var(--ui-text-muted)]">
          Pilih perusahaan aktif terlebih dahulu untuk membuka CRM Enterprise.
        </div>
      )}
    </Layout>
  );
}
