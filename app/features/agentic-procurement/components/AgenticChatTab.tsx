import React from "react";
import { Bot, Send, Loader2 } from "lucide-react";
import { type ChatMessage } from "../types";

interface AgenticChatTabProps {
  chatMessages: ChatMessage[];
  chatInput: string;
  setChatInput: (val: string) => void;
  isChatSending: boolean;
  onSendMessage: () => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
}

export default function AgenticChatTab({
  chatMessages,
  chatInput,
  setChatInput,
  isChatSending,
  onSendMessage,
  chatEndRef,
}: AgenticChatTabProps) {
  return (
    <div className="p-4 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border)] shadow-sm flex flex-col gap-3 h-[460px]">
      <div className="border-b border-[var(--ui-border)] pb-2 flex items-center gap-2">
        <Bot size={15} className="text-orange-400" />
        <span className="font-bold text-xs text-[var(--ui-text-primary)]">
          Chat & Refinement PR
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 text-xs">
        {chatMessages.map((msg, idx) => {
          const isAi = msg.role === "assistant";
          return (
            <div
              key={idx}
              className={`flex gap-2 leading-relaxed ${isAi ? "justify-start" : "justify-end"}`}
            >
              {isAi && (
                <div className="w-6 h-6 rounded-md bg-orange-500/10 text-orange-400 flex items-center justify-center flex-shrink-0">
                  <Bot size={13} />
                </div>
              )}
              <div
                className={`p-2.5 rounded-lg max-w-[80%] whitespace-pre-wrap ${
                  isAi
                    ? "bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-primary)]"
                    : "bg-orange-500 text-white"
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        {isChatSending && (
          <div className="flex items-center gap-1.5 text-xs text-orange-400">
            <Loader2 size={13} className="animate-spin" />
            <span>AI sedang memproses...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="flex items-center gap-2 border-t border-[var(--ui-border)] pt-2">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSendMessage();
          }}
          placeholder="Tanyakan atau minta revisi (misal: kurangi laptop jadi 8 unit)..."
          disabled={isChatSending}
          className="flex-1 px-3 py-2 rounded-md bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-xs text-[var(--ui-text-primary)] outline-none focus:border-orange-500 transition-all"
        />
        <button
          onClick={onSendMessage}
          disabled={isChatSending || !chatInput.trim()}
          className="px-3 py-2 rounded-md bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1"
        >
          <Send size={13} />
          <span>Kirim</span>
        </button>
      </div>
    </div>
  );
}
