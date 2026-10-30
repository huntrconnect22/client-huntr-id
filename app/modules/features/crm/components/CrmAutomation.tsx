import { Button as HuntrButton } from "~/shared/ui/Button";
import React from "react";
import {
  BookOpen,
  CheckCircle2,
  Mail,
  LoaderCircle,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
  Send,
  Zap,
} from "lucide-react";
import type { ComposerKind, RecordRow } from "../types";
import { jsonValue } from "../crm-utils";
import { Empty, Panel, StatusBadge } from "./CrmShared";
import { CrmRecords } from "./CrmRecords";

export function CrmAutomation({
  workflows,
  emails,
  campaigns,
  knowledge,
  integrations,
  onCreate,
  onCompose,
  onDisconnectWhatsApp,
  onSyncEmailInbox,
}: {
  workflows: RecordRow[];
  emails: RecordRow[];
  campaigns: RecordRow[];
  knowledge: RecordRow[];
  integrations: RecordRow[];
  onCreate: () => void;
  onCompose: (kind: ComposerKind) => void;
  onDisconnectWhatsApp: () => void;
  onSyncEmailInbox: () => void;
}) {
  const whatsApp = integrations.find(
    (item) => item.provider === "whatsapp_web",
  );
  const whatsAppSettings = jsonValue(whatsApp?.settings);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {/* ── Workflow Automation ───────────────────────────────────── */}
      <CrmRecords
        title="Workflow Automasi Lintas Divisi"
        intro="Jalankan penugasan dan notifikasi otomatis saat lead, deal, atau quote berubah status."
        icon={Zap}
        rows={workflows}
        cols={["name", "trigger", "is_active", "updated_at"]}
        onCreate={onCreate}
        createLabel="Buat Workflow"
      />

      {/* ── Email Connections ─────────────────────────────────────── */}
      <Panel
        title="Koneksi Email Kerja"
        caption="Akun email terhubung untuk pencatatan korespondensi otomatis"
        icon={Mail}
      >
        <div className="space-y-2.5">
          {emails.length ? (
            emails.map((e: RecordRow) => (
              <div
                key={e.id}
                className="flex items-center justify-between rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] p-3 text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-orange-500/10 text-orange-500">
                    <Mail size={14} />
                  </div>
                  <div>
                    <div className="font-bold text-[var(--ui-text-primary)]">
                      {e.email}
                    </div>
                    <div className="text-[10px] text-[var(--ui-text-muted)]">
                      Provider: {e.provider}
                    </div>
                  </div>
                </div>
                <StatusBadge value={e.status} />
              </div>
            ))
          ) : (
            <Empty
              text="Belum ada email terhubung. Hubungkan akun Google, Microsoft, atau IMAP."
              icon={Mail}
            />
          )}
        </div>
        {emails.length > 0 && (
          <HuntrButton
            onClick={onSyncEmailInbox}
            className="mt-3.5 inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] px-3 text-xs font-semibold text-[var(--ui-text-primary)] transition-all hover:border-orange-500/50 hover:text-orange-500"
          >
            <RefreshCw size={13} />
            <span>Sinkronkan Inbox Sekarang</span>
          </HuntrButton>
        )}
      </Panel>

      {/* ── Campaigns ─────────────────────────────────────────────── */}
      <CrmRecords
        title="Email Campaign"
        intro="Kirim promosi terjadwal kepada prospek berdasarkan tahap lifecycle perusahaan."
        icon={Send}
        rows={campaigns}
        cols={["name", "status", "scheduled_at", "sent_at"]}
        onCreate={() => onCompose("campaign")}
        createLabel="Buat Campaign"
      />

      {/* ── Communication Channels & WhatsApp ─────────────────────── */}
      <Panel
        title="Kanal Komunikasi & WhatsApp Gateway"
        caption="Hubungkan nomor WhatsApp resmi dan webhook omnichannel untuk interaksi langsung"
        icon={MessageSquare}
      >
        <div className="space-y-3">
          {integrations.length ? (
            integrations.map((item: RecordRow) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg-input)] p-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Phone size={15} />
                  </div>
                  <div>
                    <span className="font-bold capitalize text-[var(--ui-text-primary)]">
                      {item.provider.replaceAll("_", " ")}
                    </span>
                    <span className="block text-[10px] text-[var(--ui-text-muted)]">
                      Kanal: {item.channel}
                    </span>
                  </div>
                </div>
                <StatusBadge value={item.status} />
              </div>
            ))
          ) : (
            <Empty
              text="Belum ada kanal komunikasi terdaftar."
              icon={Phone}
            />
          )}

          {/* Action buttons for Channels */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--ui-border)]">
            <HuntrButton
              onClick={() => onCompose("integration")}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] px-3 text-xs font-semibold text-[var(--ui-text-primary)] transition-all hover:border-orange-500/50 hover:text-orange-500"
            >
              <Plus size={13} />
              <span>Hubungkan Kanal</span>
            </HuntrButton>
            {whatsApp && (
              <HuntrButton
                type="button"
                onClick={onDisconnectWhatsApp}
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 text-xs font-semibold text-rose-400 transition-all hover:bg-rose-500/20"
              >
                <span>Hapus Sesi WhatsApp</span>
              </HuntrButton>
            )}
          </div>

          {/* WhatsApp Scan QR Card */}
          {whatsApp?.status === "awaiting_scan" && whatsAppSettings.qr && (
            <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-center">
              <p className="text-xs font-bold text-[var(--ui-text-primary)]">
                Pindai QR Code dengan WhatsApp di Ponsel Anda
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--ui-text-muted)]">
                Buka WhatsApp &gt; Perangkat Tertaut &gt; Tautkan Perangkat.
              </p>
              <div className="mt-3 inline-block rounded-lg bg-white p-2.5 shadow-sm">
                <img
                  src={whatsAppSettings.qr}
                  alt="QR WhatsApp"
                  className="h-44 w-44"
                />
              </div>
            </div>
          )}

          {whatsApp?.status === "initializing" && (
            <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-3 text-xs text-sky-400 flex items-start gap-2">
              <LoaderCircle size={15} className="mt-0.5 shrink-0 animate-spin" />
              <span>
                {whatsAppSettings.message ||
                  "WhatsApp sedang memulihkan sesi aman. Tunggu sampai status menjadi Terhubung; QR tidak perlu dipindai ulang."}
              </span>
            </div>
          )}

          {whatsApp?.status === "connected" && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle2 size={15} />
              <span>
                WhatsApp Terhubung{" "}
                {whatsAppSettings.phone
                  ? `· Nomor: ${whatsAppSettings.phone}`
                  : ""}
              </span>
            </div>
          )}

          {whatsAppSettings.delivery_error && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-400">
              <b className="block">Pesan masuk belum tersimpan</b>
              <p className="mt-0.5">{whatsAppSettings.delivery_error}</p>
            </div>
          )}

          {["error", "auth_failed", "disconnected", "service_unavailable"].includes(
            whatsApp?.status || "",
          ) && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
              <b className="block">Status WhatsApp: {whatsApp?.status}</b>
              <p className="mt-0.5">
                {whatsAppSettings.message ||
                  whatsAppSettings.reason ||
                  (whatsApp?.status === "service_unavailable"
                    ? "Layanan WhatsApp CRM sedang tidak merespons. Jalankan ulang service lalu coba hubungkan kembali."
                    : "Sesi tidak dapat dijalankan. Silakan hapus koneksi dan hubungkan kembali.")}
              </p>
            </div>
          )}
        </div>
      </Panel>

      {/* ── Knowledge Base ────────────────────────────────────────── */}
      <CrmRecords
        title="Knowledge Base Internal"
        intro="Panduan standar dan basis pengetahuan tim untuk mempercepat respon tiket bantuan."
        icon={BookOpen}
        rows={knowledge}
        cols={["title", "locale", "status", "updated_at"]}
        onCreate={() => onCompose("knowledge")}
        createLabel="Tulis Artikel"
      />
    </div>
  );
}


