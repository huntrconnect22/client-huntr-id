import { useState } from "react";
import { SubscriptionMonitor } from "./enterprise/SubscriptionMonitor";
import { PricingSettings } from "./enterprise/PricingSettings";

export default function AdminSubscriptionTab() {
  const [section, setSection] = useState<"monitor" | "pricing">("monitor");
  return (
    <div className="space-y-5">
      <div>
        <h1 className="m-0 text-2xl font-bold text-[var(--ui-text-primary)]">
          Subscription & pembayaran
        </h1>
        <p className="mb-0 mt-1 text-sm text-[var(--ui-text-muted)]">
          Pantau tagihan Midtrans dan kelola skema Enterprise.
        </p>
      </div>
      <nav
        className="flex gap-5 border-b border-[var(--ui-border)]"
        aria-label="Menu subscription"
      >
        {[
          ["monitor", "Monitoring"],
          ["pricing", "Konfigurasi paket"],
        ].map(([key, title]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSection(key as "monitor" | "pricing")}
            className={`border-b-2 px-1 pb-3 text-sm font-semibold ${section === key ? "border-orange-500 text-orange-500" : "border-transparent text-[var(--ui-text-muted)]"}`}
          >
            {title}
          </button>
        ))}
      </nav>
      {section === "monitor" ? <SubscriptionMonitor /> : <PricingSettings />}
    </div>
  );
}
