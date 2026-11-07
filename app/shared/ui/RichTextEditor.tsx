import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote,
  Undo,
  Redo,
  RemoveFormatting,
  AlignLeft,
  AlignCenter,
  Code,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number | string;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Tulis deskripsi, justifikasi, atau rincian kebutuhan...",
  minHeight = 140,
  className = "",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = useState<{ [key: string]: boolean }>({});
  const [isEmpty, setIsEmpty] = useState(!value || value === "<p><br></p>" || value.trim() === "");

  // Update active formatting states based on current selection
  const updateActiveFormats = useCallback(() => {
    if (!document || !editorRef.current) return;
    try {
      setActiveFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strikeThrough: document.queryCommandState("strikeThrough"),
        insertUnorderedList: document.queryCommandState("insertUnorderedList"),
        insertOrderedList: document.queryCommandState("insertOrderedList"),
        justifyLeft: document.queryCommandState("justifyLeft"),
        justifyCenter: document.queryCommandState("justifyCenter"),
      });
    } catch {
      // Ignored in unsupported browsers
    }
  }, []);

  // Sync internal contentEditable with external value (initial load or external reset)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      // If external value is completely empty, clear it
      if (!value) {
        editorRef.current.innerHTML = "";
        setIsEmpty(true);
      } else {
        editorRef.current.innerHTML = value;
        const text = editorRef.current.innerText || "";
        setIsEmpty(!text.trim() && !editorRef.current.querySelector("img, table"));
      }
    }
  }, [value]);

  const handleInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const text = editorRef.current.innerText || "";
    const isNowEmpty = !text.trim() && !editorRef.current.querySelector("img, table");
    setIsEmpty(isNowEmpty);
    onChange(isNowEmpty ? "" : html);
    updateActiveFormats();
  };

  const executeCommand = (command: string, arg: string | undefined = undefined) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, arg);
    handleInput();
    updateActiveFormats();
  };

  // Keyboard shortcut listener
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault();
      executeCommand("insertHTML", "&nbsp;&nbsp;&nbsp;&nbsp;");
    }
  };

  // Word count & Char count calculation
  const textContent = editorRef.current?.innerText || "";
  const wordCount = textContent.trim() ? textContent.trim().split(/\s+/).length : 0;
  const charCount = textContent.length;

  return (
    <div
      className={`rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg-input)] focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all overflow-hidden flex flex-col shadow-xs ${className}`}
    >
      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="bg-[var(--ui-bg-card)] border-b border-[var(--ui-border)] px-3 py-2 flex items-center justify-between flex-wrap gap-1.5 shrink-0 select-none">
        <div className="flex items-center flex-wrap gap-1">
          {/* Bold */}
          <button
            type="button"
            title="Tebal (Ctrl+B)"
            onClick={() => executeCommand("bold")}
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors cursor-pointer ${
              activeFormats.bold
                ? "bg-orange-500/15 text-orange-500 font-bold"
                : "text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)] hover:bg-[var(--ui-bg-input)]"
            }`}
          >
            <Bold size={13} strokeWidth={2.5} />
          </button>

          {/* Italic */}
          <button
            type="button"
            title="Miring (Ctrl+I)"
            onClick={() => executeCommand("italic")}
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors cursor-pointer ${
              activeFormats.italic
                ? "bg-orange-500/15 text-orange-500 font-bold"
                : "text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)] hover:bg-[var(--ui-bg-input)]"
            }`}
          >
            <Italic size={13} strokeWidth={2.5} />
          </button>

          {/* Underline */}
          <button
            type="button"
            title="Garis Bawah (Ctrl+U)"
            onClick={() => executeCommand("underline")}
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors cursor-pointer ${
              activeFormats.underline
                ? "bg-orange-500/15 text-orange-500 font-bold"
                : "text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)] hover:bg-[var(--ui-bg-input)]"
            }`}
          >
            <Underline size={13} strokeWidth={2.5} />
          </button>

          {/* Strikethrough */}
          <button
            type="button"
            title="Coret"
            onClick={() => executeCommand("strikeThrough")}
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors cursor-pointer ${
              activeFormats.strikeThrough
                ? "bg-orange-500/15 text-orange-500 font-bold"
                : "text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)] hover:bg-[var(--ui-bg-input)]"
            }`}
          >
            <Strikethrough size={13} strokeWidth={2} />
          </button>

          <span className="w-[1px] h-4 bg-[var(--ui-border)] mx-1" />

          {/* Heading 2 */}
          <button
            type="button"
            title="Subjudul (H2)"
            onClick={() => executeCommand("formatBlock", "<h2>")}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)] hover:bg-[var(--ui-bg-input)] transition-colors cursor-pointer"
          >
            <Heading2 size={14} strokeWidth={2} />
          </button>

          {/* Heading 3 */}
          <button
            type="button"
            title="Subjudul Kecil (H3)"
            onClick={() => executeCommand("formatBlock", "<h3>")}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)] hover:bg-[var(--ui-bg-input)] transition-colors cursor-pointer"
          >
            <Heading3 size={14} strokeWidth={2} />
          </button>

          <span className="w-[1px] h-4 bg-[var(--ui-border)] mx-1" />

          {/* Bullet List */}
          <button
            type="button"
            title="Daftar Poin (Bullet List)"
            onClick={() => executeCommand("insertUnorderedList")}
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors cursor-pointer ${
              activeFormats.insertUnorderedList
                ? "bg-orange-500/15 text-orange-500 font-bold"
                : "text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)] hover:bg-[var(--ui-bg-input)]"
            }`}
          >
            <List size={14} strokeWidth={2} />
          </button>

          {/* Numbered List */}
          <button
            type="button"
            title="Daftar Angka (Numbered List)"
            onClick={() => executeCommand("insertOrderedList")}
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors cursor-pointer ${
              activeFormats.insertOrderedList
                ? "bg-orange-500/15 text-orange-500 font-bold"
                : "text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)] hover:bg-[var(--ui-bg-input)]"
            }`}
          >
            <ListOrdered size={14} strokeWidth={2} />
          </button>

          {/* Blockquote */}
          <button
            type="button"
            title="Kutipan (Quote)"
            onClick={() => executeCommand("formatBlock", "<blockquote>")}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)] hover:bg-[var(--ui-bg-input)] transition-colors cursor-pointer"
          >
            <Quote size={13} strokeWidth={2} />
          </button>

          <span className="w-[1px] h-4 bg-[var(--ui-border)] mx-1" />

          {/* Align Left */}
          <button
            type="button"
            title="Rata Kiri"
            onClick={() => executeCommand("justifyLeft")}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)] hover:bg-[var(--ui-bg-input)] transition-colors cursor-pointer"
          >
            <AlignLeft size={13} />
          </button>

          {/* Align Center */}
          <button
            type="button"
            title="Rata Tengah"
            onClick={() => executeCommand("justifyCenter")}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)] hover:bg-[var(--ui-bg-input)] transition-colors cursor-pointer"
          >
            <AlignCenter size={13} />
          </button>

          {/* Clear Format */}
          <button
            type="button"
            title="Hapus Format"
            onClick={() => executeCommand("removeFormat")}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)] hover:bg-[var(--ui-bg-input)] transition-colors cursor-pointer"
          >
            <RemoveFormatting size={13} />
          </button>
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Urungkan (Ctrl+Z)"
            onClick={() => executeCommand("undo")}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)] hover:bg-[var(--ui-bg-input)] transition-colors cursor-pointer"
          >
            <Undo size={13} />
          </button>
          <button
            type="button"
            title="Ulangi (Ctrl+Y)"
            onClick={() => executeCommand("redo")}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)] hover:bg-[var(--ui-bg-input)] transition-colors cursor-pointer"
          >
            <Redo size={13} />
          </button>
        </div>
      </div>

      {/* ── Editor Canvas ─────────────────────────────────────────────────── */}
      <div className="relative flex-1 min-h-0">
        {isEmpty && (
          <div className="pointer-events-none absolute left-4 top-3 text-xs sm:text-sm text-[var(--ui-text-muted)] select-none leading-relaxed">
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyUp={updateActiveFormats}
          onMouseUp={updateActiveFormats}
          onKeyDown={handleKeyDown}
          style={{ minHeight: typeof minHeight === "number" ? `${minHeight}px` : minHeight }}
          className="w-full p-4 text-xs sm:text-sm text-[var(--ui-text-primary)] leading-relaxed outline-none overflow-y-auto max-h-[360px] font-normal [&_h2]:text-base [&_h2]:font-bold [&_h2]:my-2 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1.5 [&_blockquote]:border-l-4 [&_blockquote]:border-orange-500/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:my-2 [&_p]:my-1"
        />
      </div>

      {/* ── Bottom Status Bar (Word & Char Counter) ───────────────────────── */}
      <div className="px-3 py-1.5 bg-[var(--ui-bg-card)]/50 border-t border-[var(--ui-border)]/60 flex items-center justify-between text-[11px] text-[var(--ui-text-muted)] select-none">
        <span className="flex items-center gap-1 font-medium">
          Format: <b>Rich Text (HTML)</b>
        </span>
        <div className="flex items-center gap-3 font-mono text-[10px]">
          <span>{wordCount} kata</span>
          <span>·</span>
          <span>{charCount} karakter</span>
        </div>
      </div>
    </div>
  );
}

/** Utility to convert HTML string to clean plain text for previews, table snippets, or searches */
export function stripHtml(html?: string | null): string {
  if (!html) return "";
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*[\/]?>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/<[^>]*$/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/** Helper component to safely render Rich Text HTML or Plaintext fallback */
export function RenderRichText({
  content,
  className = "",
}: {
  content: string;
  className?: string;
}) {
  const isHtml = /<[a-z][\s\S]*>/i.test(content);
  if (isHtml) {
    return (
      <div
        className={`leading-relaxed [&_h2]:text-base [&_h2]:font-bold [&_h2]:my-2 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1.5 [&_blockquote]:border-l-4 [&_blockquote]:border-orange-500/50 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:my-2 [&_p]:my-1 ${className}`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }
  return (
    <p className={`whitespace-pre-wrap leading-relaxed ${className}`}>
      {content}
    </p>
  );
}

