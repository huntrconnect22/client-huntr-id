import { Button as HuntrButton } from "~/shared/ui/Button";
import { Input as HuntrInput, Textarea as HuntrTextarea } from "~/shared/ui/Fields";
import React, { useCallback, useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import {
  AlertTriangle,
  Headphones,
  MessageSquare,
  Send,
  Search,
  X,
  Phone,
  Mail,
  MessageCircle,
  User,
  Layers,
} from "lucide-react";
import type { RecordRow } from "../types";
import {
  card,
  conversationDisplayName,
  conversationSubtitle,
  conversationIdentity,
  formatChatTime,
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

function ChannelBadgeIcon({ channel }: { channel: string }) {
  if (channel === "whatsapp") {
    return (
      <span
        title="WhatsApp"
        className="w-4 h-4 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-xs"
      >
        <Phone size={9} />
      </span>
    );
  }
  if (channel === "email") {
    return (
      <span
        title="Email"
        className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-xs"
      >
        <Mail size={9} />
      </span>
    );
  }
  return (
    <span
      title="Live Chat"
      className="w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs"
    >
      <MessageSquare size={9} />
    </span>
  );
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
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("all");

  const whatsAppConnected = whatsAppStatus === "connected";

  // Sort and filter conversations
  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const timeA = new Date(a.last_message_at || a.created_at || 0).getTime();
      const timeB = new Date(b.last_message_at || b.created_at || 0).getTime();
      return timeB - timeA;
    });
  }, [conversations]);

  const filteredConversations = useMemo(() => {
    return sortedConversations.filter((item) => {
      if (channelFilter !== "all" && item.channel !== channelFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const name = (item.customer_name || "").toLowerCase();
      const phone = (item.customer_phone || item.external_id || "").toLowerCase();
      const body = (item.last_message_body || "").toLowerCase();
      return name.includes(q) || phone.includes(q) || body.includes(q);
    });
  }, [sortedConversations, channelFilter, searchQuery]);

  const selected = conversations.find((item) => item.id === selectedId);
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
    if (!selectedId && filteredConversations[0]) {
      setSelectedId(filteredConversations[0].id);
    }
    if (selectedId && !conversations.some((item) => item.id === selectedId)) {
      setSelectedId(filteredConversations[0]?.id || null);
    }
  }, [conversations, filteredConversations, selectedId]);

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
    <div className="space-y-6">
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
      <section className={`${card} overflow-hidden shadow-sm`}>
        {/* Main Section Header */}
        <div className="border-b border-[var(--ui-border)] bg-[var(--ui-bg-input)]/40 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
              <MessageSquare size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--ui-text-primary)]">
                Omnichannel Inbox & Live Chat
              </h3>
              <p className="text-[11px] text-[var(--ui-text-muted)]">
                Kelola pesan masuk terintegrasi dari WhatsApp, Live Chat Web, dan Email.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--ui-bg-card)] border border-[var(--ui-border)] text-[var(--ui-text-secondary)]">
            {conversations.length} Percakapan
          </span>
        </div>

        <div className="grid h-[620px] lg:grid-cols-[360px_1fr] overflow-hidden">
          {/* Conversation Sidebar */}
          <aside className="border-b border-[var(--ui-border)] lg:border-b-0 lg:border-r border-[var(--ui-border)] flex flex-col h-full min-h-0 bg-[var(--ui-bg-card)] overflow-hidden">
            {/* Search & Filter Header */}
            <div className="p-3 border-b border-[var(--ui-border)] space-y-2.5 shrink-0 bg-[var(--ui-bg-card)]">
              {/* Search Bar */}
              <div className="relative">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)]"
                />
                <HuntrInput
                  type="text"
                  placeholder="Cari kontak, nomor, atau pesan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-7 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-xs text-[var(--ui-text-primary)] placeholder:text-[var(--ui-text-muted)] outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--ui-text-muted)] hover:text-[var(--ui-text-primary)] p-0.5 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Channel Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {[
                  { key: "all", label: "Semua" },
                  { key: "whatsapp", label: "WhatsApp" },
                  { key: "email", label: "Email" },
                  { key: "live_chat", label: "Live Chat" },
                ].map((tab) => {
                  const isActive = channelFilter === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setChannelFilter(tab.key)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        isActive
                          ? "bg-orange-500 text-white shadow-xs"
                          : "bg-[var(--ui-bg-input)]/70 text-[var(--ui-text-muted)] hover:text-[var(--ui-text-primary)] hover:bg-[var(--ui-bg-input)]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contact List */}
            <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1 overscroll-contain">
              {filteredConversations.length ? (
                filteredConversations.map((item) => {
                  const isCurrent = selectedId === item.id;
                  const displayName = conversationDisplayName(item);
                  const subtitle = conversationSubtitle(item);
                  const initials = getInitials(displayName);
                  const timeStr = formatChatTime(item.last_message_at || item.created_at);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={`w-full p-2.5 rounded-xl text-left transition-all flex items-start gap-3 cursor-pointer border ${
                        isCurrent
                          ? "bg-orange-500/10 border-orange-500/30 shadow-xs ring-1 ring-orange-500/20"
                          : "border-transparent hover:bg-[var(--ui-bg-input)]/60 hover:border-[var(--ui-border)]/50"
                      }`}
                    >
                      {/* Avatar with Channel Badge */}
                      <div className="relative shrink-0 mt-0.5">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shadow-xs ${
                            isCurrent
                              ? "bg-orange-500 text-white"
                              : "bg-[var(--ui-bg-input)] text-[var(--ui-text-primary)] border border-[var(--ui-border)]"
                          }`}
                        >
                          {initials === "#" ? <User size={16} /> : initials}
                        </div>
                        <div className="absolute -bottom-1 -right-1">
                          <ChannelBadgeIcon channel={item.channel} />
                        </div>
                      </div>

                      {/* Contact Info & Message Preview */}
                      <div className="flex-1 min-w-0">
                        {/* Row 1: Name & Timestamp */}
                        <div className="flex items-baseline justify-between gap-1.5">
                          <span
                            title={displayName}
                            className={`truncate text-xs font-bold leading-tight block ${
                              isCurrent
                                ? "text-orange-500"
                                : "text-[var(--ui-text-primary)]"
                            }`}
                          >
                            {displayName}
                          </span>
                          <span className="shrink-0 text-[10px] text-[var(--ui-text-muted)] font-medium">
                            {timeStr}
                          </span>
                        </div>

                        {/* Row 2: Secondary Phone / Info if Name exists */}
                        {subtitle && (
                          <div className="text-[11px] text-[var(--ui-text-muted)] truncate font-mono mt-0.5">
                            {subtitle}
                          </div>
                        )}

                        {/* Row 3: Last Message Preview & Channel Label */}
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <p className="truncate text-xs text-[var(--ui-text-muted)] leading-snug">
                            {item.last_message_body || "Percakapan baru..."}
                          </p>
                          <span className="shrink-0 text-[9px] uppercase px-1.5 py-0.2 rounded bg-[var(--ui-bg-input)] text-[var(--ui-text-secondary)] font-semibold border border-[var(--ui-border)]">
                            {item.channel === "whatsapp" ? "WA" : item.channel}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="py-12 px-4 text-center">
                  <div className="w-10 h-10 rounded-xl bg-[var(--ui-bg-input)] flex items-center justify-center text-[var(--ui-text-muted)] mx-auto mb-2">
                    <Search size={18} />
                  </div>
                  <p className="text-xs font-bold text-[var(--ui-text-primary)]">
                    Kontak tidak ditemukan
                  </p>
                  <p className="text-[11px] text-[var(--ui-text-muted)] mt-1">
                    {searchQuery
                      ? `Tidak ada percakapan dengan kata kunci "${searchQuery}".`
                      : "Belum ada riwayat percakapan untuk kanal ini."}
                  </p>
                </div>
              )}
            </div>
          </aside>

          {/* Active Chat Thread */}
          <div className="flex flex-col h-full min-h-0 bg-[var(--ui-bg-page)]/40 overflow-hidden">
            {selected ? (
              <>
                {/* Chat Header */}
                <div className="border-b border-[var(--ui-border)] bg-[var(--ui-bg-card)] px-4 py-3 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold text-xs">
                        {getInitials(conversationDisplayName(selected)) === "#" ? (
                          <User size={16} />
                        ) : (
                          getInitials(conversationDisplayName(selected))
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1">
                        <ChannelBadgeIcon channel={selected.channel} />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[var(--ui-text-primary)] truncate">
                        {conversationDisplayName(selected)}
                      </div>
                      <div className="text-xs text-[var(--ui-text-muted)] flex items-center gap-2 truncate">
                        {conversationSubtitle(selected) && (
                          <span className="font-mono text-[11px]">
                            {conversationSubtitle(selected)}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500 font-medium">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Kanal:{" "}
                          {selected.channel === "whatsapp"
                            ? "WhatsApp Web"
                            : selected.channel === "email"
                            ? "Email Inbox"
                            : "Live Chat Web"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {needsWhatsAppConnection && (
                  <div className="mx-4 mt-3 flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-500 shadow-xs">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <AlertTriangle size={16} className="shrink-0" />
                      <span>WhatsApp session belum siap untuk mengirim pesan balasan.</span>
                    </div>
                    <HuntrButton
                      type="button"
                      onClick={onOpenAutomation}
                      className="shrink-0 font-bold underline underline-offset-2 hover:text-amber-600"
                    >
                      Buka Automation
                    </HuntrButton>
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
                            className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-xs shadow-xs ${
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
                                className="mb-2 block overflow-hidden rounded-xl bg-black/5"
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
                              className={`mt-1.5 block text-[10px] ${
                                isOutbound
                                  ? "text-white/75 text-right font-medium"
                                  : "text-[var(--ui-text-muted)]"
                              }`}
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
                  <div className="flex gap-2.5">
                    <HuntrTextarea
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      placeholder={
                        selected.channel === "whatsapp"
                          ? "Tulis balasan pesan WhatsApp ke pelanggan..."
                          : "Pesan hanya dapat dibalas untuk kanal WhatsApp yang terhubung"
                      }
                      rows={2}
                      disabled={needsWhatsAppConnection}
                      className={`${input} resize-none rounded-xl`}
                    />
                    <HuntrButton
                      type="button"
                      disabled={
                        sending ||
                        selected.channel !== "whatsapp" ||
                        needsWhatsAppConnection ||
                        !reply.trim()
                      }
                      onClick={() => void sendReply()}
                      className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 self-end rounded-xl bg-orange-500 px-4 text-xs font-bold text-white shadow-sm shadow-orange-500/20 transition-all hover:bg-orange-600 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Send
                        size={14}
                        className={sending ? "animate-pulse" : ""}
                      />
                      <span>{sending ? "Kirim…" : "Kirim"}</span>
                    </HuntrButton>
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
