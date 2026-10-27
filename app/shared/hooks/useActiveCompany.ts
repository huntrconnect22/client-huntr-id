import { useEffect, useState } from "react";

export type ActiveCompany = {
  id: string;
  name?: string;
  slug?: string;
  [key: string]: unknown;
};

/**
 * Hydrates the current tenant once on the client. Domain modules should use
 * this instead of each parsing localStorage and inventing subtly different
 * invalid-session behaviour.
 */
export function useActiveCompany<T extends ActiveCompany = ActiveCompany>() {
  const [company, setCompany] = useState<T | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("active_company");
      setCompany(stored ? (JSON.parse(stored) as T) : null);
    } catch {
      setCompany(null);
    }
  }, []);

  return company;
}
