import {
  HardHat,
  Monitor,
  Tractor,
  PartyPopper,
  Wrench,
  Truck,
  Scale,
  Tag,
} from "lucide-react";
import type { ServiceProjectType } from "./types";

export const SERVICE_PROJECT_TYPES: ServiceProjectType[] = [
  {
    id: "Konstruksi & Sipil",
    label: "Konstruksi & Sipil",
    desc: "Renovasi, sipil, arsitektur, MEP gedung, perbaikan fisik",
    icon: HardHat,
  },
  {
    id: "Teknologi Informasi (IT)",
    label: "Teknologi Informasi (IT)",
    desc: "Software development, maintenance server, network, cyber security",
    icon: Monitor,
  },
  {
    id: "Sewa & Operasional Alat Berat",
    label: "Alat Berat & Mesin",
    desc: "Rental excavator, crane, forklift, bulldozer & operator",
    icon: Tractor,
  },
  {
    id: "Event Organizer & MICE",
    label: "Event & Production",
    desc: "Pameran, corporate event, panggung, audio visual, booth",
    icon: PartyPopper,
  },
  {
    id: "Maintenance & Fasilitas",
    label: "Maintenance & GA",
    desc: "Cleaning service, HVAC/AC, security, pest control, landscape",
    icon: Wrench,
  },
  {
    id: "Logistik & Transportasi",
    label: "Logistik & Transport",
    desc: "Pengiriman muatan proyek, ekspedisi kargo, sewa armada",
    icon: Truck,
  },
  {
    id: "Konsultasi & Jasa Profesional",
    label: "Konsultasi & Audit",
    desc: "Legal, advisory, accounting, ISO, konsultan teknik",
    icon: Scale,
  },
  {
    id: "Lainnya",
    label: "Lainnya (Custom)",
    desc: "Tentukan jenis proyek atau layanan spesifik lainnya",
    icon: Tag,
  },
];

export const DEPARTMENT_OPTIONS = [
  "General Procurement",
  "Information Technology",
  "Operations & Logistics",
  "General Affairs (GA)",
  "Finance & Accounting",
  "Human Resources (HR)",
  "Marketing & Sales",
  "Engineering & Maintenance",
];

export const TENDER_DURATION_OPTIONS = [
  { value: 3, label: "3 Days" },
  { value: 7, label: "7 Days" },
  { value: 14, label: "14 Days" },
  { value: 30, label: "30 Days" },
];


