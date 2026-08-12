export type DemoDisabledModule =
  | "finance"
  | "efaktur"
  | "debit-notes"
  | "returns"
  | "bast";

export const DEMO_DISABLED_MODULES: DemoDisabledModule[] = [
  "finance",
  "efaktur",
  "debit-notes",
  "returns",
  "bast",
];

export const DEMO_MODULE_LABELS: Record<DemoDisabledModule, string> = {
  finance: "Finance Approval",
  efaktur: "e-Faktur",
  "debit-notes": "Debit Notes",
  returns: "Returns",
  bast: "BAST",
};

export function isDemoMode(): boolean {
  const raw = import.meta.env.VITE_DEMO_MODE;
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "string") {
    const s = raw.trim().toLowerCase();
    return s === "true" || s === "1" || s === "yes" || s === "on";
  }
  return false;
}

export function getDemoDisabledModules(): DemoDisabledModule[] {
  if (!isDemoMode()) return [];
  return [...DEMO_DISABLED_MODULES];
}

export function isModuleDisabledInDemo(
  module: DemoDisabledModule | string,
): boolean {
  if (!isDemoMode()) return false;
  return (DEMO_DISABLED_MODULES as string[]).includes(module);
}

export function isNavItemDisabledInDemo(to: string): boolean {
  if (!isDemoMode()) return false;
  const segments = to.split("/").filter(Boolean);
  const last = segments[segments.length - 1] ?? "";
  return (DEMO_DISABLED_MODULES as string[]).includes(last);
}

export function demoModuleBannerTitle(module: DemoDisabledModule): string {
  const label = DEMO_MODULE_LABELS[module] ?? "Fitur";
  return `${label} tidak tersedia dalam Mode Demo`;
}

export function demoModuleBannerMessage(module: DemoDisabledModule): string {
  const label = DEMO_MODULE_LABELS[module] ?? "Fitur ini";
  return `${label} telah dinonaktifkan sementara untuk keperluan demo. Silakan hubungi administrator jika Anda memerlukan akses ke fitur ini.`;
}
