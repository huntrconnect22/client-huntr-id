export interface CartItem {
  id: string;
  manual?: boolean;
  name: string;
  item_code?: string;
  category?: string;
  brand?: string;
  uom?: string;
  image_url?: string | null;
  image_path?: string | null;
  qty: number;
  estimated_price: number;
  line_type?: "goods" | "service";
  service_scope?: string;
  acceptance_criteria?: string;
  service_start_date?: string;
  service_end_date?: string;
  expected_date?: string;
}

export interface CompanyAddress {
  id: string;
  label: string;
  value: string;
}

export type ProcurementMode = "tender" | "direct";
export type ProcurementType = "goods" | "services" | "mixed";

export interface DurationCalculation {
  days?: number;
  months?: string;
  text?: string;
  error?: string;
}

import type { LucideIcon } from "lucide-react";

export interface ServiceProjectType {
  id: string;
  label: string;
  desc: string;
  icon: LucideIcon;
}


