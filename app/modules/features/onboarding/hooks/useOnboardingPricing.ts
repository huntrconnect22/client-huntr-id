import { useEffect, useState } from "react";
import {
  getEnterpriseCatalog,
  type EnterpriseCatalog,
} from "../../../lib/api/subscription";

export function useOnboardingPricing(enabled: boolean) {
  const [catalog, setCatalog] = useState<EnterpriseCatalog | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setCatalog(null);
      setLoading(false);
      setError(false);
      return;
    }
    let active = true;
    setCatalog(null);
    setLoading(true);
    setError(false);
    getEnterpriseCatalog()
      .then((result) => {
        if (
          !result?.version ||
          result.plans?.length !== 3 ||
          result.addons?.length !== 3 ||
          !result.onboarding_business_days
        ) {
          throw new Error("Katalog paket belum tersedia.");
        }
        if (active) setCatalog(result);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [enabled, attempt]);

  return {
    catalog,
    loading,
    error,
    retry: () => setAttempt((value) => value + 1),
  };
}


