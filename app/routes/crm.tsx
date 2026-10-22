import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { CrmWorkspace } from "../features/crm/CrmWorkspace";

export default function CrmPage() {
  const [company, setCompany] = useState<{ id: string; name?: string } | null>(
    null,
  );
  useEffect(() => {
    try {
      setCompany(JSON.parse(localStorage.getItem("active_company") || "null"));
    } catch {
      setCompany(null);
    }
  }, []);

  return (
    <Layout
      title="CRM Enterprise"
      subtitle="Customer 360, penjualan, layanan, dan automasi lintas divisi."
    >
      {company?.id ? (
        <CrmWorkspace company={company} />
      ) : (
        <div className="p-8 text-sm text-[var(--ui-text-muted)]">
          Pilih perusahaan untuk membuka CRM.
        </div>
      )}
    </Layout>
  );
}
