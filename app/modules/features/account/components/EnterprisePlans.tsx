import { useEffect, useState } from "react";
import {
  getEnterpriseCatalog,
  type EnterpriseCatalog,
} from "../../../lib/api/subscription";
import { EnterprisePlanOptions } from "./EnterprisePlanOptions";
import {
  SubscriptionCheckout,
  type SubscriptionPurchase,
} from "./SubscriptionCheckout";

export function EnterprisePlans({
  companyId,
  canManage,
  onPaid,
  activePlan,
  subscriptionReady,
}: {
  companyId: string;
  canManage: boolean;
  onPaid: () => void;
  activePlan: string | null;
  subscriptionReady: boolean;
}) {
  const [catalog, setCatalog] = useState<EnterpriseCatalog | null>(null);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<SubscriptionPurchase | null>(null);

  useEffect(() => {
    let active = true;
    getEnterpriseCatalog()
      .then((data) => {
        if (active && Array.isArray(data?.plans) && Array.isArray(data?.addons))
          setCatalog(data);
        else if (active) setError(true);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (error)
    return (
      <p className="text-sm text-red-500">
        Paket belum dapat dimuat. Coba muat ulang halaman.
      </p>
    );
  if (!catalog)
    return (
      <p className="text-sm text-[var(--ui-text-muted)]">Memuat paket...</p>
    );

  return (
    <section className="space-y-4">
      <EnterprisePlanOptions
        catalog={catalog}
        canManage={canManage}
        onSelect={setSelected}
        activePlan={activePlan}
        subscriptionReady={subscriptionReady}
      />
      {catalog.checkout_enabled && canManage && (
        <SubscriptionCheckout
          companyId={companyId}
          catalogVersion={catalog.version}
          addons={catalog.addons}
          activePlan={activePlan}
          selected={selected}
          onClose={() => setSelected(null)}
          onPaid={onPaid}
        />
      )}
    </section>
  );
}


