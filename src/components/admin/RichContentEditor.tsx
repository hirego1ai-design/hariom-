"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./RichContentEditor.module.css";

type Props = {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[char] || char));
}

export default function RichContentEditor({ value, onChange, disabled = false }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [imageAlt, setImageAlt] = useState("");

  useEffect(() => {
    const el = editorRef.current;
    if (!el || document.activeElement === el) return;
    if (el.innerHTML !== value) el.innerHTML = value || "<p><br></p>";
  }, [value]);

  const wordCount = useMemo(() => {
    if (typeof window === "undefined") return 0;
    const temp = document.createElement("div");
    temp.innerHTML = value;
    const text = temp.textContent || "";
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }, [value]);

  function command(name: string, commandValue?: string) {
    if (disabled) return;
    editorRef.current?.focus();
    document.execCommand(name, false, commandValue);
    onChange(editorRef.current?.innerHTML || "");
  }

  function addLink() {
    const raw = window.prompt("Enter a URL (https://…, /internal-path, mailto: or tel:)");
    if (!raw) return;
    const url = raw.trim();
    if (!/^(https?:\/\/|\/[^/]|mailto:|tel:)/i.test(url)) {
      setUploadError("Use an HTTPS URL, an internal /path, mailto:, or tel: link.");
      return;
    }
    command("createLink", url);
  }

  function beginImageUpload(file: File | null) {
    setUploadError("");
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setUploadError("Choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Image must be 10 MB or smaller.");
      return;
    }
    setPendingFile(file);
    setImageAlt(file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim());
  }

  async function uploadImage() {
    if (!pendingFile || uploading) return;
    const alt = imageAlt.trim();
    if (!alt) {
      setUploadError("Alternative text is required for accessibility.");
      return;
    }

    setUploading(true);
    setUploadError("");
    try {
      const form = new FormData();
      form.append("file", pendingFile);
      form.append("category", "content-media");
      const response = await fetch("/api/upload", { method: "POST", body: form });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success || !payload.file?.id) {
        throw new Error(payload.error || "Image upload failed.");
      }

      editorRef.current?.focus();
      const safeAlt = escapeHtml(alt).slice(0, 180);
      const src = `/api/content/media/${payload.file.id}`;
      document.execCommand(
        "insertHTML",
        false,
        `<figure><img src="${src}" alt="${safeAlt}" loading="lazy"><figcaption>${safeAlt}</figcaption></figure><p><br></p>`,
      );
      onChange(editorRef.current?.innerHTML || "");
      setPendingFile(null);
      setImageAlt("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={styles.shell}>
      <div className={styles.toolbar} role="toolbar" aria-label="Rich text formatting">
        <select
          aria-label="Text style"
          disabled={disabled}
          defaultValue="p"
          onChange={(event) => command("formatBlock", event.target.value)}
          className={styles.select}
        >
          <option value="p">Paragraph</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
          <option value="blockquote">Quote</option>
          <option value="pre">Code block</option>
        </select>
        {[
          ["bold", "format_bold", "Bold"],
          ["italic", "format_italic", "Italic"],
          ["underline", "format_underlined", "Underline"],
          ["strikeThrough", "strikethrough_s", "Strikethrough"],
          ["insertUnorderedList", "format_list_bulleted", "Bulleted list"],
          ["insertOrderedList", "format_list_numbered", "Numbered list"],
        ].map(([name, icon, label]) => (
          <button
            key={name}
            type="button"
            title={label}
            aria-label={label}
            disabled={disabled}
            className={styles.toolButton}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => command(name)}
          >
            <span className="material-symbols-outlined text-[19px]">{icon}</span>
          </button>
        ))}
        <button type="button" className={styles.toolButton} disabled={disabled} onClick={addLink} title="Add link" aria-label="Add link">
          <span className="material-symbols-outlined text-[19px]">link</span>
        </button>
        <button type="button" className={styles.toolButton} disabled={disabled} onClick={() => command("unlink")} title="Remove link" aria-label="Remove link">
          <span className="material-symbols-outlined text-[19px]">link_off</span>
        </button>
        <button type="button" className={styles.toolButton} disabled={disabled} onClick={() => command("insertHorizontalRule")} title="Divider" aria-label="Insert divider">
          <span className="material-symbols-outlined text-[19px]">horizontal_rule</span>
        </button>
        <button type="button" className={styles.toolButton} disabled={disabled} onClick={() => fileInputRef.current?.click()} title="Insert image" aria-label="Insert image">
          <span className="material-symbols-outlined text-[19px]">image</span>
        </button>
        <button type="button" className={styles.toolButton} disabled={disabled} onClick={() => command("undo")} title="Undo" aria-label="Undo">
          <span className="material-symbols-outlined text-[19px]">undo</span>
        </button>
        <button type="button" className={styles.toolButton} disabled={disabled} onClick={() => command("redo")} title="Redo" aria-label="Redo">
          <span className="material-symbols-outlined text-[19px]">redo</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => beginImageUpload(event.target.files?.[0] || null)}
        />
      </div>

      {pendingFile && (
        <div className={styles.imagePanel}>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{pendingFile.name}</p>
            <p className="text-xs text-zinc-500">Add descriptive alternative text before inserting.</p>
          </div>
          <input
            value={imageAlt}
            onChange={(event) => setImageAlt(event.target.value)}
            maxLength={180}
            placeholder="Image alt text"
            className={styles.altInput}
          />
          <button type="button" className={styles.insertButton} disabled={uploading} onClick={() => void uploadImage()}>
            {uploading ? "Uploading…" : "Insert image"}
          </button>
          <button
            type="button"
            className={styles.cancelButton}
            disabled={uploading}
            onClick={() => {
              setPendingFile(null);
              setImageAlt("");
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {uploadError && <div role="alert" className={styles.error}>{uploadError}</div>}

      <div
        ref={editorRef}
        className={styles.editor}
        contentEditable={!disabled}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Content body"
        data-placeholder="Write your article or press release…"
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        onBlur={(event) => onChange(event.currentTarget.innerHTML)}
      />

      <div className={styles.footer}>
        <span>{wordCount.toLocaleString()} words</span>
        <span>H1 is reserved for the page title.</span>
      </div>
    </div>
  );
}
