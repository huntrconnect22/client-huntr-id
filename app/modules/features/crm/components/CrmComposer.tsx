import { Input as HuntrInput, Select as HuntrSelect, Textarea as HuntrTextarea } from "~/shared/ui/Fields";
import { Button as HuntrButton } from "~/shared/ui/Button";
import React, { useState } from "react";
import Swal from "sweetalert2";
import { Plus, X } from "lucide-react";
import type { ComposerKind, RecordRow } from "../types";
import { input } from "../crm-utils";
import {
  authorizeCrmEmail,
  connectCrmIntegration,
  createCrmActivity,
  createCrmCampaign,
  createCrmCurrencyRate,
  createCrmCustomer,
  createCrmDeal,
  createCrmEmailConnection,
  createCrmKnowledge,
  createCrmLead,
  createCrmQuote,
  createCrmSalesTarget,
  createCrmTicket,
  createCrmWorkflow,
  startCrmWhatsAppSession,
} from "~/lib/api/crm";

export function CrmComposer({
  kind,
  companyId,
  customers,
  leads,
  deals,
  onClose,
  onDone,
}: {
  kind: ComposerKind;
  companyId: string;
  customers: RecordRow[];
  leads: RecordRow[];
  deals: RecordRow[];
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({
    currency: "IDR",
    source: "manual",
    type: "task",
    priority: "normal",
    channel: "web",
    trigger: "lead_created",
    provider: "gmail",
    integration_provider: "whatsapp",
    integration_channel: "whatsapp",
    base_currency: "IDR",
    period: new Date().toISOString().slice(0, 7),
  });

  const field = (key: string, label: string, type = "text") => (
    <label className="block text-xs font-semibold text-[var(--ui-text-secondary)]">
      {label}
      <HuntrInput
        type={type}
        value={form[key] || ""}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className={`${input} mt-1`}
      />
    </label>
  );

  const submit = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (kind === "lead") await createCrmLead(companyId, form);
      if (kind === "customer") await createCrmCustomer(companyId, form);
      if (kind === "deal")
        await createCrmDeal(companyId, {
          ...form,
          amount: Number(form.amount || 0),
          probability: Number(form.probability || 10),
        });
      if (kind === "task") await createCrmActivity(companyId, form);
      if (kind === "ticket") await createCrmTicket(companyId, form);
      if (kind === "quote")
        await createCrmQuote(companyId, {
          ...form,
          lines: [
            {
              name: form.line_name || "Item",
              quantity: Number(form.quantity || 1),
              unit_price: Number(form.unit_price || 0),
            },
          ],
          discount_amount: Number(form.discount_amount || 0),
          tax_amount: Number(form.tax_amount || 0),
        });
      if (kind === "workflow")
        await createCrmWorkflow(companyId, {
          ...form,
          actions: [{ type: "create_task", title: "Review otomatis" }],
        });
      if (kind === "email") {
        if (form.provider === "imap") {
          await createCrmEmailConnection(companyId, form);
        } else {
          const { authorization_url } = await authorizeCrmEmail(
            companyId,
            form.provider,
          );
          window.open(
            authorization_url,
            "crm-email-oauth",
            "width=560,height=720",
          );
          Swal.fire({
            icon: "info",
            title: "Lanjutkan otorisasi",
            text: "Selesaikan login pada jendela provider, lalu kembali dan refresh CRM.",
          });
        }
      }
      if (kind === "campaign")
        await createCrmCampaign(companyId, {
          name: form.name,
          subject: form.subject,
          body: form.body,
          scheduled_at: form.scheduled_at || undefined,
        });
      if (kind === "knowledge")
        await createCrmKnowledge(companyId, {
          title: form.title,
          body: form.body,
          status: form.status || "draft",
          locale: form.locale || "id",
        });
      if (kind === "integration")
        if (form.integration_provider === "whatsapp") {
          await startCrmWhatsAppSession(companyId);
        } else {
          await connectCrmIntegration(companyId, {
            provider: form.integration_provider,
            channel: form.integration_channel,
            settings: form.settings ? { endpoint: form.settings } : {},
          });
        }
      if (kind === "target")
        await createCrmSalesTarget(companyId, {
          period: form.period,
          target_amount: Number(form.target_amount || 0),
          currency: form.currency || "IDR",
        });
      if (kind === "rate")
        await createCrmCurrencyRate(companyId, {
          base_currency: form.base_currency || "IDR",
          quote_currency: form.quote_currency,
          rate: Number(form.rate || 0),
        });
      await onDone();
      Swal.fire({
        icon: "success",
        title: "Tersimpan",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal menyimpan",
        text: err.message || "Periksa kembali data formulir.",
      });
    } finally {
      setSaving(false);
    }
  };

  const title = {
    lead: "Tambah Lead Baru",
    customer: "Tambah Customer Baru",
    deal: "Buat Deal Penjualan Baru",
    task: "Buat Task / Aktivitas Baru",
    ticket: "Buat Tiket Dukungan Baru",
    quote: "Buat Penawaran (Quote) Baru",
    workflow: "Buat Workflow Otomatis",
    email: "Hubungkan Email Kerja",
    campaign: "Buat Campaign Email",
    knowledge: "Tulis Artikel Knowledge Base",
    integration: "Hubungkan Kanal Komunikasi",
    target: "Atur Target Penjualan",
    rate: "Tambah Kurs Mata Uang",
  }[kind];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-lg rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="mb-4 flex items-center justify-between border-b border-[var(--ui-border)] pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
              <Plus size={16} />
            </div>
            <h3 className="font-bold text-[var(--ui-text-primary)]">{title}</h3>
          </div>
          <HuntrButton
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[var(--ui-text-muted)] hover:bg-[var(--ui-bg-input)] hover:text-[var(--ui-text-primary)] transition-colors"
          >
            <X size={16} />
          </HuntrButton>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {["lead", "customer"].includes(kind) && (
            <>
              {field("name", "Nama Kontak *")}
              {field("company_name", "Perusahaan")}
              {field("email", "Email", "email")}
              {field("phone", "Nomor Telepon")}
              {kind === "lead" &&
                field("estimated_value", "Estimasi Nilai Peluang", "number")}
            </>
          )}
          {kind === "deal" && (
            <>
              {field("name", "Nama Deal *")}
              {field("amount", "Nilai Peluang", "number")}
              {field("probability", "Probabilitas (%)", "number")}
              <Select
                label="Pilih Customer"
                value={form.customer_id || ""}
                onChange={(v) => setForm({ ...form, customer_id: v })}
                options={customers}
              />
              <Select
                label="Tautkan Lead"
                value={form.lead_id || ""}
                onChange={(v) => setForm({ ...form, lead_id: v })}
                options={leads}
              />
            </>
          )}
          {kind === "task" && (
            <>
              {field("title", "Judul Task *")}
              <Select
                label="Terkait Deal"
                value={form.deal_id || ""}
                onChange={(v) => setForm({ ...form, deal_id: v })}
                options={deals}
              />
              {field("due_at", "Tenggat Waktu", "datetime-local")}
            </>
          )}
          {kind === "ticket" && (
            <>
              {field("subject", "Subjek Tiket *")}
              <Select
                label="Customer"
                value={form.customer_id || ""}
                onChange={(v) => setForm({ ...form, customer_id: v })}
                options={customers}
              />
              <label className="block text-xs font-semibold text-[var(--ui-text-secondary)]">
                Prioritas
                <HuntrSelect
                  value={form.priority}
                  onChange={(e) =>
                    setForm({ ...form, priority: e.target.value })
                  }
                  className={`${input} mt-1`}
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </HuntrSelect>
              </label>
            </>
          )}
          {kind === "quote" && (
            <>
              {field("line_name", "Nama Item *")}
              {field("quantity", "Kuantitas", "number")}
              {field("unit_price", "Harga Satuan", "number")}
              <Select
                label="Customer"
                value={form.customer_id || ""}
                onChange={(v) => setForm({ ...form, customer_id: v })}
                options={customers}
              />
            </>
          )}
          {kind === "workflow" && (
            <>
              {field("name", "Nama Workflow *")}
              <label className="block text-xs font-semibold text-[var(--ui-text-secondary)]">
                Trigger Peristiwa
                <HuntrSelect
                  value={form.trigger}
                  onChange={(e) =>
                    setForm({ ...form, trigger: e.target.value })
                  }
                  className={`${input} mt-1`}
                >
                  <option value="lead_created">Lead Dibuat</option>
                  <option value="deal_stage_changed">Deal Berubah Tahap</option>
                  <option value="ticket_created">Tiket Bantuan Dibuat</option>
                  <option value="quote_approved">Quote Disetujui</option>
                </HuntrSelect>
              </label>
            </>
          )}
          {kind === "email" && (
            <>
              <label className="block text-xs font-semibold text-[var(--ui-text-secondary)]">
                Provider Email
                <HuntrSelect
                  value={form.provider}
                  onChange={(e) =>
                    setForm({ ...form, provider: e.target.value })
                  }
                  className={`${input} mt-1`}
                >
                  <option value="gmail">Gmail</option>
                  <option value="microsoft">Microsoft 365</option>
                  <option value="imap">IMAP Standar</option>
                </HuntrSelect>
              </label>
              {form.provider === "imap" &&
                field("email", "Email Kerja *", "email")}
              {form.provider !== "imap" && (
                <p className="sm:col-span-2 text-xs leading-relaxed text-[var(--ui-text-muted)]">
                  Jendela pop-up login provider akan dibuka untuk persetujuan
                  akun OAuth 2.0 yang aman.
                </p>
              )}
            </>
          )}
          {kind === "campaign" && (
            <>
              {field("name", "Nama Campaign *")}
              {field("subject", "Subjek Email *")}
              {field("scheduled_at", "Jadwal Pengiriman", "datetime-local")}
              <label className="sm:col-span-2 block text-xs font-semibold text-[var(--ui-text-secondary)]">
                Konten Email *
                <HuntrTextarea
                  value={form.body || ""}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  className={`${input} mt-1 min-h-28`}
                />
              </label>
            </>
          )}
          {kind === "knowledge" && (
            <>
              {field("title", "Judul Panduan *")}
              <label className="block text-xs font-semibold text-[var(--ui-text-secondary)]">
                Status Publikasi
                <HuntrSelect
                  value={form.status || "draft"}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className={`${input} mt-1`}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </HuntrSelect>
              </label>
              <label className="sm:col-span-2 block text-xs font-semibold text-[var(--ui-text-secondary)]">
                Konten Artikel *
                <HuntrTextarea
                  value={form.body || ""}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  className={`${input} mt-1 min-h-28`}
                />
              </label>
            </>
          )}
          {kind === "integration" && (
            <>
              <label className="block text-xs font-semibold text-[var(--ui-text-secondary)]">
                Provider Kanal
                <HuntrSelect
                  value={form.integration_provider}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      integration_provider: e.target.value,
                      integration_channel:
                        e.target.value === "live_chat"
                          ? "live_chat"
                          : e.target.value === "social"
                            ? "social"
                            : e.target.value,
                    })
                  }
                  className={`${input} mt-1`}
                >
                  <option value="whatsapp">WhatsApp Gateway</option>
                  <option value="live_chat">Live Chat Web</option>
                  <option value="social">Social Media</option>
                  <option value="gmail">Google Workspace</option>
                  <option value="microsoft">Microsoft 365</option>
                </HuntrSelect>
              </label>
              {field("settings", "Endpoint atau ID Workspace")}
            </>
          )}
          {kind === "target" && (
            <>
              {field("period", "Periode (YYYY-MM) *")}
              {field("target_amount", "Target Penjualan *", "number")}
            </>
          )}
          {kind === "rate" && (
            <>
              {field("base_currency", "Mata Uang Dasar (ex: IDR) *")}
              {field("quote_currency", "Mata Uang Pembanding (ex: USD) *")}
              {field("rate", "Nilai Kurs *", "number")}
            </>
          )}
        </div>

        <div className="mt-5 flex gap-2.5 pt-3 border-t border-[var(--ui-border)]">
          <HuntrButton
            type="button"
            onClick={onClose}
            className="flex-1 inline-flex h-9 items-center justify-center rounded-lg border border-[var(--ui-border-input)] bg-[var(--ui-bg-input)] text-xs font-semibold text-[var(--ui-text-secondary)] transition-all hover:text-[var(--ui-text-primary)]"
          >
            Batal
          </HuntrButton>
          <HuntrButton
            disabled={saving}
            className="flex-1 inline-flex h-9 items-center justify-center rounded-lg bg-orange-500 text-xs font-bold text-white shadow-sm shadow-orange-500/20 transition-all hover:bg-orange-600 disabled:opacity-50"
          >
            {saving ? "Menyimpan…" : "Simpan Data"}
          </HuntrButton>
        </div>
      </form>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: RecordRow[];
}) {
  return (
    <label className="block text-xs font-semibold text-[var(--ui-text-secondary)]">
      {label}
      <HuntrSelect
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${input} mt-1`}
      >
        <option value="">-- Tidak dipilih --</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name || o.title}
          </option>
        ))}
      </HuntrSelect>
    </label>
  );
}


