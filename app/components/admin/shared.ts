import type React from "react";

/* ─────────────────────────────────────────────────────────────────── */
/*  Shared Types                                                       */
/* ─────────────────────────────────────────────────────────────────── */

export interface AdminUser {
  id: number;
  name: string;
  email: string;
}

export interface CompanyDoc {
  id: string;
  name: string;
  type: string;
  file_path: string;
  url?: string | null;
}

export interface Company {
  id: string;
  name: string;
  type: string;
  status: "pending" | "approved" | "rejected";
  tax_id?: string;
  formatted_tax_id?: string;
  country?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  region?: string;
  bank_name?: string;
  bank_account?: string;
  bank_account_name?: string;
  verification_notes?: string;
  created_at: string;
  documents: CompanyDoc[];
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Shared Style Objects                                               */
/* ─────────────────────────────────────────────────────────────────── */

export const lbl: React.CSSProperties = {
  fontSize: 11,
  color: "var(--ui-text-muted)",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  transition: "color 0.3s ease",
};

export const inp: React.CSSProperties = {
  background: "var(--ui-bg-input)",
  border: "1px solid var(--ui-border-input)",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 14,
  color: "var(--ui-text-primary)",
  outline: "none",
  width: "100%",
  fontFamily: "inherit",
  transition: "border-color 0.2s, background 0.3s ease, color 0.3s ease",
  minHeight: 44,
};

/* Shared table header cell style */
export const thStyle: React.CSSProperties = {
  padding: "11px 16px",
  textAlign: "left",
  fontSize: 11,
  fontWeight: 700,
  color: "var(--ui-text-muted)",
  borderBottom: "1px solid var(--ui-border)",
  background: "var(--ui-bg-inset)",
  whiteSpace: "nowrap",
};

/* Shared table data cell style */
export const tdStyle: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: 13,
  borderBottom: "1px solid var(--ui-border)",
  color: "var(--ui-text-primary)",
  verticalAlign: "middle",
};

/* ─────────────────────────────────────────────────────────────────── */
/*  Helpers                                                            */
/* ─────────────────────────────────────────────────────────────────── */

const BASE_URL_IMAGE =
  typeof import.meta !== "undefined"
    ? import.meta.env?.VITE_BASE_URL_IMAGE ||
      `${import.meta.env?.VITE_API_URL}/storage`
    : "";

export const getImageUrl = (path: string | undefined | null): string => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  if (path.startsWith("/storage")) {
    return `${import.meta.env.VITE_API_URL}${path}`;
  }
  return `${BASE_URL_IMAGE}/${path.replace(/^\//, "")}`;
};

/** Smart ellipsis pagination builder */
export const buildPageList = (
  currentPage: number,
  totalPages: number
): (number | "…")[] => {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  if (currentPage > 3) pages.push("…");
  for (
    let i = Math.max(2, currentPage - 1);
    i <= Math.min(totalPages - 1, currentPage + 1);
    i++
  )
    pages.push(i);
  if (currentPage < totalPages - 2) pages.push("…");
  pages.push(totalPages);
  return pages;
};
