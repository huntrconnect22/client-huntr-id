import { Button as HuntrButton } from "~/shared/ui/Button";
import { Table as HuntrTable, TableHead as HuntrTableHead, TableRow as HuntrTableRow, TableHeaderCell as HuntrTableHeaderCell, TableBody as HuntrTableBody, TableCell as HuntrTableCell } from "~/shared/ui/Table";
import { Input as HuntrInput } from "~/shared/ui/Fields";
import React, { useEffect, useState } from "react";
// Public, unauthenticated tender experience.
import { useParams, Link, useNavigate } from "react-router";
import { useTheme } from "~/context/ThemeContext";
import {
  Package,
  Building2,
  Calendar,
  Clock,
  Tag,
  FileText,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Share2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Users,
  TrendingUp,
  LogIn,
  UserPlus,
  Sun,
  Moon,
} from "lucide-react";

const BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

async function fetchPublicRfq(id: string) {
  const res = await fetch(`${BASE_URL}/api/rfqs/public/${id}`);
  if (!res.ok) throw new Error("Not found");
  return res.json();
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: "Open for Bids", cls: "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border-emerald-500/30" },
    open: { label: "Open for Bids", cls: "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border-emerald-500/30" },
    pending_approval: { label: "Pending Approval", cls: "bg-amber-500/15 text-amber-500 dark:text-amber-400 border-amber-500/30" },
    awarded: { label: "Awarded", cls: "bg-blue-500/15 text-blue-500 dark:text-blue-400 border-blue-500/30" },
    closed: { label: "Closed", cls: "bg-gray-500/15 text-gray-500 dark:text-gray-400 border-gray-500/30" },
  };
  const s = map[status] ?? { label: status, cls: "bg-gray-500/15 text-gray-500 dark:text-gray-400 border-gray-500/30" };
  return (
    <span className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-md border ${s.cls}`}>
      {s.label}
    </span>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 p-3 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)]">
      <div className="text-orange-500">{icon}</div>
      <div>
        <div className="text-[10px] text-[var(--ui-text-muted)] uppercase font-semibold">{label}</div>
        <div className="text-sm font-bold text-[var(--ui-text-primary)]">{value}</div>
      </div>
    </div>
  );
}

export default function TenderPublicPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [rfq, setRfq] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchPublicRfq(id)
      .then((data) => {
        setRfq(data?.rfq ?? data);
        setLoading(false);
      })
      .catch(() => {
        setError("Tender tidak ditemukan atau tidak dapat diakses.");
        setLoading(false);
      });
  }, [id]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTenderStatus = () => {
    if (!rfq) return { label: "Unknown", isOpen: false, daysLeft: 0 };
    const duration = rfq.duration_days ?? 7;
    if (rfq.status === "active" && rfq.approved_at) {
      const endsAt = new Date(rfq.approved_at);
      endsAt.setDate(endsAt.getDate() + duration);
      const diffMs = endsAt.getTime() - Date.now();
      if (diffMs <= 0) return { label: "Tender Closed", isOpen: false, daysLeft: 0 };
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return { label: `${daysLeft} hari tersisa`, isOpen: true, daysLeft };
    }
    return { label: `${duration} hari setelah disetujui`, isOpen: false, daysLeft: 0 };
  };

  const tenderStatus = getTenderStatus();

  // ── Loading State ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--ui-bg-page)] text-[var(--ui-text-primary)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-orange-500" />
          <p className="text-sm text-[var(--ui-text-muted)]">Memuat tender...</p>
        </div>
      </div>
    );
  }

  // ── Error State ─────────────────────────────────────────────────────────────
  if (error || !rfq) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--ui-bg-page)] text-[var(--ui-text-primary)] px-4">
        <div className="text-center max-w-sm">
          <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[var(--ui-text-primary)] mb-1">Tender Tidak Ditemukan</h2>
          <p className="text-sm text-[var(--ui-text-muted)] mb-6">{error ?? "Link tender mungkin sudah kedaluwarsa atau tidak valid."}</p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-all"
          >
            <UserPlus size={15} />
            Daftar Sebagai Vendor
          </Link>
        </div>
      </div>
    );
  }

  const totalItems = rfq.items?.reduce((s: number, i: any) => s + (i.qty || 0), 0) ?? 0;
  const lineItems = rfq.items?.length ?? 0;
  const prShort = String(rfq.id ?? "").substring(0, 8).toUpperCase();

  return (
    <div className="min-h-screen bg-[var(--ui-bg-page)] text-[var(--ui-text-primary)] transition-colors">
      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-[var(--ui-border)] bg-[var(--ui-bg-page)]/90 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img
              src="/assets/img/logo/sidebar.png"
              alt="Huntr Logo"
              className="h-8 w-auto object-contain"
            />
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <HuntrButton
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] text-[var(--ui-text-secondary)] hover:text-orange-500 hover:border-orange-500/40 transition-all cursor-pointer"
              aria-label="Ganti mode tampilan"
              title={isDark ? "Ganti ke Mode Terang (Light)" : "Ganti ke Mode Gelap (Dark)"}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </HuntrButton>
            <HuntrButton
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] text-xs font-semibold text-[var(--ui-text-primary)] hover:border-orange-400/50 transition-all cursor-pointer"
            >
              {copied ? (
                <><Check size={13} className="text-emerald-500" /><span className="text-emerald-500 font-bold">Tersalin!</span></>
              ) : (
                <><Copy size={13} /><span>Salin Link</span></>
              )}
            </HuntrButton>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] text-xs font-semibold text-[var(--ui-text-primary)] hover:border-orange-400/50 transition-all"
            >
              <LogIn size={13} />
              <span>Masuk</span>
            </Link>
            <Link
              to={`/register?tender=${id}`}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-xs font-bold text-white shadow-sm transition-all"
            >
              <UserPlus size={13} />
              <span>Daftar & Bid</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Header Card */}
        <div className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-5 flex flex-col gap-4 shadow-sm">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono text-orange-500 font-bold">RFQ #{prShort}</span>
                <StatusBadge status={rfq.status} />
                {tenderStatus.isOpen && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Clock size={10} /> {tenderStatus.label}
                  </span>
                )}
              </div>
              <h1 className="text-xl md:text-2xl font-black text-[var(--ui-text-primary)] leading-tight">
                {rfq.title}
              </h1>
              {rfq.company?.name && (
                <div className="flex items-center gap-1.5 text-sm text-[var(--ui-text-muted)]">
                  <Building2 size={13} />
                  <span>{rfq.company.name}</span>
                  {rfq.company?.status === "approved" && (
                    <ShieldCheck size={12} className="text-blue-500" />
                  )}
                </div>
              )}
            </div>

            {/* Share & CTA */}
            <div className="flex items-center gap-2">
              <HuntrButton
                onClick={handleCopy}
                className="p-2 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] text-[var(--ui-text-muted)] hover:text-[var(--ui-text-primary)] hover:border-orange-400/50 transition-all cursor-pointer"
                title="Salin link tender"
              >
                <Share2 size={15} />
              </HuntrButton>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatCard icon={<Package size={14} />} label="Line Items" value={`${lineItems} item`} />
            <StatCard icon={<Tag size={14} />} label="Total Qty" value={`${totalItems} unit`} />
            <StatCard icon={<Users size={14} />} label="Penawaran" value={`${rfq.proposals_count ?? 0} vendor`} />
            <StatCard icon={<Calendar size={14} />} label="Durasi Tender" value={`${rfq.duration_days ?? 7} hari`} />
          </div>
        </div>

        {/* Layout: Main + Sidebar */}
        <div className="grid md:grid-cols-[1fr_280px] gap-5 items-start">
          {/* Left: Description + Items */}
          <div className="flex flex-col gap-4">
            {/* Description */}
            {rfq.description && (
              <div className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-5 flex flex-col gap-2 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">
                  <FileText size={13} />
                  Deskripsi Kebutuhan
                </div>
                <p className="text-sm text-[var(--ui-text-secondary)] leading-relaxed whitespace-pre-wrap">
                  {rfq.description}
                </p>
              </div>
            )}

            {/* Items Table */}
            {rfq.items?.length > 0 && (
              <div className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-5 flex flex-col gap-3 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">
                  <Package size={13} />
                  Rincian Item ({lineItems})
                </div>
                <div className="overflow-x-auto rounded-lg border border-[var(--ui-border)]">
                  <HuntrTable className="w-full text-xs text-left">
                    <HuntrTableHead>
                      <HuntrTableRow className="border-b border-[var(--ui-border)] bg-[var(--ui-bg-input)] text-[var(--ui-text-muted)] font-semibold">
                        <HuntrTableHeaderCell className="px-3 py-2.5">#</HuntrTableHeaderCell>
                        <HuntrTableHeaderCell className="px-3 py-2.5">Nama Item</HuntrTableHeaderCell>
                        <HuntrTableHeaderCell className="px-3 py-2.5 text-center">Qty</HuntrTableHeaderCell>
                        <HuntrTableHeaderCell className="px-3 py-2.5">Satuan</HuntrTableHeaderCell>
                        <HuntrTableHeaderCell className="px-3 py-2.5">Spesifikasi</HuntrTableHeaderCell>
                      </HuntrTableRow>
                    </HuntrTableHead>
                    <HuntrTableBody className="divide-y divide-[var(--ui-border)]">
                      {rfq.items.map((item: any, idx: number) => (
                        <HuntrTableRow key={item.id ?? idx} className="hover:bg-[var(--ui-bg-input)] transition-colors">
                          <HuntrTableCell className="px-3 py-2.5 text-[var(--ui-text-muted)]">{idx + 1}</HuntrTableCell>
                          <HuntrTableCell className="px-3 py-2.5">
                            <div className="font-semibold text-[var(--ui-text-primary)]">
                              {item.catalogue?.name || item.item_name || item.name || "Item"}
                            </div>
                            {item.catalogue?.brand ? (
                              <div className="text-[10px] text-[var(--ui-text-muted)]">{item.catalogue.brand}</div>
                            ) : item.sku ? (
                              <div className="text-[10px] text-[var(--ui-text-muted)] font-mono">SKU: {item.sku}</div>
                            ) : item.line_type === "service" ? (
                              <div className="text-[10px] text-orange-500 font-medium">Jasa / Layanan</div>
                            ) : null}
                          </HuntrTableCell>
                          <HuntrTableCell className="px-3 py-2.5 text-center font-mono font-bold text-orange-500">
                            {item.qty}
                          </HuntrTableCell>
                          <HuntrTableCell className="px-3 py-2.5 text-[var(--ui-text-secondary)]">
                            {item.uom ?? item.catalogue?.uom ?? "unit"}
                          </HuntrTableCell>
                          <HuntrTableCell className="px-3 py-2.5 text-[var(--ui-text-secondary)] max-w-[200px]">
                            <span className="line-clamp-2">
                              {item.specifications ?? item.service_scope ?? item.catalogue?.specifications ?? "-"}
                            </span>
                          </HuntrTableCell>
                        </HuntrTableRow>
                      ))}
                    </HuntrTableBody>
                  </HuntrTable>
                </div>
              </div>
            )}

            {/* Vendor Criteria */}
            {rfq.vendor_evaluation_criteria?.length > 0 && (
              <div className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-5 flex flex-col gap-2 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">
                  <CheckCircle2 size={13} />
                  Kriteria Evaluasi Vendor
                </div>
                <ul className="flex flex-col gap-1.5">
                  {rfq.vendor_evaluation_criteria.map((crit: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[var(--ui-text-secondary)]">
                      <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                      {crit}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Sidebar: CTA */}
          <div className="flex flex-col gap-3 sticky top-20">
            {/* CTA Card */}
            <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-5 flex flex-col gap-4 shadow-sm">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-500">
                  <TrendingUp size={13} />
                  Submit Penawaran
                </div>
                {tenderStatus.isOpen ? (
                  <p className="text-xs text-[var(--ui-text-muted)]">
                    Tender masih terbuka selama <b className="text-[var(--ui-text-primary)]">{tenderStatus.daysLeft} hari</b>. Daftar sekarang untuk ikut berpartisipasi!
                  </p>
                ) : (
                  <p className="text-xs text-[var(--ui-text-muted)]">
                    Tender ini dalam proses persiapan. Daftar untuk mendapatkan notifikasi saat dibuka.
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Link
                  to={`/register?tender=${id}&intent=vendor`}
                  className="w-full py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold text-center flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <UserPlus size={15} />
                  Daftar & Submit Bid
                </Link>
                <Link
                  to={`/login?returnTo=/tender/${id}`}
                  className="w-full py-2.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] hover:border-orange-500/50 text-[var(--ui-text-primary)] text-sm font-semibold text-center flex items-center justify-center gap-2 transition-all"
                >
                  <LogIn size={15} />
                  Sudah Punya Akun? Masuk
                </Link>
              </div>

              <div className="pt-2 border-t border-[var(--ui-border)] flex flex-col gap-1.5">
                {[
                  "Gratis daftar dan ikut tender",
                  "Transparansi proses evaluasi",
                  "Notifikasi real-time",
                  "Support e-Faktur & BAST digital",
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-[var(--ui-text-muted)]">
                    <CheckCircle2 size={11} className="text-emerald-500 flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Info Card */}
            <div className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-4 flex flex-col gap-2.5 text-xs shadow-sm">
              <div className="font-bold text-[var(--ui-text-primary)] uppercase tracking-wider text-[10px]">
                Info Tender
              </div>
              <div className="flex flex-col divide-y divide-[var(--ui-border)]">
                {[
                  { label: "Pembeli", value: rfq.company?.name ?? "-" },
                  { label: "Kota", value: rfq.company?.city ?? rfq.delivery_point_recommendation ?? "-" },
                  {
                    label: "Dibuat",
                    value: rfq.created_at
                      ? new Date(rfq.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
                      : "-",
                  },
                  { label: "Durasi", value: `${rfq.duration_days ?? 7} Hari` },
                  { label: "Prioritas", value: rfq.priority ?? "Normal" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-1.5">
                    <span className="text-[var(--ui-text-muted)]">{label}</span>
                    <span className="font-semibold text-[var(--ui-text-primary)] text-right max-w-[140px] truncate">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Share Link */}
            <div className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-4 flex flex-col gap-2 shadow-sm">
              <div className="font-bold text-[var(--ui-text-primary)] uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <Share2 size={11} /> Bagikan Tender Ini
              </div>
              <div className="flex items-center gap-1.5">
                <HuntrInput
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-[var(--ui-bg-input)] border border-[var(--ui-border)] rounded-md px-2.5 py-1.5 text-[11px] text-[var(--ui-text-secondary)] font-mono outline-none truncate"
                />
                <HuntrButton
                  onClick={handleCopy}
                  className="px-2.5 py-1.5 rounded-md bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold transition-all flex items-center gap-1 flex-shrink-0 cursor-pointer"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                </HuntrButton>
              </div>
              {copied && <p className="text-[11px] text-emerald-500 font-medium">✓ Link tersalin ke clipboard!</p>}
            </div>
          </div>
        </div>

        {/* Bottom CTA Strip */}
        <div className="rounded-xl border border-orange-500/20 bg-gradient-to-r from-orange-500/10 to-amber-500/5 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div>
            <h3 className="text-base font-black text-[var(--ui-text-primary)]">Tertarik dengan tender ini?</h3>
            <p className="text-sm text-[var(--ui-text-muted)] mt-0.5">
              Daftar sebagai vendor di Huntr dan mulai submit penawaran dalam hitungan menit.
            </p>
          </div>
          <Link
            to={`/register?tender=${id}&intent=vendor`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold shadow-sm transition-all flex-shrink-0"
          >
            <UserPlus size={15} />
            Daftar Sekarang — Gratis
            <ChevronRight size={15} />
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-[var(--ui-text-muted)] pb-4">
          <span>Powered by </span>
          <Link to="/" className="text-orange-500 hover:underline font-semibold">huntr.id</Link>
          <span> — Platform Pengadaan B2B Indonesia</span>
        </div>
      </div>
    </div>
  );
}
