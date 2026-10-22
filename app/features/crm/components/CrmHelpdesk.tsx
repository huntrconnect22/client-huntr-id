import React, { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { AlertTriangle, Headphones, MessageSquare, Send } from "lucide-react";
import type { RecordRow } from "../types";
import {
  card,
  conversationIdentity,
  dateTime,
  getInitials,
  input,
  jsonValue,
} from "../crm-utils";
import { getCrmConversationMessages, sendCrmWhatsAppMessage } from "~/lib/api/crm";
import { getFullApiUrl } from "~/lib/client";
import { Empty } from "./CrmShared";
import { CrmRecords } from "./CrmRecords";

function mediaPreviewUrl(value: unknown): string | null {
  const raw = String(value || "").trim();
  if (!raw) return null;
  return /^https?:\/\//i.test(raw) ? raw : getFullApiUrl(raw);
}

export function CrmHelpdesk({
  companyId,
  tickets,
  conversations,
  onCreate,
  onRefreshInbox,
  whatsAppStatus,
  onOpenAutomation,
}: {
  companyId: string;
  tickets: RecordRow[];
  conversations: RecordRow[];
  onCreate: () => void;
  onRefreshInbox: () => Promise<void>;
  whatsAppStatus?: string;
  onOpenAutomation: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<RecordRow[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const selected = conversations.find((item) => item.id === selectedId);
  const whatsAppConnected = whatsAppStatus === "connected";
  const needsWhatsAppConnection =
    selected?.channel === "whatsapp" && !whatsAppConnected;

  const loadMessages = useCallback(
    async (conversationId: string) => {
      const response = await getCrmConversationMessages(
        companyId,
        conversationId,
      );
      setMessages(response.messages ?? []);
    },
    [companyId],
  );

  useEffect(() => {
    if (selectedId) void loadMessages(selectedId);
  }, [loadMessages, selectedId]);

  useEffect(() => {
    if (!selectedId && conversations[0]) setSelectedId(conversations[0].id);
    if (selectedId && !conversations.some((item) => item.id === selectedId)) {
      setSelectedId(null);
    }
  }, [conversations, selectedId]);

  useEffect(() => {
    let active = true;
    const pollInbox = async () => {
      await onRefreshInbox();
      if (active && selectedId) await loadMessages(selectedId);
    };
    const timer = window.setInterval(() => void pollInbox(), 4_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [loadMessages, onRefreshInbox, selectedId]);

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    if (selected.channel === "whatsapp" && !whatsAppConnected) {
      onOpenAutomation();
      return;
    }
    setSending(true);
    try {
      if (selected.channel !== "whatsapp") {
        throw new Error(
          "Pengiriman balasan baru tersedia untuk kanal WhatsApp.",
        );
      }
      await sendCrmWhatsAppMessage(companyId, {
        conversation_id: selected.id,
        to: selected.external_id,
        body: reply.trim(),
      });
      setReply("");
      await loadMessages(selected.id);
    } catch (error: any) {
      const needsRecovery = [
        "whatsapp_session_unavailable",
        "crm_whatsapp_service_unavailable",
      ].includes(error?.code);
      const result = await Swal.fire({
        icon: "error",
        title: "Pesan tidak terkirim",
        text: error.message,
        showCancelButton: needsRecovery,
        confirmButtonText: needsRecovery ? "Buka Automation" : "Tutup",
        cancelButtonText: "Tetap di sini",
      });
      if (needsRecovery && result.isConfirmed) onOpenAutomation();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">
      <CrmRecords
        title="Helpdesk & Ticketing Layanan"
        intro="Lacak komplain dan permintaan dukungan pelanggan. SLA dihitung otomatis berdasarkan prioritas tiket."
        icon={Headphones}
        rows={tickets}
        cols={[
          "number",
          "subject",
          "channel",
          "priority",
          "status",
          "resolve_due_at",
        ]}
        onCreate={onCreate}
        createLabel="Tiket Baru"
      />

      {/* ── Omnichannel Chat Workspace ───────────────────────────── */}
      <section className={`${card} overflow-hidden`}>
        <div className="border-b border-[var(--ui-border)] bg-[var(--ui-bg-input)]/50 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-orange-500" />
            <h3 className="text-sm font-bold text-[var(--ui-text-primary)]">
              Omnichannel Inbox & Live Chat
            </h3>
          </div>
          <span className="text-xs text-[var(--ui-text-muted)]">
            {conversations.length} Percakapan aktif
          </span>
        </div>

        <div className="grid h-[540px] xl:grid-cols-[320px_1fr] overflow-hidden">
          {/* Conversation Sidebar */}
          <aside className="border-b border-[var(--ui-border)] xl:border-b-0 xl:border-r border-[var(--ui-border)] flex flex-col h-full min-h-0 overflow-hidden">
            <div className="p-3 border-b border-[var(--ui-border)] bg-[var(--ui-bg-card)] shrink-0 flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--ui-text-secondary)]">
                Daftar Kontak Percakapan
              </span>
              <span className="rounded-md bg-[var(--ui-bg-input)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--ui-text-muted)] border border-[var(--ui-border)]">
                {conversations.length}
              </span>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-[var(--ui-border)] overscroll-contain">
              {conversations.length ? (
                conversations.map((item) => {
                  const isCurrent = selectedId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={`block w-full p-3 text-left transition-all ${
                        isCurrent
                          ? "bg-orange-500/10 border-l-2 border-orange-500"
                          : "hover:bg-[var(--ui-bg-input)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--ui-bg-input)] text-xs font-bold text-[var(--ui-text-primary)]">
                            {getInitials(conversationIdentity(item))}
                          </div>
                          <span className="truncate text-xs font-bold text-[var(--ui-text-primary)]">
                            {conversationIdentity(item)}
                          </span>
                        </div>
                        <span className="shrink-0 text-[10px] text-[var(--ui-text-muted)]">
                          {dateTime(item.last_message_at)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2 pl-9">
                        <p className="truncate text-xs text-[var(--ui-text-muted)]">
                          {item.last_message_body || "Percakapan baru..."}
                        </p>
                        <span className="shrink-0 rounded-md bg-[var(--ui-bg-input)] px-1.5 py-0.2 text-[9px] font-semibold uppercase text-[var(--ui-text-secondary)]">
                          {item.channel}
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <Empty
                  text="Belum ada pesan masuk. Percakapan WhatsApp atau email akan muncul di sini."
                  icon={MessageSquare}
                />
              )}
            </div>
          </aside>

          {/* Active Chat Thread */}
          <div className="flex flex-col h-full min-h-0 bg-[var(--ui-bg-page)]/40 overflow-hidden">
            {selected ? (
              <>
                {/* Chat Header */}
                <div className="border-b border-[var(--ui-border)] bg-[var(--ui-bg-card)] px-4 py-3 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 font-bold text-orange-500">
                      {getInitials(conversationIdentity(selected))}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[var(--ui-text-primary)]">
                        {conversationIdentity(selected)}
                      </div>
                      <div className="text-xs text-[var(--ui-text-muted)] flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Kanal:{" "}
                        {selected.channel === "whatsapp"
                          ? "WhatsApp Web"
                          : selected.channel}
                      </div>
                    </div>
                  </div>
                </div>

                {needsWhatsAppConnection && (
                  <div className="mx-4 mt-3 flex items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-500">
                    <div className="flex min-w-0 items-center gap-2">
                      <AlertTriangle size={15} className="shrink-0" />
                      <span>WhatsApp belum siap untuk mengirim pesan.</span>
                    </div>
                    <button
                      type="button"
                      onClick={onOpenAutomation}
                      className="shrink-0 font-semibold underline underline-offset-2"
                    >
                      Buka Automation
                    </button>
                  </div>
                )}

                {/* Messages Feed */}
                <div className="flex-1 min-h-0 space-y-3 overflow-y-auto p-4 overscroll-contain">
                  {messages.length ? (
                    messages.map((message) => {
                      const isOutbound = message.direction === "outbound";
                      const metadata = jsonValue(message.metadata);
                      const media = jsonValue(metadata.media);
                      const imageUrl = media.type === "image" ? mediaPreviewUrl(media.url) : null;
                      const isPhotoPlaceholder = message.body === "[Foto]";
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[78%] rounded-xl px-3.5 py-2.5 text-xs shadow-xs ${
                              isOutbound
                                ? "bg-orange-500 text-white rounded-br-xs"
                                : "bg-[var(--ui-bg-card)] text-[var(--ui-text-primary)] border border-[var(--ui-border)] rounded-bl-xs"
                            }`}
                          >
                            {imageUrl && (
                              <a
                                href={imageUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mb-2 block overflow-hidden rounded-md bg-black/5"
                                title="Buka foto ukuran penuh"
                              >
                                <img
                                  src={imageUrl}
                                  alt={media.filename || "Foto WhatsApp"}
                                  className="max-h-72 w-auto max-w-full object-contain"
                                  loading="lazy"
                                />
                              </a>
                            )}
                            {!isPhotoPlaceholder && (
                              <p className="whitespace-pre-wrap leading-relaxed">
                                {message.body}
                              </p>
                            )}
                            <span
                              className={`mt-1 block text-[10px] ${isOutbound ? "text-white/70 text-right" : "text-[var(--ui-text-muted)]"}`}
                            >
                              {dateTime(message.created_at)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <Empty
                      text="Belum ada riwayat pesan dalam percakapan ini."
                      icon={MessageSquare}
                    />
                  )}
                </div>

                {/* Reply Composer */}
                <div className="border-t border-[var(--ui-border)] bg-[var(--ui-bg-card)] p-3 shrink-0">
                  <div className="flex gap-2">
                    <textarea
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      placeholder={
                        selected.channel === "whatsapp"
                          ? "Tulis balasan pesan WhatsApp ke pelanggan..."
                          : "Pesan hanya dapat dibalas untuk kanal WhatsApp yang terhubung"
                      }
                      rows={2}
                      disabled={needsWhatsAppConnection}
                      className={`${input} resize-none`}
                    />
                    <button
                      type="button"
                      disabled={
                        sending ||
                        selected.channel !== "whatsapp" ||
                        needsWhatsAppConnection ||
                        !reply.trim()
                      }
                      onClick={() => void sendReply()}
                      className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 self-end rounded-lg bg-orange-500 px-4 text-xs font-semibold text-white shadow-sm shadow-orange-500/20 transition-all hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Send
                        size={14}
                        className={sending ? "animate-pulse" : ""}
                      />
                      <span>{sending ? "Kirim…" : "Kirim"}</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="grid flex-1 place-items-center p-8">
                <Empty
                  text="Pilih salah satu kontak percakapan untuk membaca dan membalas pesan."
                  icon={MessageSquare}
                />
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
